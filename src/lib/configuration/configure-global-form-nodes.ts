import { signal, untracked } from '@angular/core';

import type { SyncInputs, SyncInputName } from './node-input-config';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import type { ValidatorMessages } from '../validation/validator-messages';

/** Process-wide defaults below injector-scoped configuration. */
export type GlobalFormNodesConfig = {
  /**
   * Static or reactive fallback catalog. Null clears it; omission preserves the current catalog.
   *
   * **Default:** Omission preserves the current global setting.
   *
   * ```ts
   * configureGlobalFormNodes({
   *   validatorMessages: {
   *     required: 'Required.',
   *   },
   * });
   * ```
   */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined) | null | undefined;

  /**
   * Reactively copies node state and constraints into matching custom-control inputs. This is
   * one-way node-to-component synchronization; it does not enable value binding, execute
   * validators, or alter node state. Use `bindInputOutputPairs` separately for input/output value pairs.
   *
   * **Default:** Omission preserves the current global setting, initially `false`; `null` resets it.
   *
   * **Accepted values:**
   *
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
   * Provider and global defaults are captured on connection. Node options override providers;
   * parent node options do not configure descendants. Lists and objects replace inherited selections.
   * Rebinding applies the new selection; inputs no longer selected retain their last values.
   *
   * Selected writes may replace component defaults and explicit template bindings. CVA value and
   * disabled-state integration remain independent. Use {@link useFormNodeState} for state observation.
   *
   * ```ts
   * configureGlobalFormNodes({
   *   syncInputs: false,
   * });
   * ```
   *
   * ```ts
   * configureGlobalFormNodes({
   *   syncInputs: 'declared',
   * });
   * ```
   *
   * ```ts
   * configureGlobalFormNodes({
   *   syncInputs: 'all',
   * });
   * ```
   *
   * ```ts
   * configureGlobalFormNodes({
   *   syncInputs: 'signal-controls',
   * });
   * ```
   *
   * ```ts
   * configureGlobalFormNodes({
   *   syncInputs: ['required', 'minLength'],
   * });
   * ```
   *
   * ```ts
   * configureGlobalFormNodes({
   *   syncInputs: {
   *     inputs: ['required'],
   *     target: 'cva',
   *   },
   * });
   * ```
   *
   * @experimental Custom-control input writes depend on Angular internals.
   * @see {@link https://form-nodes.js.org/reference/provide-form-nodes-config | Binding configuration}
   */
  syncInputs?: false | 'declared' | 'all' | 'signal-controls' | readonly SyncInputName[] | { inputs: 'declared' | 'all' | readonly SyncInputName[]; target?: 'all' | 'signal-controls' | 'cva' | undefined } | null | undefined;

  /**
   * Connects recognized value/valueChange or checked/checkedChange input/output pairs.
   * CVAs and actual model signals keep priority. Enabling a pair connects values and interaction
   * hooks; optional state inputs are selected independently by `syncInputs`.
   *
   * **Default:** Omission preserves the current global setting, initially `false`; `null` resets it.
   *
   * **Accepted values:**
   *
   * - `true`: Connect the pair, including touch and optional focus/reset/node hooks.
   * - `false` or `null`: Disable the global pair default.
   * - `undefined`: Preserve the current global setting.
   *
   * Provider/global defaults are captured on connection; parent node options do not configure
   * descendants. Rebinding releases old subscriptions and node references. Inactive pairs retain
   * component input values, so use initialized inputs rather than required inputs.
   *
   * ```ts
   * configureGlobalFormNodes({
   *   bindInputOutputPairs: true,
   * });
   * ```
   *
   * ```ts
   * configureGlobalFormNodes({
   *   bindInputOutputPairs: false,
   * });
   * ```
   *
   * @experimental Custom-control input writes depend on Angular internals.
   * @see {@link https://form-nodes.js.org/reference/provide-form-nodes-config | Binding configuration}
   */
  bindInputOutputPairs?: boolean | null | undefined;

  /**
   * Default class map for new bindings. Null clears it; explicit maps replace rather than merge.
   *
   * **Default:** Omission preserves the current global setting.
   *
   * ```ts
   * configureGlobalFormNodes({
   *   classes: {
   *     'has-errors': binding => {
   *       return binding.errors().length > 0;
   *     },
   *   },
   * });
   * ```
   */
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
const bindInputOutputPairs = globalOption(false);

export const getGlobalValidatorMessages = messages.read;
export const getGlobalFormNodeClasses = () => untracked(classes.read);
export const getGlobalSyncInputs = () => untracked(syncInputs.read);
export const getGlobalBindInputOutputPairs = () => untracked(bindInputOutputPairs.read);

/**
 * Configures process-wide defaults below Angular providers. Call before bootstrapping bindings.
 * Omitted options preserve previous settings; null restores the selected library default.
 * Classes and input synchronization are captured when bindings connect. Message sources and
 * selected message callbacks remain reactive; global sources do not receive an injection context.
 * Use providers for application- or request-specific configuration in SSR.
 *
 * Configure defaults before bootstrapApplication().
 *
 * ```ts
 * configureGlobalFormNodes({
 *   validatorMessages: {
 *     required: 'Please complete this field.',
 *   },
 *   syncInputs: false,
 * });
 * ```
 * @param config Independent global defaults to update.
 * @returns An idempotent cleanup for this call's options. Later overrides remain active;
 * previously cleaned-up overrides are skipped when those later overrides are restored.
 */
export const configureGlobalFormNodes = (config: {
  /**
   * Static or reactive fallback catalog; null clears it. This source is not a DI factory.
   *
   * **Default:** Omission preserves the current global setting.
   *
   * ```ts
   * configureGlobalFormNodes({
   *   validatorMessages: {
   *     required: 'Required.',
   *   },
   * });
   * ```
   */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined) | null | undefined;

  /**
   * Reactively copies node state and constraints into matching custom-control inputs. This is
   * one-way node-to-component synchronization; it does not enable value binding, execute
   * validators, or alter node state. Use `bindInputOutputPairs` separately for input/output value pairs.
   *
   * **Default:** Omission preserves the current global setting, initially `false`; `null` resets it.
   *
   * **Accepted values:**
   *
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
   * Provider and global defaults are captured on connection. Node options override providers;
   * parent node options do not configure descendants. Lists and objects replace inherited selections.
   * Rebinding applies the new selection; inputs no longer selected retain their last values.
   *
   * Selected writes may replace component defaults and explicit template bindings. CVA value and
   * disabled-state integration remain independent. Use {@link useFormNodeState} for state observation.
   *
   * ```ts
   * configureGlobalFormNodes({
   *   syncInputs: false,
   * });
   * ```
   *
   * ```ts
   * configureGlobalFormNodes({
   *   syncInputs: 'declared',
   * });
   * ```
   *
   * ```ts
   * configureGlobalFormNodes({
   *   syncInputs: 'all',
   * });
   * ```
   *
   * ```ts
   * configureGlobalFormNodes({
   *   syncInputs: 'signal-controls',
   * });
   * ```
   *
   * ```ts
   * configureGlobalFormNodes({
   *   syncInputs: ['required', 'minLength'],
   * });
   * ```
   *
   * ```ts
   * configureGlobalFormNodes({
   *   syncInputs: {
   *     inputs: ['required'],
   *     target: 'cva',
   *   },
   * });
   * ```
   *
   * @experimental Custom-control input writes depend on Angular internals.
   * @see {@link https://form-nodes.js.org/reference/provide-form-nodes-config | Binding configuration}
   */
  syncInputs?: false | 'declared' | 'all' | 'signal-controls' | readonly SyncInputName[] | { inputs: 'declared' | 'all' | readonly SyncInputName[]; target?: 'all' | 'signal-controls' | 'cva' | undefined } | null | undefined;

  /**
   * Connects recognized value/valueChange or checked/checkedChange input/output pairs.
   * CVAs and actual model signals keep priority. Enabling a pair connects values and interaction
   * hooks; optional state inputs are selected independently by `syncInputs`.
   *
   * **Default:** Omission preserves the current global setting, initially `false`; `null` resets it.
   *
   * **Accepted values:**
   *
   * - `true`: Connect the pair, including touch and optional focus/reset/node hooks.
   * - `false` or `null`: Disable the global pair default.
   * - `undefined`: Preserve the current global setting.
   *
   * Provider/global defaults are captured on connection; parent node options do not configure
   * descendants. Rebinding releases old subscriptions and node references. Inactive pairs retain
   * component input values, so use initialized inputs rather than required inputs.
   *
   * ```ts
   * configureGlobalFormNodes({
   *   bindInputOutputPairs: true,
   * });
   * ```
   *
   * ```ts
   * configureGlobalFormNodes({
   *   bindInputOutputPairs: false,
   * });
   * ```
   *
   * @experimental Custom-control input writes depend on Angular internals.
   * @see {@link https://form-nodes.js.org/reference/provide-form-nodes-config | Binding configuration}
   */
  bindInputOutputPairs?: boolean | null | undefined;

  /**
   * Class map for new bindings; null clears it. Explicit maps replace rather than merge.
   *
   * **Default:** Omission preserves the current global setting.
   *
   * ```ts
   * configureGlobalFormNodes({
   *   classes: {
   *     'has-errors': binding => {
   *       return binding.errors().length > 0;
   *     },
   *   },
   * });
   * ```
   */
  classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
}): (() => void) => {
  const restore: (() => void)[] = [];
  if (config.classes !== undefined) restore.push(classes.configure(config.classes ?? {}));
  if (config.syncInputs !== undefined) restore.push(syncInputs.configure(config.syncInputs ?? false));
  if (config.bindInputOutputPairs !== undefined) restore.push(bindInputOutputPairs.configure(config.bindInputOutputPairs ?? false));
  if (config.validatorMessages !== undefined) restore.push(messages.configure(config.validatorMessages ?? {}));
  return () => restore.forEach(cleanup => cleanup());
};
