import { defineConfig } from 'vitest/config';

export default defineConfig({
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
    include: ['src/lib/form-node/material-*.browser.spec.ts', 'src/lib/form-node/ui-*.browser.spec.ts'],
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
});
