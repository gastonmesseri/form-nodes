import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import type {} from '@vitest/browser/providers/playwright';

const useSystemChrome = process.env['PLAYWRIGHT_USE_SYSTEM_CHROME'] === 'true';
const hydrationHtml = readFileSync(resolve('node_modules/.cache/ng-forms/form-node-hydration.html')).toString('base64');

export default defineConfig({
  define: {
    __FORM_NODE_HYDRATION_HTML__: JSON.stringify(hydrationHtml),
  },
  optimizeDeps: {
    include: ['@angular/platform-browser'],
  },
  test: {
    include: ['**/*.browser.spec.ts'],
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
