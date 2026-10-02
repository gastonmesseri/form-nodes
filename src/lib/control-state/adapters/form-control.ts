import { FormControlDirective } from '@angular/forms';

import type { ControlStateAdapter } from '../control-state-adapter';
import { injectAbstractControlStateAdapter } from './abstract-control';

/** Resolves and observes a same-host `[formControl]` without creating a CVA construction cycle. */
export const injectFormControlStateAdapter = <TValue>(): ControlStateAdapter<TValue> => {
  return injectAbstractControlStateAdapter<TValue>('formControl', directive => directive instanceof FormControlDirective);
};
