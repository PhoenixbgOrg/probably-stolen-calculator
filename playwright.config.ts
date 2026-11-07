import { defineConfig, devices } from '@playwright/test';

const BASE = '/probably-stolen-calculator/';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:4173${BASE}`,
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command:
      'export VITE_BASE_PATH=/probably-stolen-calculator/; npm run build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort --base /probably-stolen-calculator/',
    url: `http://127.0.0.1:4173${BASE}`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
