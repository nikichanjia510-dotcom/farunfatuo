import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './server.js';

const envCandidates = [
  resolve(process.cwd(), '.env'),
  fileURLToPath(new URL('../../../.env', import.meta.url)),
];
for (const candidate of envCandidates) {
  if (existsSync(candidate)) {
    try {
      process.loadEnvFile(candidate);
    } catch {
      // Environment variables supplied by the host remain authoritative.
    }
    break;
  }
}

const defaultDatabasePath = fileURLToPath(
  new URL('../../../data/tuobao.sqlite', import.meta.url),
);
const databasePath = process.env.DATABASE_PATH
  ? resolve(process.cwd(), process.env.DATABASE_PATH)
  : defaultDatabasePath;

const app = await createApp({
  databasePath,
  ...(process.env.CONTENT_ROOT ? { contentRoot: process.env.CONTENT_ROOT } : {}),
  ...(process.env.WEB_DIST_ROOT ? { webRoot: process.env.WEB_DIST_ROOT } : {}),
  ...(process.env.ADMIN_TOKEN ? { adminToken: process.env.ADMIN_TOKEN } : {}),
  ...(process.env.AI_BASE_URL ? { aiBaseUrl: process.env.AI_BASE_URL } : {}),
  ...(process.env.AI_API_KEY ? { aiApiKey: process.env.AI_API_KEY } : {}),
  ...(process.env.AI_MODEL ? { aiModel: process.env.AI_MODEL } : {}),
  ...(process.env.AI_TIMEOUT_MS
    ? { aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS) }
    : {}),
  logger: process.env.NODE_ENV !== 'test',
});

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
