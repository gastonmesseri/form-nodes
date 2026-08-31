import { FormControlName } from '@angular/forms';

import type { BoundControlAdapter } from '../bound-control-adapter';
import { injectAbstractControlBoundControl } from './abstract-control';

/** Resolves and observes a same-host `[formControlName]`. */
export const injectFormControlNameBoundControl = <TValue>(): BoundControlAdapter<TValue> => {
  return injectAbstractControlBoundControl<TValue>('formControlName', directive => directive instanceof FormControlName);
};
