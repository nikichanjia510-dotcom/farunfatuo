import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchBootstrap, saveFeedback, sendChat } from './api';

describe('static data adapter', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loads approved content without making a network request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const content = await fetchBootstrap();

    expect(content.levels.length).toBeGreaterThan(0);
    expect(content.knowledge.length).toBeGreaterThan(0);
    expect(content.features.externalAiConfigured).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('answers from the bundled knowledge base', async () => {
    const response = await sendChat({
      sessionId: 'session-test-123',
      audience: 'guardian',
      message: '怎样观察托育环境是否安全？',
    });

    expect(response.mode).toBe('kb');
    expect(response.answer.length).toBeGreaterThan(0);
    expect(response.citations.length).toBeGreaterThan(0);
  });

  it('stores anonymous feedback only in the current browser', async () => {
    await saveFeedback({
      sessionId: 'session-test-123',
      role: 'guardian',
      rating: 5,
      tags: ['界面友好'],
      comment: '适合现场演示',
    });

    const actual = JSON.parse(
      localStorage.getItem('tuobao-static-feedback-v1') ?? '[]',
    ) as Array<{ comment: string }>;
    expect(actual).toHaveLength(1);
    expect(actual[0]?.comment).toBe('适合现场演示');
  });
});
