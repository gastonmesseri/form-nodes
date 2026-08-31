import { FormControlDirective } from '@angular/forms';

import type { BoundControlAdapter } from '../bound-control-adapter';
import { injectAbstractControlBoundControl } from './abstract-control';

/** Resolves and observes a same-host `[formControl]` without creating a CVA construction cycle. */
export const injectFormControlBoundControl = <TValue>(): BoundControlAdapter<TValue> => {
  return injectAbstractControlBoundControl<TValue>('formControl', directive => directive instanceof FormControlDirective);
};
