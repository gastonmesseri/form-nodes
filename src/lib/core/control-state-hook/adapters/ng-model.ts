import { NgModel } from '@angular/forms';

import type { ControlStateAdapter } from '../control-state-adapter';
import { injectAbstractControlStateAdapter, normalizeAbstractControlName } from './abstract-control';

/** Resolves and observes a same-host `ngModel` binding. */
export const injectNgModelControlStateAdapter = <TValue>(): ControlStateAdapter<TValue> => {
  return injectAbstractControlStateAdapter<TValue>(
    'ngModel',
    directive => directive instanceof NgModel,
    directive => normalizeAbstractControlName(directive.name),
  );
};
