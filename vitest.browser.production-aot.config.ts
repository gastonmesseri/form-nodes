import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import type {} from '@vitest/browser/providers/playwright';

const useSystemChrome = process.env['PLAYWRIGHT_USE_SYSTEM_CHROME'] === 'true';
const signalControlFixture = `/@fs/${resolve('node_modules/.cache/form-nodes/aot-signal-control/form-node-signal-control.fixture.mjs')}`;

export default defineConfig({
  define: {
    __FORM_NODE_SIGNAL_CONTROL_FIXTURE__: JSON.stringify(signalControlFixture),
  },
  optimizeDeps: {
    include: ['@angular/platform-browser'],
  },
  test: {
    include: ['**/*.production-aot.spec.ts'],
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [{
        browser: 'chromium',
        ...(useSystemChrome ? { launch: { channel: 'chrome' } } : {}),
      }],
    },
  },
});
