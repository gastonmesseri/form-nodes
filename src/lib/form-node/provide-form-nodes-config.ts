import { InjectionToken, type Provider } from '@angular/core';

import type { FormNodeBinding } from '../types/form-node-binding.type';
import type { SyncInputs, SyncInputName } from '../configuration/node-input-config';
import { VALIDATOR_MESSAGES, type ValidatorMessages } from '../validation/validator-messages';

export type { FormNodeBinding } from '../types/form-node-binding.type';

/** Injector-scoped validator messages and configuration for `[formNode]` bindings. */
export type FormNodesConfig = {
  /** A partial catalog or a factory executed in Angular DI. Omission inherits; null supplies an empty provider catalog. */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages) | null | undefined;

  /**
   * **EXPERIMENTAL — uses Angular internals. Disabled by default.**
   *
   * Reactively copies node state and constraints into matching custom-control inputs. This is
   * one-way node-to-component synchronization; it does not enable value binding, execute
   * validators, or alter node state. Use `bindInputOutputPairs` separately for input/output value pairs.
   *
   * Selections:
   * - `false` or `null`: no additional input writes, even if inherited configuration enables them.
   * - `'declared'`: initial `disabled`, `readonly`, and `hidden` node options select their inputs.
   *   Explicit false counts; undefined does not. Declaring disabled also selects disabledReasons.
   *   Validators never select inputs in this preset, including initial built-in validators.
   * - `'all'`: every supported input exposed by the selected control, including validator constraints.
   * - `'signal-controls'`: all supported inputs, only when the selected adapter connects an actual
   *   `value` or `checked` model. A CVA takes precedence even if its component also exposes a model.
   * - `['disabled', 'required']`: exactly those supported inputs, regardless of initial declarations.
   * - `{ inputs, target }`: inputs is `'declared'`, `'all'`, or a list; target is `'all'` (default),
   *   `'signal-controls'`, or `'cva'`. Target filters the selected adapter; it never changes priority.
   *   The signal-controls preset is shorthand for `{ inputs: 'all', target: 'signal-controls' }`.
   * - `[]` or `{ inputs: [] }`: no additional writes. Empty lists never enable value connections.
   *
   * Supported input names: disabled, disabledReasons, readonly, hidden, dirty, touched, invalid,
   * pending, errors, name, required, min, max, minLength, maxLength, and pattern. Lists use public
   * input names, including aliases. Missing inputs are ignored. Selecting disabled in a list does
   * not implicitly select disabledReasons. Derived states and validator constraints require all,
   * signal-controls, or an explicit list. Every enabled selection updates reactively, not by polling.
   * Conditional constraints and validator removal update selected inputs to their current/neutral
   * values. Selected writes may replace component defaults and explicit template bindings.
   *
   * Native DOM controls retain normal value and state synchronization. CVAs retain writeValue,
   * change/touch callbacks, and setDisabledState independently of this option. Selecting a CVA's
   * disabled input may write it in addition to calling setDisabledState. Model values and their
   * touch/focus/reset hooks remain connected in every mode. Pair controls must first be enabled
   * with bindInputOutputPairs; only target all can synchronize their optional state inputs.
   *
   * Each option resolves independently: node option (including factory defaults), nearest explicit
   * provider, global fallback, then false. Omission/undefined inherits; null/false disables. Objects
   * and lists replace inherited selections without merging. A parent node option does not configure
   * descendants; use providers or factory defaults for shared settings. Provider/global fallbacks
   * are captured on connection; changing globals does not reconfigure existing bindings. Rebinding
   * uses the replacement node's configuration. Inputs no longer selected retain their last values.
   * Treat selection objects and lists as fixed configuration, not reactive sources.
   *
   * To read state without experimental writes, combine a value/checked model with useFormNodeState()
   * and render its signals. The hook does not populate the component's input properties.
   *
   * @example Select constraints only on model controls.
   * ```ts
   * field('', {
   *   syncInputs: { inputs: ['required', 'minLength'], target: 'signal-controls' },
   * });
   * provideFormNodesConfig({ syncInputs: 'signal-controls' });
   * ```
   *
   * @experimental Optional component input writes depend on Angular internals.
   * @see {@link https://gastonmesseri.github.io/form-nodes/reference/provide-form-nodes-config#custom-control-inputs | Input synchronization and adapter selection}
   */
  syncInputs?: false | 'declared' | 'all' | 'signal-controls' | readonly SyncInputName[] | { inputs: 'declared' | 'all' | readonly SyncInputName[]; target?: 'all' | 'signal-controls' | 'cva' | undefined } | null | undefined;

  /**
   * **EXPERIMENTAL — uses Angular internals. Disabled by default.**
   *
   * Enables a recognized `value`/`valueChange` or `checked`/`checkedChange` input/output pair when
   * the selected control has neither a CVA nor an actual value/checked model. Supports signal
   * inputs, decorator inputs, and their public aliases. Recognition uses runtime inputs/outputs;
   * an implements declaration is not required. CVAs and real models always take precedence and
   * keep their standard connections regardless of this option.
   *
   * True enables the pair's complete connection: node-to-input value writes, output-to-node edits,
   * touch output, optional focus/reset hooks, and optional writable node reference. Changes follow
   * normal validation, dirty state, and pending/committed debounce rules; touch commits blur updates.
   * False/null keeps the pair inactive: no value or state-input writes, no change/touch processing,
   * and no calls to its focus/reset hooks. Inactive pairs remain recognizable hosts, not errors.
   * Model/CVA/native connections and validation continue normally.
   *
   * This option does not select optional state inputs. Use syncInputs separately; for example,
   * bindInputOutputPairs true with syncInputs false connects only value and interaction. Neither all nor
   * an empty syncInputs list enables a pair. Active pairs accept syncInputs selections targeting all;
   * targets signal-controls and cva exclude them.
   *
   * Node options (including factory defaults) override the nearest explicit provider, then the
   * global fallback, then false. Undefined/omission inherits independently of syncInputs; null/false
   * disables. Parent node options do not configure descendants. Provider/global defaults are captured
   * on connection. Rebinding to an inactive node pauses the pair and releases its writable node
   * reference; existing component input values remain unchanged. Returning to an active node writes
   * its current control value again even if equal to the last value written before pausing. Cleanup
   * releases subscriptions when the binding is destroyed. Use initialized value inputs, not required
   * inputs, since an inactive pair supplies no value.
   *
   * @example Enable paired value binding independently of state inputs.
   * ```ts
   * field('', { bindInputOutputPairs: true, syncInputs: false });
   * configureGlobalFormNodes({ bindInputOutputPairs: true });
   * ```
   *
   * @experimental Pair input writes depend on Angular internals.
   * @see {@link https://gastonmesseri.github.io/form-nodes/reference/provide-form-nodes-config#bind-input-output-pairs | Paired control configuration}
   */
  bindInputOutputPairs?: boolean | null | undefined;

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

export const FORM_NODE_SYNC_INPUTS = new InjectionToken<SyncInputs>('FORM_NODE_SYNC_INPUTS');
export const FORM_NODE_BIND_INPUT_OUTPUT_PAIRS = new InjectionToken<boolean>('FORM_NODE_BIND_INPUT_OUTPUT_PAIRS');

/**
 * Configures validator messages and `[formNode]` bindings in an application, route, module, or component.
 * Message factories run in an injection context. Each omitted option preserves its inherited provider.
 * Explicit classes replace the inherited class map without changing messages or input synchronization.
 * Null restores the selected option: no classes, synchronization disabled, or an empty message catalog.
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

  /**
   * **EXPERIMENTAL — uses Angular internals. Disabled by default.**
   *
   * Reactively copies node state and constraints into matching custom-control inputs. This is
   * one-way node-to-component synchronization; it does not enable value binding, execute
   * validators, or alter node state. Use `bindInputOutputPairs` separately for input/output value pairs.
   *
   * Selections:
   * - `false` or `null`: no additional input writes, even if inherited configuration enables them.
   * - `'declared'`: initial `disabled`, `readonly`, and `hidden` node options select their inputs.
   *   Explicit false counts; undefined does not. Declaring disabled also selects disabledReasons.
   *   Validators never select inputs in this preset, including initial built-in validators.
   * - `'all'`: every supported input exposed by the selected control, including validator constraints.
   * - `'signal-controls'`: all supported inputs, only when the selected adapter connects an actual
   *   `value` or `checked` model. A CVA takes precedence even if its component also exposes a model.
   * - `['disabled', 'required']`: exactly those supported inputs, regardless of initial declarations.
   * - `{ inputs, target }`: inputs is `'declared'`, `'all'`, or a list; target is `'all'` (default),
   *   `'signal-controls'`, or `'cva'`. Target filters the selected adapter; it never changes priority.
   *   The signal-controls preset is shorthand for `{ inputs: 'all', target: 'signal-controls' }`.
   * - `[]` or `{ inputs: [] }`: no additional writes. Empty lists never enable value connections.
   *
   * Supported input names: disabled, disabledReasons, readonly, hidden, dirty, touched, invalid,
   * pending, errors, name, required, min, max, minLength, maxLength, and pattern. Lists use public
   * input names, including aliases. Missing inputs are ignored. Selecting disabled in a list does
   * not implicitly select disabledReasons. Derived states and validator constraints require all,
   * signal-controls, or an explicit list. Every enabled selection updates reactively, not by polling.
   * Conditional constraints and validator removal update selected inputs to their current/neutral
   * values. Selected writes may replace component defaults and explicit template bindings.
   *
   * Native DOM controls retain normal value and state synchronization. CVAs retain writeValue,
   * change/touch callbacks, and setDisabledState independently of this option. Selecting a CVA's
   * disabled input may write it in addition to calling setDisabledState. Model values and their
   * touch/focus/reset hooks remain connected in every mode. Pair controls must first be enabled
   * with bindInputOutputPairs; only target all can synchronize their optional state inputs.
   *
   * Each option resolves independently: node option (including factory defaults), nearest explicit
   * provider, global fallback, then false. Omission/undefined inherits; null/false disables. Objects
   * and lists replace inherited selections without merging. A parent node option does not configure
   * descendants; use providers or factory defaults for shared settings. Provider/global fallbacks
   * are captured on connection; changing globals does not reconfigure existing bindings. Rebinding
   * uses the replacement node's configuration. Inputs no longer selected retain their last values.
   * Treat selection objects and lists as fixed configuration, not reactive sources.
   *
   * To read state without experimental writes, combine a value/checked model with useFormNodeState()
   * and render its signals. The hook does not populate the component's input properties.
   *
   * @example Select constraints only on model controls.
   * ```ts
   * field('', {
   *   syncInputs: { inputs: ['required', 'minLength'], target: 'signal-controls' },
   * });
   * provideFormNodesConfig({ syncInputs: 'signal-controls' });
   * ```
   *
   * @experimental Optional component input writes depend on Angular internals.
   * @see {@link https://gastonmesseri.github.io/form-nodes/reference/provide-form-nodes-config#custom-control-inputs | Input synchronization and adapter selection}
   */
  syncInputs?: false | 'declared' | 'all' | 'signal-controls' | readonly SyncInputName[] | { inputs: 'declared' | 'all' | readonly SyncInputName[]; target?: 'all' | 'signal-controls' | 'cva' | undefined } | null | undefined;

  /**
   * **EXPERIMENTAL — uses Angular internals. Disabled by default.**
   *
   * Enables a recognized `value`/`valueChange` or `checked`/`checkedChange` input/output pair when
   * the selected control has neither a CVA nor an actual value/checked model. Supports signal
   * inputs, decorator inputs, and their public aliases. Recognition uses runtime inputs/outputs;
   * an implements declaration is not required. CVAs and real models always take precedence and
   * keep their standard connections regardless of this option.
   *
   * True enables the pair's complete connection: node-to-input value writes, output-to-node edits,
   * touch output, optional focus/reset hooks, and optional writable node reference. Changes follow
   * normal validation, dirty state, and pending/committed debounce rules; touch commits blur updates.
   * False/null keeps the pair inactive: no value or state-input writes, no change/touch processing,
   * and no calls to its focus/reset hooks. Inactive pairs remain recognizable hosts, not errors.
   * Model/CVA/native connections and validation continue normally.
   *
   * This option does not select optional state inputs. Use syncInputs separately; for example,
   * bindInputOutputPairs true with syncInputs false connects only value and interaction. Neither all nor
   * an empty syncInputs list enables a pair. Active pairs accept syncInputs selections targeting all;
   * targets signal-controls and cva exclude them.
   *
   * Node options (including factory defaults) override the nearest explicit provider, then the
   * global fallback, then false. Undefined/omission inherits independently of syncInputs; null/false
   * disables. Parent node options do not configure descendants. Provider/global defaults are captured
   * on connection. Rebinding to an inactive node pauses the pair and releases its writable node
   * reference; existing component input values remain unchanged. Returning to an active node writes
   * its current control value again even if equal to the last value written before pausing. Cleanup
   * releases subscriptions when the binding is destroyed. Use initialized value inputs, not required
   * inputs, since an inactive pair supplies no value.
   *
   * @example Enable paired value binding independently of state inputs.
   * ```ts
   * field('', { bindInputOutputPairs: true, syncInputs: false });
   * configureGlobalFormNodes({ bindInputOutputPairs: true });
   * ```
   *
   * @experimental Pair input writes depend on Angular internals.
   * @see {@link https://gastonmesseri.github.io/form-nodes/reference/provide-form-nodes-config#bind-input-output-pairs | Paired control configuration}
   */
  bindInputOutputPairs?: boolean | null | undefined;

  /** Reactive class predicates. Omission inherits the map; an explicit map replaces it, and null or {} clears it. */
  classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
}): Provider[] => {
  const providers: Provider[] = [];
  if (config.classes !== undefined) {
    providers.push({ provide: FORM_NODE_CLASSES, useValue: config.classes ?? {} });
  }
  if (config.syncInputs !== undefined) {
    providers.push({ provide: FORM_NODE_SYNC_INPUTS, useValue: config.syncInputs ?? false });
  }
  if (config.bindInputOutputPairs !== undefined) {
    providers.push({ provide: FORM_NODE_BIND_INPUT_OUTPUT_PAIRS, useValue: config.bindInputOutputPairs ?? false });
  }
  if (config.validatorMessages !== undefined) {
    providers.push(typeof config.validatorMessages === 'function'
      ? { provide: VALIDATOR_MESSAGES, useFactory: config.validatorMessages }
      : { provide: VALIDATOR_MESSAGES, useValue: config.validatorMessages ?? {} });
  }
  return providers;
};
