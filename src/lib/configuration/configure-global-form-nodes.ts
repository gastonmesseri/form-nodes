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
   * Controls one-way, reactive synchronization from a bound Form Nodes node into matching
   * optional state and constraint inputs on its custom-control component. The library default
   * is disabled. It also gates experimental value binding for separate input/output pairs. This applies to the input contract used by Angular's `FormValueControl` and
   * `FormCheckboxControl`, and additional matching inputs on CVA components.
   *
   * Modes and selections:
   * - `false` or `null`: disable optional input writes and paired value transport, even if inherited settings enable them.
   * - `true` or `'only-declared'`: synchronize inputs selected by the node's initial declarations.
   * - `'always'`: synchronize every supported input exposed by the component, whether or not its
   *   state or constraint was declared initially. This means reactive synchronization, not polling.
   * - `['disabled', 'dirty']`: always synchronize exactly those inputs; equivalent to
   *   `{ mode: 'always', inputs: ['disabled', 'dirty'] }`.
   * - `{ mode: 'only-declared', inputs: [...] }`: synchronize only inputs that are both in the
   *   list and selected by the initial node declarations.
   * - `[]`, or an object with `inputs: []`: synchronize no optional state inputs, but enable paired value transport.
   *
   * In only-declared mode, initial `disabled`, `readonly`, and `hidden` options select their
   * matching inputs. Explicit false values count as declarations. Initial `disabled` also
   * selects `disabledReasons`, but an explicit input list still filters each name independently:
   * `['disabled']` never implicitly includes `disabledReasons`.
   *
   * Validators never select inputs in only-declared mode, including initially registered
   * built-in validators. To synchronize `required`, `min`, `max`, `minLength`, `maxLength`, or
   * `pattern`, use always mode or an explicit input list such as `['required', 'minLength']`.
   * With those selections, reactive constraints and conditional validators keep updating;
   * removing a constraint updates its input to the neutral value. Node validation runs normally
   * regardless of whether constraint inputs are synchronized.
   *
   * Supported public input names are `disabled`, `disabledReasons`, `dirty`, `errors`, `hidden`,
   * `invalid`, `max`, `maxLength`, `min`, `minLength`, `name`, `pattern`, `pending`, `readonly`,
   * `required`, and `touched`. Derived states such as dirty, touched, invalid, pending, errors,
   * and generated name require always mode or an input list. Use the public input name rather
   * than an aliased component property name. Missing component inputs are ignored; existing
   * input aliases, transforms, and Angular input lifecycle notifications are preserved.
   *
   * Selected inputs receive current node state, including false, empty, and undefined values.
   * Writes can replace component defaults and explicit template bindings. Unselected inputs
   * remain component-owned. Rebinding resolves the replacement node's selection; inputs no
   * longer selected retain their last value rather than restoring an earlier component default.
   * Treat configuration objects and arrays as fixed declarations, not reactive selection sources.
   *
   * Resolution is the node's own option (including factory defaults), then its binding's nearest
   * explicit provider, then global configuration, then false. Explicit selections replace rather
   * than merge with inherited selections. Provider/global fallback is captured when the control
   * connects; changing global configuration does not reconfigure an existing connection.
   *
   * Here this updates the process-wide default for newly connected controls below node options
   * and Angular providers. Omission or explicit `undefined` preserves the current global setting;
   * false or null disables it. The returned cleanup restores this call's previous settings without
   * overwriting later registrations. Existing connections retain their captured fallback. Prefer
   * injector-scoped providers for application- or request-specific configuration in SSR.
   *
   * This option changes component input writes, not node state, validation, or propagation.
   * `value = model()` and `checked = model()` remain connected through public model APIs in every
   * mode; they cannot be selected here. The optional node model, touch/focus/reset hooks, native
   * control binding, and CVA `setDisabledState()` keep working for the standard model/CVA paths.
   * Separate `value`/`valueChange` and `checked`/`checkedChange` pairs connect only when the effective
   * setting is enabled (any mode, list, or mode/inputs object, including empty lists). Their value
   * writes use Angular internals. Lists filter optional state inputs, not this value channel.
   * False/null pause pair writes and ignore its change/touch outputs. Rebinding to an enabled node
   * resynchronizes its current control value. Use initial input values rather than required inputs.
   * To access full supported control state without experimental
   * input writes, combine a value/checked model with `useFormNodeState()` and apply its signals
   * to the component's view; the hook does not populate the component's own input properties.
   *
   * @example Configure the fallback before application bootstrap.
   * ```ts
   * const restore = configureGlobalFormNodes({
   *   syncInputs: { mode: 'always', inputs: ['disabled', 'dirty'] },
   * });
   * // Call restore() when this registration should no longer apply to new bindings.
   * ```
   *
   * @experimental Uses Angular internals for optional input writes; disabled by default.
   * @see {@link https://gastonmesseri.github.io/form-nodes/reference/provide-form-nodes-config#custom-control-inputs | Full syncInputs reference}
   * @see {@link https://gastonmesseri.github.io/form-nodes/guides/custom-controls#create-a-signal-model-control | Value models and useFormNodeState without experimental input writes}
   */
  syncInputs?: boolean | 'only-declared' | 'always' | readonly SyncInputName[] | { mode: 'only-declared' | 'always'; inputs: readonly SyncInputName[] } | null | undefined;

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

export const getGlobalValidatorMessages = messages.read;
export const getGlobalFormNodeClasses = () => untracked(classes.read);
export const getGlobalSyncInputs = () => untracked(syncInputs.read);

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
   * Controls one-way, reactive synchronization from a bound Form Nodes node into matching
   * optional state and constraint inputs on its custom-control component. The library default
   * is disabled. It also gates experimental value binding for separate input/output pairs. This applies to the input contract used by Angular's `FormValueControl` and
   * `FormCheckboxControl`, and additional matching inputs on CVA components.
   *
   * Modes and selections:
   * - `false` or `null`: disable optional input writes and paired value transport, even if inherited settings enable them.
   * - `true` or `'only-declared'`: synchronize inputs selected by the node's initial declarations.
   * - `'always'`: synchronize every supported input exposed by the component, whether or not its
   *   state or constraint was declared initially. This means reactive synchronization, not polling.
   * - `['disabled', 'dirty']`: always synchronize exactly those inputs; equivalent to
   *   `{ mode: 'always', inputs: ['disabled', 'dirty'] }`.
   * - `{ mode: 'only-declared', inputs: [...] }`: synchronize only inputs that are both in the
   *   list and selected by the initial node declarations.
   * - `[]`, or an object with `inputs: []`: synchronize no optional state inputs, but enable paired value transport.
   *
   * In only-declared mode, initial `disabled`, `readonly`, and `hidden` options select their
   * matching inputs. Explicit false values count as declarations. Initial `disabled` also
   * selects `disabledReasons`, but an explicit input list still filters each name independently:
   * `['disabled']` never implicitly includes `disabledReasons`.
   *
   * Validators never select inputs in only-declared mode, including initially registered
   * built-in validators. To synchronize `required`, `min`, `max`, `minLength`, `maxLength`, or
   * `pattern`, use always mode or an explicit input list such as `['required', 'minLength']`.
   * With those selections, reactive constraints and conditional validators keep updating;
   * removing a constraint updates its input to the neutral value. Node validation runs normally
   * regardless of whether constraint inputs are synchronized.
   *
   * Supported public input names are `disabled`, `disabledReasons`, `dirty`, `errors`, `hidden`,
   * `invalid`, `max`, `maxLength`, `min`, `minLength`, `name`, `pattern`, `pending`, `readonly`,
   * `required`, and `touched`. Derived states such as dirty, touched, invalid, pending, errors,
   * and generated name require always mode or an input list. Use the public input name rather
   * than an aliased component property name. Missing component inputs are ignored; existing
   * input aliases, transforms, and Angular input lifecycle notifications are preserved.
   *
   * Selected inputs receive current node state, including false, empty, and undefined values.
   * Writes can replace component defaults and explicit template bindings. Unselected inputs
   * remain component-owned. Rebinding resolves the replacement node's selection; inputs no
   * longer selected retain their last value rather than restoring an earlier component default.
   * Treat configuration objects and arrays as fixed declarations, not reactive selection sources.
   *
   * Resolution is the node's own option (including factory defaults), then its binding's nearest
   * explicit provider, then global configuration, then false. Explicit selections replace rather
   * than merge with inherited selections. Provider/global fallback is captured when the control
   * connects; changing global configuration does not reconfigure an existing connection.
   *
   * Here this updates the process-wide default for newly connected controls below node options
   * and Angular providers. Omission or explicit `undefined` preserves the current global setting;
   * false or null disables it. The returned cleanup restores this call's previous settings without
   * overwriting later registrations. Existing connections retain their captured fallback. Prefer
   * injector-scoped providers for application- or request-specific configuration in SSR.
   *
   * This option changes component input writes, not node state, validation, or propagation.
   * `value = model()` and `checked = model()` remain connected through public model APIs in every
   * mode; they cannot be selected here. The optional node model, touch/focus/reset hooks, native
   * control binding, and CVA `setDisabledState()` keep working for the standard model/CVA paths.
   * Separate `value`/`valueChange` and `checked`/`checkedChange` pairs connect only when the effective
   * setting is enabled (any mode, list, or mode/inputs object, including empty lists). Their value
   * writes use Angular internals. Lists filter optional state inputs, not this value channel.
   * False/null pause pair writes and ignore its change/touch outputs. Rebinding to an enabled node
   * resynchronizes its current control value. Use initial input values rather than required inputs.
   * To access full supported control state without experimental
   * input writes, combine a value/checked model with `useFormNodeState()` and apply its signals
   * to the component's view; the hook does not populate the component's own input properties.
   *
   * @example Configure the fallback before application bootstrap.
   * ```ts
   * const restore = configureGlobalFormNodes({
   *   syncInputs: { mode: 'always', inputs: ['disabled', 'dirty'] },
   * });
   * // Call restore() when this registration should no longer apply to new bindings.
   * ```
   *
   * @experimental Uses Angular internals for optional input writes; disabled by default.
   * @see {@link https://gastonmesseri.github.io/form-nodes/reference/provide-form-nodes-config#custom-control-inputs | Full syncInputs reference}
   * @see {@link https://gastonmesseri.github.io/form-nodes/guides/custom-controls#create-a-signal-model-control | Value models and useFormNodeState without experimental input writes}
   */
  syncInputs?: boolean | 'only-declared' | 'always' | readonly SyncInputName[] | { mode: 'only-declared' | 'always'; inputs: readonly SyncInputName[] } | null | undefined;

  /** Class map for new bindings; null clears it. Explicit maps replace rather than merge. */
  classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
}): (() => void) => {
  const restore: (() => void)[] = [];
  if (config.classes !== undefined) restore.push(classes.configure(config.classes ?? {}));
  if (config.syncInputs !== undefined) restore.push(syncInputs.configure(config.syncInputs ?? false));
  if (config.validatorMessages !== undefined) restore.push(messages.configure(config.validatorMessages ?? {}));
  return () => restore.forEach(cleanup => cleanup());
};
