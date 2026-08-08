import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createApp } from '../src/server.js';

describe('public API', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await createApp({
      databasePath: ':memory:',
      adminToken: 'test-admin-token',
      serveStatic: false,
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns health and approved bootstrap content', async () => {
    const health = await app.inject({ method: 'GET', url: '/api/health' });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toMatchObject({ status: 'ok', database: 'connected' });

    const bootstrap = await app.inject({
      method: 'GET',
      url: '/api/content/bootstrap',
    });
    expect(bootstrap.statusCode).toBe(200);
    expect(bootstrap.json().levels).toHaveLength(3);
    expect(
      bootstrap.json().knowledge.every(
        (item: { reviewStatus: string }) => item.reviewStatus === 'approved',
      ),
    ).toBe(true);
  });

  it('stores anonymous game results and rejects unknown levels', async () => {
    const accepted = await app.inject({
      method: 'POST',
      url: '/api/game-results',
      payload: {
        sessionId: 'session-test-123',
        levelId: 'safe-nursery',
        attempts: 3,
        completed: true,
        durationMs: 12000,
      },
    });
    expect(accepted.statusCode).toBe(201);

    const rejected = await app.inject({
      method: 'POST',
      url: '/api/game-results',
      payload: {
        sessionId: 'session-test-123',
        levelId: 'not-reviewed',
        attempts: 1,
        completed: true,
        durationMs: 1000,
      },
    });
    expect(rejected.statusCode).toBe(400);
  });

  it('rejects personal identifiers in chat and feedback', async () => {
    const chat = await app.inject({
      method: 'POST',
      url: '/api/assistant/chat',
      payload: {
        sessionId: 'session-test-123',
        audience: 'guardian',
        message: '我的电话是13800138000',
      },
    });
    expect(chat.statusCode).toBe(400);
    expect(chat.json().error).toBe('personal_identifier_detected');

    const feedback = await app.inject({
      method: 'POST',
      url: '/api/feedback',
      payload: {
        sessionId: 'session-test-123',
        role: 'guardian',
        rating: 5,
        tags: ['界面友好'],
        comment: '联系 parent@example.com',
      },
    });
    expect(feedback.statusCode).toBe(400);
  });

  it('protects and exports anonymous feedback as CSV', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/feedback',
      payload: {
        sessionId: 'session-test-123',
        role: 'guardian',
        rating: 5,
        tags: ['关卡清晰'],
        comment: '希望增加更多情景。',
      },
    });

    const unauthorized = await app.inject({
      method: 'GET',
      url: '/api/admin/feedback.csv',
    });
    expect(unauthorized.statusCode).toBe(401);

    const exported = await app.inject({
      method: 'GET',
      url: '/api/admin/feedback.csv',
      headers: { authorization: 'Bearer test-admin-token' },
    });
    expect(exported.statusCode).toBe(200);
    expect(exported.body).toContain('希望增加更多情景');
    expect(exported.headers['content-type']).toContain('text/csv');
  });
});
