import { InjectionToken, type Provider } from '@angular/core';

import type { FormNodeBinding } from '../../types/form-node-binding.type';

export type { FormNodeBinding } from '../../types/form-node-binding.type';

export type FormNodeConfig = {
  /**
   * CSS class names and their reactive activation predicates.
   *
   * Each predicate runs in a reactive context. Signals read from the binding or elsewhere cause
   * that class to be reevaluated without reevaluating unrelated class predicates.
   */
  readonly classes?: Readonly<Record<string, (binding: FormNodeBinding) => boolean>>;
};

/** Reactive Forms-compatible status classes for use with `provideFormNodeConfig()`. */
export const FORM_NODE_STATUS_CLASSES: NonNullable<FormNodeConfig['classes']> = {
  'ng-touched': (binding) => {
    return binding.node().$api.touched();
  },
  'ng-untouched': (binding) => {
    return binding.node().$api.untouched();
  },
  'ng-dirty': (binding) => {
    return binding.node().$api.dirty();
  },
  'ng-pristine': (binding) => {
    return binding.node().$api.pristine();
  },
  'ng-valid': (binding) => {
    return binding.node().$api.valid();
  },
  'ng-invalid': (binding) => {
    return binding.node().$api.invalid();
  },
  'ng-pending': (binding) => {
    return binding.node().$api.pending();
  },
};

export const FORM_NODE_CONFIG = new InjectionToken<FormNodeConfig>('FORM_NODE_CONFIG');

/** Configures automatic CSS classes for every `[formNode]` binding below this provider. */
export const provideFormNodeConfig = (config: FormNodeConfig): Provider[] => [{
  provide: FORM_NODE_CONFIG,
  useValue: config,
}];
