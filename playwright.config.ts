import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.playwright' });

import { defineConfig } from '@playwright/test';


export default defineConfig({
  testDir: './playwright/tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'https://meet.internxt.com/',
    permissions: ['camera', 'microphone'],
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
    ],
  },
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  
},
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    
  ],
});