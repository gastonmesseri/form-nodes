import { FormControlName } from '@angular/forms';

import type { ControlStateAdapter } from '../form-node-state-adapter';
import { injectAbstractControlStateAdapter, normalizeAbstractControlName } from './abstract-control';

/** Resolves and observes a same-host `[formControlName]`. */
export const injectFormControlNameStateAdapter = <TValue>(): ControlStateAdapter<TValue> => {
  return injectAbstractControlStateAdapter<TValue>(
    'formControlName',
    directive => directive instanceof FormControlName,
    directive => normalizeAbstractControlName(directive.name),
  );
};
