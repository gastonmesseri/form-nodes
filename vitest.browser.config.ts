import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import type {} from '@vitest/browser/providers/playwright';

const useSystemChrome = process.env['PLAYWRIGHT_USE_SYSTEM_CHROME'] === 'true';
const hydrationHtml = readFileSync(resolve('node_modules/.cache/form-nodes/form-node-hydration.html')).toString('base64');
const signalControlHydrationHtml = readFileSync(resolve('node_modules/.cache/form-nodes/form-node-signal-control-hydration.html')).toString('base64');
const signalControlFixture = `/@fs/${resolve('node_modules/.cache/form-nodes/aot-signal-control/form-node-signal-control.fixture.mjs')}`;

export default defineConfig({
  define: {
    __FORM_NODE_HYDRATION_HTML__: JSON.stringify(hydrationHtml),
    __FORM_NODE_SIGNAL_CONTROL_HYDRATION_HTML__: JSON.stringify(signalControlHydrationHtml),
    __FORM_NODE_SIGNAL_CONTROL_FIXTURE__: JSON.stringify(signalControlFixture),
  },
  optimizeDeps: {
    include: [
      '@angular/forms/signals',
      '@angular/platform-browser',
      '@angular/material/core',
      '@angular/material/input',
      '@angular/material/radio',
      '@angular/material/select',
      '@angular/material/checkbox',
      '@angular/material/form-field',
      '@angular/material/datepicker',
      '@angular/material-moment-adapter',
      'moment',
      'primeng/inputnumber',
      'primeng/inputmask',
      'primeng/autocomplete',
      '@angular/material/dialog',
      '@angular/core/rxjs-interop',
      'primeng/select',
      'primeng/multiselect',
      'ng-zorro-antd/select',
      '@angular/platform-browser/animations',
      'primeng/checkbox',
      'primeng/toggleswitch',
      'primeng/config',
      'ng-zorro-antd/checkbox',
      'ng-zorro-antd/switch',
      '@ng-bootstrap/ng-bootstrap',
      '@angular/localize/init',
      '@ionic/angular/ion-input',
      '@ionic/angular/ion-checkbox',
      '@ionic/angular/provide',
    ],
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
