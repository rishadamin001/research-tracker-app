import { defineConfig, devices } from '@playwright/test';

const port = process.env.ATLAS_TEST_PORT ?? '5174';
export default defineConfig({
  testDir: './tests/e2e',
  workers: process.env.CI ? 2 : 1,
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    ...(process.env.ATLAS_FIREFOX === '1' ? [{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }] : []),
    ...(process.env.ATLAS_WEBKIT === '1' ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }] : []),
  ],
  webServer: { command: `npm run dev -- --port ${port}`, url: `http://127.0.0.1:${port}`, reuseExistingServer: !process.env.CI, timeout: 120000 },
});
