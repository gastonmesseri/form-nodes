// app.config.ts
import type { ApplicationConfig } from '@angular/core';

import { provideFormNodesConfig } from '@ngblocks/form-nodes';
import { validatorMessages } from './validator-message-catalog';

// Pass this configuration to bootstrapApplication(AppComponent, appConfig).
export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodesConfig({
      validatorMessages: () => {
        return validatorMessages;
      },
    }),
  ],
};
