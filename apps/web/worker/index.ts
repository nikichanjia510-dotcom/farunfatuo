import { createAssistant } from '../../api/src/assistant';
import {
  containsPersonalIdentifier,
  privacyValidationMessage,
} from '../../api/src/privacy';
import type {
  Audience,
  ContentBundle,
  GameLevel,
  KnowledgeItem,
} from '../../api/src/types';
import baseGamesJson from '../../../content/game-levels.json';
import expandedGamesJson from '../../../content/game-levels-expanded.json';
import knowledgeJson from '../../../content/knowledge-base.json';

interface Env {
  DB: D1Database;
  ADMIN_TOKEN?: string;
  AI_BASE_URL?: string;
  AI_API_KEY?: string;
  AI_MODEL?: string;
  AI_TIMEOUT_MS?: string;
}

interface FeedbackRow {
  id: number;
  session_id: string;
  role: string;
  rating: number;
  tags: string;
  comment: string;
  created_at: string;
}

const baseGames = baseGamesJson as {
  version: string;
  reviewStatus: 'draft' | 'approved';
  levels: GameLevel[];
};
const expandedGames = expandedGamesJson as {
  version: string;
  reviewStatus: 'draft' | 'approved';
  levels: GameLevel[];
};
const knowledgeSource = knowledgeJson as {
  version: string;
  notice: string;
  items: KnowledgeItem[];
};

const approvedKnowledge = knowledgeSource.items.filter(
  (item) => item.reviewStatus === 'approved',
);
const approvedKnowledgeIds = new Set(approvedKnowledge.map((item) => item.id));
const levels =
  baseGames.reviewStatus === 'approved' &&
  expandedGames.reviewStatus === 'approved'
    ? [...baseGames.levels, ...expandedGames.levels].filter((level) =>
        level.sourceKnowledgeIds.every((id) => approvedKnowledgeIds.has(id)),
      )
    : [];
const content: ContentBundle = {
  version: `${baseGames.version}+${knowledgeSource.version}`,
  notice: knowledgeSource.notice,
  levels,
  knowledge: approvedKnowledge,
};
const knownLevelIds = new Set(levels.map((level) => level.id));

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function validSessionId(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128;
}

function validAudience(value: unknown): value is Audience {
  return value === 'child' || value === 'guardian';
}

function escapeCsv(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

async function handleChat(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (
    !body ||
    !validSessionId(body.sessionId) ||
    !validAudience(body.audience) ||
    message.length < 1 ||
    message.length > 500
  ) {
    return json({ error: 'invalid_request', message: '问题格式不正确。' }, 400);
  }
  if (containsPersonalIdentifier(message)) {
    return json(
      {
        error: 'personal_identifier_detected',
        message: privacyValidationMessage,
      },
      400,
    );
  }

  const assistant = createAssistant({
    knowledge: content.knowledge,
    ...(env.AI_BASE_URL ? { aiBaseUrl: env.AI_BASE_URL } : {}),
    ...(env.AI_API_KEY ? { aiApiKey: env.AI_API_KEY } : {}),
    ...(env.AI_MODEL ? { aiModel: env.AI_MODEL } : {}),
    ...(env.AI_TIMEOUT_MS ? { timeoutMs: Number(env.AI_TIMEOUT_MS) } : {}),
  });
  const startedAt = performance.now();
  const response = await assistant(message, body.audience);
  await env.DB.prepare(
    `INSERT INTO assistant_events
      (session_id, audience, mode, category, duration_ms, safety_flag)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
  )
    .bind(
      body.sessionId,
      body.audience,
      response.mode,
      response.category,
      Math.round(performance.now() - startedAt),
      response.mode === 'safety' ? 1 : 0,
    )
    .run();
  return json(response);
}

async function handleGameResult(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  if (
    !body ||
    !validSessionId(body.sessionId) ||
    typeof body.levelId !== 'string' ||
    !/^[a-z0-9-]+$/.test(body.levelId) ||
    typeof body.attempts !== 'number' ||
    !Number.isInteger(body.attempts) ||
    body.attempts < 0 ||
    body.attempts > 100 ||
    typeof body.completed !== 'boolean' ||
    typeof body.durationMs !== 'number' ||
    !Number.isInteger(body.durationMs) ||
    body.durationMs < 0 ||
    body.durationMs > 86_400_000
  ) {
    return json({ error: 'invalid_request', message: '游戏记录格式不正确。' }, 400);
  }
  if (!knownLevelIds.has(body.levelId)) {
    return json(
      { error: 'unknown_level', message: '关卡不存在或尚未通过内容审核。' },
      400,
    );
  }

  await env.DB.prepare(
    `INSERT INTO game_results
      (session_id, level_id, attempts, completed, duration_ms)
     VALUES (?1, ?2, ?3, ?4, ?5)`,
  )
    .bind(
      body.sessionId,
      body.levelId,
      body.attempts,
      body.completed ? 1 : 0,
      body.durationMs,
    )
    .run();
  return json({ saved: true }, 201);
}

async function handleFeedback(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  const roles = new Set(['guardian', 'institution', 'student', 'practitioner']);
  const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';
  const tags = Array.isArray(body?.tags) ? body.tags : null;
  if (
    !body ||
    !validSessionId(body.sessionId) ||
    typeof body.role !== 'string' ||
    !roles.has(body.role) ||
    typeof body.rating !== 'number' ||
    !Number.isInteger(body.rating) ||
    body.rating < 1 ||
    body.rating > 5 ||
    !tags ||
    tags.length > 5 ||
    !tags.every(
      (tag) => typeof tag === 'string' && tag.trim().length >= 1 && tag.trim().length <= 32,
    ) ||
    comment.length > 500
  ) {
    return json({ error: 'invalid_request', message: '反馈格式不正确。' }, 400);
  }
  if (containsPersonalIdentifier(comment)) {
    return json(
      {
        error: 'personal_identifier_detected',
        message: privacyValidationMessage,
      },
      400,
    );
  }

  await env.DB.prepare(
    `INSERT INTO feedback (session_id, role, rating, tags, comment)
     VALUES (?1, ?2, ?3, ?4, ?5)`,
  )
    .bind(
      body.sessionId,
      body.role,
      body.rating,
      JSON.stringify(tags.map((tag) => (tag as string).trim())),
      comment,
    )
    .run();
  return json({ saved: true }, 201);
}

async function handleFeedbackExport(request: Request, env: Env): Promise<Response> {
  const authorization = request.headers.get('authorization');
  if (
    !env.ADMIN_TOKEN ||
    env.ADMIN_TOKEN === 'change-me' ||
    authorization !== `Bearer ${env.ADMIN_TOKEN}`
  ) {
    return json(
      { error: 'unauthorized', message: '管理令牌无效或尚未配置。' },
      401,
    );
  }

  const { results } = await env.DB.prepare(
    `SELECT id, session_id, role, rating, tags, comment, created_at
     FROM feedback ORDER BY id ASC`,
  ).all<FeedbackRow>();
  const columns: Array<keyof FeedbackRow> = [
    'id',
    'session_id',
    'role',
    'rating',
    'tags',
    'comment',
    'created_at',
  ];
  const csv = [
    columns.join(','),
    ...results.map((row) => columns.map((column) => escapeCsv(row[column])).join(',')),
  ].join('\r\n');
  return new Response(`\uFEFF${csv}`, {
    headers: {
      'cache-control': 'no-store',
      'content-disposition': 'attachment; filename="tuobao-feedback.csv"',
      'content-type': 'text/csv; charset=utf-8',
    },
  });
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/api/health') {
    return json({
      status: 'ok',
      database: 'connected',
      contentVersion: content.version,
      timestamp: new Date().toISOString(),
    });
  }
  if (request.method === 'GET' && url.pathname === '/api/content/bootstrap') {
    return json({
      version: content.version,
      notice: content.notice,
      levels: content.levels,
      knowledge: content.knowledge,
      features: {
        externalAiConfigured: Boolean(
          env.AI_BASE_URL && env.AI_API_KEY && env.AI_MODEL,
        ),
        voiceInput: 'browser-dependent',
        chatPersistence: false,
      },
    });
  }
  if (request.method === 'POST' && url.pathname === '/api/assistant/chat') {
    return handleChat(request, env);
  }
  if (request.method === 'POST' && url.pathname === '/api/game-results') {
    return handleGameResult(request, env);
  }
  if (request.method === 'POST' && url.pathname === '/api/feedback') {
    return handleFeedback(request, env);
  }
  if (request.method === 'GET' && url.pathname === '/api/admin/feedback.csv') {
    return handleFeedbackExport(request, env);
  }
  return json({ error: 'not_found' }, 404);
}

export default {
  fetch(request, env) {
    return route(request, env).catch((error: unknown) => {
      console.error(error);
      return json(
        { error: 'internal_error', message: '服务暂时不可用，请稍后重试。' },
        500,
      );
    });
  },
} satisfies ExportedHandler<Env>;
