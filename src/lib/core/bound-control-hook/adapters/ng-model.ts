import { NgModel } from '@angular/forms';

import type { BoundControlAdapter } from '../bound-control-adapter';
import { injectAbstractControlBoundControl, normalizeAbstractControlName } from './abstract-control';

/** Resolves and observes a same-host `ngModel` binding. */
export const injectNgModelBoundControl = <TValue>(): BoundControlAdapter<TValue> => {
  return injectAbstractControlBoundControl<TValue>(
    'ngModel',
    directive => directive instanceof NgModel,
    directive => normalizeAbstractControlName(directive.name),
  );
};
