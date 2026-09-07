import { InjectionToken, type Provider } from '@angular/core';

import type { FormNodeBinding } from '../types/form-node-binding.type';
import { VALIDATOR_MESSAGES, type ValidatorMessages } from '../validation/validator-messages';

export type { FormNodeBinding } from '../types/form-node-binding.type';

/** Injector-scoped validator messages and configuration for `[formNode]` bindings. */
export type FormNodesConfig = {
  /** A catalog factory executed in Angular DI. Omission preserves inherited provider messages. */
  validatorMessages?: () => ValidatorMessages;

  /**
   * Synchronizes matching custom-control state and constraint inputs. Defaults to true.
   * Set false to let component defaults or template bindings own those inputs.
   * Value/checked models, interaction hooks, native controls, and CVA setDisabledState still work.
   */
  syncControlInputs?: boolean;

  /**
   * CSS class names and their reactive activation predicates.
   *
   * Each predicate runs in a reactive context. Signals read from the binding or elsewhere cause
   * that class to be reevaluated without reevaluating unrelated class predicates. The classes
   * apply to `[formNode]` bindings.
   */
  classes?: Record<string, (binding: FormNodeBinding) => boolean>;
};

/** Reactive Forms-compatible status classes for use with `provideFormNodesConfig()`. */
export const ANGULAR_FORMS_STATUS_CLASSES: NonNullable<FormNodesConfig['classes']> = {
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

/** Angular injection token containing the nearest `FormNodesConfig`. */
export const FORM_NODE_CONFIG = new InjectionToken<FormNodesConfig>('FORM_NODE_CONFIG');

/**
 * Configures validator messages and `[formNode]` bindings in an application, route, module, or component.
 * Message factories run in an injection context. Omitted sections preserve inherited providers.
 * Providing classes or syncControlInputs replaces the binding section as a whole.
 * An empty config registers no providers; use classes: {} to explicitly clear inherited classes.
 * Angular's `provideSignalFormsConfig()` independently configures `[formField]` bindings.
 *
 * @example Configure application-wide messages, Angular-style states, and one custom class.
 * ```ts
 * import type { ApplicationConfig } from '@angular/core';
 *
 * import { ANGULAR_FORMS_STATUS_CLASSES, provideFormNodesConfig } from '@ngblocks/form-nodes';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideFormNodesConfig({
 *       validatorMessages: () => ({ required: 'Please complete this field.' }),
 *       classes: {
 *         ...ANGULAR_FORMS_STATUS_CLASSES,
 *         'is-readonly': binding => binding.node().$api.readonly(),
 *       },
 *     }),
 *   ],
 * };
 * ```
 *
 * @param config Message and binding configuration installed in the current Angular injector scope.
 */
export const provideFormNodesConfig = (config: {
  /** Factory for a partial message catalog; may inject services. Omission inherits provider messages. */
  validatorMessages?: () => ValidatorMessages;

  /** Sync custom-control state inputs (default true). False preserves consumer bindings; value/checked and CVA setDisabledState remain connected. */
  syncControlInputs?: boolean;

  /** Reactive class predicates keyed by the CSS class to toggle on each supported binding. */
  classes?: Record<string, (binding: FormNodeBinding) => boolean>;
}): Provider[] => {
  const providers: Provider[] = [];
  if (config.classes !== undefined || config.syncControlInputs !== undefined) {
    providers.push({ provide: FORM_NODE_CONFIG, useValue: config });
  }
  if (config.validatorMessages !== undefined) {
    providers.push({ provide: VALIDATOR_MESSAGES, useFactory: config.validatorMessages });
  }
  return providers;
};
