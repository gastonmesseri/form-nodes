import { InjectionToken, type Provider } from '@angular/core';

import type { FormNodeBinding } from '../types/form-node-binding.type';

export type { FormNodeBinding } from '../types/form-node-binding.type';

/** Configuration inherited by `[formNode]` bindings. */
export type FormNodeConfig = {
  /**
   * CSS class names and their reactive activation predicates.
   *
   * Each predicate runs in a reactive context. Signals read from the binding or elsewhere cause
   * that class to be reevaluated without reevaluating unrelated class predicates. The classes
   * apply to `[formNode]` bindings.
   */
  classes?: Record<string, (binding: FormNodeBinding) => boolean>;
};

/** Reactive Forms-compatible status classes for use with `provideFormNodeConfig()`. */
export const ANGULAR_FORMS_STATUS_CLASSES: NonNullable<FormNodeConfig['classes']> = {
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

/** Angular injection token containing the nearest `FormNodeConfig`. */
export const FORM_NODE_CONFIG = new InjectionToken<FormNodeConfig>('FORM_NODE_CONFIG');

/**
 * Configures reactive CSS classes for every `[formNode]` binding below this provider.
 * Angular's `provideSignalFormsConfig()` independently configures `[formField]` bindings.
 *
 * @example Configure application-wide Angular-style states and one custom class.
 * ```ts
 * import type { ApplicationConfig } from '@angular/core';
 *
 * import { ANGULAR_FORMS_STATUS_CLASSES, provideFormNodeConfig } from 'form-nodes';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideFormNodeConfig({
 *       classes: {
 *         ...ANGULAR_FORMS_STATUS_CLASSES,
 *         'is-readonly': binding => binding.node().$api.readonly(),
 *       },
 *     }),
 *   ],
 * };
 * ```
 *
 * @param config Binding configuration installed in the current Angular injector scope.
 */
export const provideFormNodeConfig = (config: {
  /** Reactive class predicates keyed by the CSS class to toggle on each supported binding. */
  classes?: Record<string, (binding: FormNodeBinding) => boolean>;
}): Provider[] => {
  return [{ provide: FORM_NODE_CONFIG, useValue: config }];
};
