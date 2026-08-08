import fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { createAssistant } from './assistant.js';
import { loadContent } from './content.js';
import { TuobaoDatabase } from './database.js';
import {
  containsPersonalIdentifier,
  privacyValidationMessage,
} from './privacy.js';

export interface AppOptions {
  databasePath: string;
  contentRoot?: string;
  webRoot?: string;
  adminToken?: string;
  aiBaseUrl?: string;
  aiApiKey?: string;
  aiModel?: string;
  aiTimeoutMs?: number;
  serveStatic?: boolean;
  logger?: boolean;
}

const sessionIdSchema = z.string().min(8).max(128);

const chatSchema = z.object({
  sessionId: sessionIdSchema,
  audience: z.enum(['child', 'guardian']),
  message: z.string().trim().min(1).max(500),
});

const gameResultSchema = z.object({
  sessionId: sessionIdSchema,
  levelId: z.string().regex(/^[a-z0-9-]+$/),
  attempts: z.number().int().min(0).max(100),
  completed: z.boolean(),
  durationMs: z.number().int().min(0).max(86_400_000),
});

const feedbackSchema = z.object({
  sessionId: sessionIdSchema,
  role: z.enum(['guardian', 'institution', 'student', 'practitioner']),
  rating: z.number().int().min(1).max(5),
  tags: z.array(z.string().trim().min(1).max(32)).max(5),
  comment: z.string().trim().max(500),
});

function validationDetails(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}

export async function createApp(options: AppOptions): Promise<FastifyInstance> {
  const app = fastify({ logger: options.logger ?? false });
  const content = loadContent(options.contentRoot);
  const database = new TuobaoDatabase(options.databasePath);
  const assistant = createAssistant({
    knowledge: content.knowledge,
    ...(options.aiBaseUrl ? { aiBaseUrl: options.aiBaseUrl } : {}),
    ...(options.aiApiKey ? { aiApiKey: options.aiApiKey } : {}),
    ...(options.aiModel ? { aiModel: options.aiModel } : {}),
    ...(options.aiTimeoutMs ? { timeoutMs: options.aiTimeoutMs } : {}),
  });
  const knownLevelIds = new Set(content.levels.map((level) => level.id));
  const adminToken = options.adminToken ?? 'change-me';

  app.get('/api/health', async () => ({
    status: 'ok',
    database: 'connected',
    contentVersion: content.version,
    timestamp: new Date().toISOString(),
  }));

  app.get('/api/content/bootstrap', async () => ({
    version: content.version,
    notice: content.notice,
    levels: content.levels,
    knowledge: content.knowledge,
    features: {
      externalAiConfigured: Boolean(
        options.aiBaseUrl && options.aiApiKey && options.aiModel,
      ),
      voiceInput: 'browser-dependent',
      chatPersistence: false,
    },
  }));

  app.post('/api/assistant/chat', async (request, reply) => {
    const parsed = chatSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_request',
        details: validationDetails(parsed.error),
      });
    }
    if (containsPersonalIdentifier(parsed.data.message)) {
      return reply.code(400).send({
        error: 'personal_identifier_detected',
        message: privacyValidationMessage,
      });
    }

    const startedAt = performance.now();
    const response = await assistant(parsed.data.message, parsed.data.audience);
    database.insertAssistantEvent({
      sessionId: parsed.data.sessionId,
      audience: parsed.data.audience,
      mode: response.mode,
      category: response.category,
      durationMs: Math.round(performance.now() - startedAt),
      safetyFlag: response.mode === 'safety',
    });
    return response;
  });

  app.post('/api/game-results', async (request, reply) => {
    const parsed = gameResultSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_request',
        details: validationDetails(parsed.error),
      });
    }
    if (!knownLevelIds.has(parsed.data.levelId)) {
      return reply.code(400).send({
        error: 'unknown_level',
        message: '关卡不存在或尚未通过内容审核。',
      });
    }
    database.insertGameResult(parsed.data);
    return reply.code(201).send({ saved: true });
  });

  app.post('/api/feedback', async (request, reply) => {
    const parsed = feedbackSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'invalid_request',
        details: validationDetails(parsed.error),
      });
    }
    if (containsPersonalIdentifier(parsed.data.comment)) {
      return reply.code(400).send({
        error: 'personal_identifier_detected',
        message: privacyValidationMessage,
      });
    }
    database.insertFeedback(parsed.data);
    return reply.code(201).send({ saved: true });
  });

  app.get('/api/admin/feedback.csv', async (request, reply) => {
    const authorization = request.headers.authorization;
    if (authorization !== `Bearer ${adminToken}` || adminToken === 'change-me') {
      return reply.code(401).send({
        error: 'unauthorized',
        message: '管理令牌无效或尚未配置。',
      });
    }
    return reply
      .header('content-type', 'text/csv; charset=utf-8')
      .header(
        'content-disposition',
        'attachment; filename="tuobao-feedback.csv"',
      )
      .send(`\uFEFF${database.feedbackCsv()}`);
  });

  app.addHook('onClose', async () => {
    database.close();
  });

  const shouldServeStatic = options.serveStatic ?? true;
  const defaultWebRoot = fileURLToPath(
    new URL('../../web/dist/', import.meta.url),
  );
  const webRoot = options.webRoot ?? defaultWebRoot;
  if (shouldServeStatic && existsSync(webRoot)) {
    await app.register(fastifyStatic, {
      root: webRoot,
      prefix: '/',
    });
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/')) {
        return reply.code(404).send({ error: 'not_found' });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
