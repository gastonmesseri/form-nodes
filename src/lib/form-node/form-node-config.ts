import { InjectionToken, type Provider } from '@angular/core';

import type { FormNodeBinding } from '../types/form-node-binding.type';
import { VALIDATOR_MESSAGES, type ValidatorMessages } from '../validation/validator-messages';

export type { FormNodeBinding } from '../types/form-node-binding.type';

/** Injector-scoped validator messages and configuration for `[formNode]` bindings. */
export type FormNodesConfig = {
  /** A partial catalog or a factory executed in Angular DI. Omission inherits; null supplies an empty provider catalog. */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages) | null | undefined;

  /**
   * Synchronizes matching custom-control state and constraint inputs. Inherits when omitted; null restores the default true.
   * Set false to let component defaults or template bindings own those inputs.
   * Value/checked models, interaction hooks, native controls, and CVA setDisabledState still work.
   */
  syncControlInputs?: boolean | null | undefined;

  /**
   * CSS class names and their reactive activation predicates. Omission inherits; an explicit map replaces inherited classes; null clears classes.
   *
   * Each predicate runs in a reactive context. Signals read from the binding or elsewhere cause
   * that class to be reevaluated without reevaluating unrelated class predicates. The classes
   * apply to `[formNode]` bindings.
   */
  classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
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

/* Each option has its own token so omitted options inherit independently. */
export const FORM_NODE_CLASSES = new InjectionToken<NonNullable<FormNodesConfig['classes']>>('FORM_NODE_CLASSES');

export const FORM_NODE_SYNC_CONTROL_INPUTS = new InjectionToken<boolean>('FORM_NODE_SYNC_CONTROL_INPUTS');

/**
 * Configures validator messages and `[formNode]` bindings in an application, route, module, or component.
 * Message factories run in an injection context. Each omitted option preserves its inherited provider.
 * Explicit classes replace the inherited class map without changing messages or input synchronization.
 * Null restores the selected option: no classes, synchronization enabled, or an empty message catalog.
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
 *       validatorMessages: { required: 'Please complete this field.' },
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
  /** Partial message catalog or a factory that may inject services. Omission inherits; null supplies an empty provider catalog. */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages) | null | undefined;

  /** Sync custom-control state inputs (inherits when omitted; null restores true). False preserves consumer bindings; value/checked and CVA setDisabledState remain connected. */
  syncControlInputs?: boolean | null | undefined;

  /** Reactive class predicates. Omission inherits the map; an explicit map replaces it, and null or {} clears it. */
  classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
}): Provider[] => {
  const providers: Provider[] = [];
  if (config.classes !== undefined) {
    providers.push({ provide: FORM_NODE_CLASSES, useValue: config.classes ?? {} });
  }
  if (config.syncControlInputs !== undefined) {
    providers.push({ provide: FORM_NODE_SYNC_CONTROL_INPUTS, useValue: config.syncControlInputs ?? true });
  }
  if (config.validatorMessages !== undefined) {
    providers.push(typeof config.validatorMessages === 'function'
      ? { provide: VALIDATOR_MESSAGES, useFactory: config.validatorMessages }
      : { provide: VALIDATOR_MESSAGES, useValue: config.validatorMessages ?? {} });
  }
  return providers;
};
