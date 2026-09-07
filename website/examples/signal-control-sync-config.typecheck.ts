import type { ApplicationConfig } from '@angular/core';
import { provideFormNodesConfig } from '@ngblocks/form-nodes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormNodesConfig({ syncInputs: 'only-signal-controls' }),
  ],
};
