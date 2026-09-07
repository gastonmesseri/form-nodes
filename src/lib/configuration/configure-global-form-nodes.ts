import { signal, untracked } from '@angular/core';

import type { SyncInputs, SyncInputName } from './node-input-config';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import type { ValidatorMessages } from '../validation/validator-messages';

/** Process-wide defaults below injector-scoped configuration. */
export type GlobalFormNodesConfig = {
  /** Static or reactive fallback catalog. Null clears it; omission preserves the current catalog. */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined) | null | undefined;

  /**
   * **EXPERIMENTAL — uses Angular internals. Disabled by default.**
   *
   * Reactively copies node state and constraints into matching custom-control inputs. This is
   * one-way node-to-component synchronization; it does not enable value binding, execute
   * validators, or alter node state. Use `bindValuePairs` separately for input/output value pairs.
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
   * with bindValuePairs; only target all can synchronize their optional state inputs.
   *
   * Each option resolves independently: node option (including factory defaults), nearest explicit
   * provider, global fallback, then false. Omission/undefined inherits; null/false disables. Objects
   * and lists replace inherited selections without merging. A parent node option does not configure
   * descendants; use providers or factory defaults for shared settings. Provider/global fallbacks
   * are captured on connection; changing globals does not reconfigure existing bindings. Rebinding
   * uses the replacement node's configuration. Inputs no longer selected retain their last values.
   * Treat selection objects and lists as fixed configuration, not reactive sources.
   * In a global configuration call, omission/undefined preserves the existing global setting;
   * null/false resets it to disabled. The returned cleanup restores that registration.
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
   * bindValuePairs true with syncInputs false connects only value and interaction. Neither all nor
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
   * In a global configuration call, omission/undefined preserves the existing global setting;
   * null/false resets it to disabled. The returned cleanup restores that registration.
   *
   * @example Enable paired value binding independently of state inputs.
   * ```ts
   * field('', { bindValuePairs: true, syncInputs: false });
   * configureGlobalFormNodes({ bindValuePairs: true });
   * ```
   *
   * @experimental Pair input writes depend on Angular internals.
   * @see {@link https://gastonmesseri.github.io/form-nodes/reference/provide-form-nodes-config#bind-value-pairs | Paired control configuration}
   */
  bindValuePairs?: boolean | null | undefined;

  /** Default class map for new bindings. Null clears it; explicit maps replace rather than merge. */
  classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
};

type Registration<T> = {
  value: T;
  active: boolean;
  previous: Registration<T> | null;
};

const globalOption = <T>(initial: T) => {
  const current = signal<Registration<T>>({ value: initial, active: true, previous: null });
  return {
    read: () => current().value,
    configure(value: T) {
      const registration: Registration<T> = { value, active: true, previous: untracked(current) };
      current.set(registration);
      return () => {
        if (!registration.active) return;
        registration.active = false;
        if (untracked(current) !== registration) return;
        let previous = registration.previous!;
        while (!previous.active) previous = previous.previous!;
        current.set(previous);
      };
    },
  };
};

const messages = globalOption<ValidatorMessages | (() => ValidatorMessages | undefined)>({});
const classes = globalOption<Record<string, (binding: FormNodeBinding) => boolean>>({});
const syncInputs = globalOption<SyncInputs>(false);
const bindValuePairs = globalOption(false);

export const getGlobalValidatorMessages = messages.read;
export const getGlobalFormNodeClasses = () => untracked(classes.read);
export const getGlobalSyncInputs = () => untracked(syncInputs.read);
export const getGlobalBindValuePairs = () => untracked(bindValuePairs.read);

/**
 * Configures process-wide defaults below Angular providers. Call before bootstrapping bindings.
 * Omitted options preserve previous settings; null restores the selected library default.
 * Classes and input synchronization are captured when bindings connect. Message sources and
 * selected message callbacks remain reactive; global sources do not receive an injection context.
 * Use providers for application- or request-specific configuration in SSR.
 *
 * @example Configure defaults before bootstrapApplication().
 * ```ts
 * configureGlobalFormNodes({
 *   validatorMessages: { required: 'Please complete this field.' },
 *   syncInputs: false,
 * });
 * ```
 *
 * @param config Independent global defaults to update.
 * @returns An idempotent cleanup for this call's options. Later overrides remain active;
 * previously cleaned-up overrides are skipped when those later overrides are restored.
 */
export const configureGlobalFormNodes = (config: {
  /** Static or reactive fallback catalog; null clears it. This source is not a DI factory. */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined) | null | undefined;

  /**
   * **EXPERIMENTAL — uses Angular internals. Disabled by default.**
   *
   * Reactively copies node state and constraints into matching custom-control inputs. This is
   * one-way node-to-component synchronization; it does not enable value binding, execute
   * validators, or alter node state. Use `bindValuePairs` separately for input/output value pairs.
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
   * with bindValuePairs; only target all can synchronize their optional state inputs.
   *
   * Each option resolves independently: node option (including factory defaults), nearest explicit
   * provider, global fallback, then false. Omission/undefined inherits; null/false disables. Objects
   * and lists replace inherited selections without merging. A parent node option does not configure
   * descendants; use providers or factory defaults for shared settings. Provider/global fallbacks
   * are captured on connection; changing globals does not reconfigure existing bindings. Rebinding
   * uses the replacement node's configuration. Inputs no longer selected retain their last values.
   * Treat selection objects and lists as fixed configuration, not reactive sources.
   * In a global configuration call, omission/undefined preserves the existing global setting;
   * null/false resets it to disabled. The returned cleanup restores that registration.
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
   * bindValuePairs true with syncInputs false connects only value and interaction. Neither all nor
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
   * In a global configuration call, omission/undefined preserves the existing global setting;
   * null/false resets it to disabled. The returned cleanup restores that registration.
   *
   * @example Enable paired value binding independently of state inputs.
   * ```ts
   * field('', { bindValuePairs: true, syncInputs: false });
   * configureGlobalFormNodes({ bindValuePairs: true });
   * ```
   *
   * @experimental Pair input writes depend on Angular internals.
   * @see {@link https://gastonmesseri.github.io/form-nodes/reference/provide-form-nodes-config#bind-value-pairs | Paired control configuration}
   */
  bindValuePairs?: boolean | null | undefined;

  /** Class map for new bindings; null clears it. Explicit maps replace rather than merge. */
  classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
}): (() => void) => {
  const restore: (() => void)[] = [];
  if (config.classes !== undefined) restore.push(classes.configure(config.classes ?? {}));
  if (config.syncInputs !== undefined) restore.push(syncInputs.configure(config.syncInputs ?? false));
  if (config.bindValuePairs !== undefined) restore.push(bindValuePairs.configure(config.bindValuePairs ?? false));
  if (config.validatorMessages !== undefined) restore.push(messages.configure(config.validatorMessages ?? {}));
  return () => restore.forEach(cleanup => cleanup());
};
