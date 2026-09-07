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
   * Here this configures bindings in this Angular injector scope. Omission or explicit `undefined`
   * registers no override and preserves the nearest inherited provider, then global fallback.
   * False or null explicitly opts out. Node options, including configured factory defaults, have
   * higher precedence. This option inherits independently from classes and validator messages;
   * configuring it does not replace either of those sections.
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
   * @example Configure an injector-wide selection and override one node.
   * ```ts
   * // Include this provider in application or component providers.
   * provideFormNodesConfig({ syncInputs: ['disabled', 'dirty'] });
   * // A node can select a different mode and input list.
   * field('', { syncInputs: { mode: 'always', inputs: ['required'] } });
   * ```
   *
   * @experimental Uses Angular internals for optional input writes; disabled by default.
   * @see {@link https://gastonmesseri.github.io/form-nodes/reference/provide-form-nodes-config#custom-control-inputs | Full syncInputs reference}
   * @see {@link https://gastonmesseri.github.io/form-nodes/guides/custom-controls#create-a-signal-model-control | Value models and useFormNodeState without experimental input writes}
   */
  syncInputs?: boolean | 'only-declared' | 'always' | readonly SyncInputName[] | { mode: 'only-declared' | 'always'; inputs: readonly SyncInputName[] } | null | undefined;

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
   * Here this configures bindings in this Angular injector scope. Omission or explicit `undefined`
   * registers no override and preserves the nearest inherited provider, then global fallback.
   * False or null explicitly opts out. Node options, including configured factory defaults, have
   * higher precedence. This option inherits independently from classes and validator messages;
   * configuring it does not replace either of those sections.
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
   * @example Configure an injector-wide selection and override one node.
   * ```ts
   * // Include this provider in application or component providers.
   * provideFormNodesConfig({ syncInputs: ['disabled', 'dirty'] });
   * // A node can select a different mode and input list.
   * field('', { syncInputs: { mode: 'always', inputs: ['required'] } });
   * ```
   *
   * @experimental Uses Angular internals for optional input writes; disabled by default.
   * @see {@link https://gastonmesseri.github.io/form-nodes/reference/provide-form-nodes-config#custom-control-inputs | Full syncInputs reference}
   * @see {@link https://gastonmesseri.github.io/form-nodes/guides/custom-controls#create-a-signal-model-control | Value models and useFormNodeState without experimental input writes}
   */
  syncInputs?: boolean | 'only-declared' | 'always' | readonly SyncInputName[] | { mode: 'only-declared' | 'always'; inputs: readonly SyncInputName[] } | null | undefined;

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
  if (config.validatorMessages !== undefined) {
    providers.push(typeof config.validatorMessages === 'function'
      ? { provide: VALIDATOR_MESSAGES, useFactory: config.validatorMessages }
      : { provide: VALIDATOR_MESSAGES, useValue: config.validatorMessages ?? {} });
  }
  return providers;
};
