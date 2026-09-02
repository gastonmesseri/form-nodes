import { InjectionToken, type Provider } from '@angular/core';
import { provideSignalFormsConfig, type FormFieldBinding } from '@angular/forms/signals';

import { getFormNodeBindingForAngularField } from '../../interop/angular-field';
import type { FormNodeBinding } from '../../types/form-node-binding.type';

export type { FormNodeBinding } from '../../types/form-node-binding.type';

/** Configuration inherited by `[formNode]` and interoperable Angular `[formField]` bindings. */
export type FormNodeConfig = {
  /**
   * CSS class names and their reactive activation predicates.
   *
   * Each predicate runs in a reactive context. Signals read from the binding or elsewhere cause
   * that class to be reevaluated without reevaluating unrelated class predicates. The classes
   * apply to both `[formNode]` and Angular `[formField]` bindings backed by a node's `$field`.
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
 * Configures automatic CSS classes for every `[formNode]` binding and every Angular `[formField]`
 * binding backed by `$field` below this provider.
 * Each predicate is evaluated reactively and toggles its corresponding class.
 *
 * This provider installs Angular's Signal Forms class config internally. Do not combine it with
 * `provideSignalFormsConfig({ classes })` in the same injector because Angular's config token is
 * not multi and the last provider would replace the first. Unrelated Angular field trees do not
 * receive these predicates.
 *
 * @example Configure application-wide Angular-style states and one custom class.
 * ```ts
 * import type { ApplicationConfig } from '@angular/core';
 *
 * import { ANGULAR_FORMS_STATUS_CLASSES, provideFormNodeConfig } from '@gem/ng-forms';
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
  const classes = Object.fromEntries(Object.entries(config.classes ?? {}).map(([className, predicate]) => [
    className,
    (binding: FormFieldBinding) => {
      const formNodeBinding = getFormNodeBindingForAngularField(binding);
      return formNodeBinding
        ? predicate(formNodeBinding)
        : binding.element.classList.contains(className);
    },
  ]));
  const providers: Provider[] = [
    {
      provide: FORM_NODE_CONFIG,
      useValue: config,
    },
  ];
  if (config.classes) providers.push(...provideSignalFormsConfig({ classes }));
  return providers;
};
