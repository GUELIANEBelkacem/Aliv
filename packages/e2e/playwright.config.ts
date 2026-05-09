import { defineConfig, devices } from '@playwright/test';

const PORTS = {
  jsonXml: 4001,
  qrcode: 4002,
  web: 4003,
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  use: {
    actionTimeout: 5_000,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: `pnpm --filter @aliv/json-xml exec vite preview --port ${PORTS.jsonXml} --strictPort`,
      port: PORTS.jsonXml,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: `pnpm --filter @aliv/qrcode exec vite preview --port ${PORTS.qrcode} --strictPort`,
      port: PORTS.qrcode,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: `pnpm --filter @aliv/web exec vite preview --port ${PORTS.web} --strictPort`,
      port: PORTS.web,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});

export const APP_URLS = {
  jsonXml: `http://localhost:${PORTS.jsonXml}`,
  qrcode: `http://localhost:${PORTS.qrcode}`,
  web: `http://localhost:${PORTS.web}`,
};
