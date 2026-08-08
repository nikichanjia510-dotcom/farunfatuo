import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    ...(process.platform === 'win32' ? { channel: 'msedge' } : {}),
  },
  webServer: [
    {
      command: 'pnpm --filter @tuobao/api exec tsx src/index.ts',
      url: 'http://127.0.0.1:3000/api/health',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'pnpm --filter @tuobao/web dev',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
