import type { ApplicationConfig } from '@angular/core';
import { provideValidatorMessages } from 'form-nodes';

import { validatorMessages } from './validator-message-catalog';

// app.config.ts: pass this configuration to bootstrapApplication(AppComponent, appConfig).
export const appConfig: ApplicationConfig = {
  providers: [
    provideValidatorMessages(() => {
      return validatorMessages;
    }),
  ],
};
