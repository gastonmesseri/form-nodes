import type { AnyNode } from '../types/node.type';
import type { FieldNode, FieldOptions } from './field.type';
import type { GroupNode, GroupOptions } from './group.type';
import type { ValidatorSource } from '../validation/validation.type';
import type { SyncInputName } from '../configuration/node-input-config';
import type { ValidatorMessages } from '../validation/validator-messages';
import type { ArrayNode, ArrayOptions, ArraySet, ArrayValue } from './array.type';
import type { AddedNode, FormNode, FormOptions, FormValue, NormalizedNodeWithDefault, NormalizedNodesWithDefault, ObjectNodeDefinitionInput, ObjectNodeDefinitionInputs, ObjectNodeDefinitions } from './form.type';

type NullableFieldOptions<TValue> = FieldOptions<TValue | null>;
type NonNullableFieldOptions<TValue> = FieldOptions<TValue>;

interface FieldNullabilityOverrides {
  /** Creates a field that excludes `null`, independently of the configured default. */
  strict<TValue extends {}>(value: TValue,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<TValue, FieldNode<TValue>>> | NoInfer<NonNullableFieldOptions<TValue>>]
      | [
        validators: NoInfer<ValidatorSource<TValue, FieldNode<TValue>>> | undefined,
        options: NoInfer<NonNullableFieldOptions<TValue>> | undefined
      ]
  ): FieldNode<TValue>;
  /**
   * Creates a field that includes `null`, independently of the configured default.
   * The package-level `field<T>()` already returns `FieldNode<T | null>` by default; this method is
   * useful for an explicit declaration or for overriding a non-nullable factory default.
   */
  nullable(value: null | undefined,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | NoInfer<NullableFieldOptions<unknown>>]
      | [
        validators: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | undefined,
        options: NoInfer<NullableFieldOptions<unknown>> | undefined
      ]
  ): FieldNode<unknown>;
  nullable<TValue>(value: undefined,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<TValue | null | undefined, FieldNode<TValue | null | undefined>>> | NoInfer<FieldOptions<TValue | null | undefined>>]
      | [
        validators: NoInfer<ValidatorSource<TValue | null | undefined, FieldNode<TValue | null | undefined>>> | undefined,
        options: NoInfer<FieldOptions<TValue | null | undefined>> | undefined
      ]
  ): FieldNode<TValue | null | undefined>;
  nullable<TValue>(value: TValue | null,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<TValue | null, FieldNode<TValue | null>>> | NoInfer<NullableFieldOptions<TValue>>]
      | [
        validators: NoInfer<ValidatorSource<TValue | null, FieldNode<TValue | null>>> | undefined,
        options: NoInfer<NullableFieldOptions<TValue>> | undefined
      ]
  ): FieldNode<TValue | null>;
  nullable<TValue>(): FieldNode<TValue | null>;
}

export interface NonNullableFieldFactory extends FieldNullabilityOverrides {
  /** Creates an unknown-valued field initialized to `null` when no initial value is supplied. */
  (): FieldNode<unknown>;
  (value: null,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | NoInfer<NullableFieldOptions<unknown>>]
      | [
        validators: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | undefined,
        options: NoInfer<NullableFieldOptions<unknown>> | undefined
      ]
  ): FieldNode<unknown>;
  (value: undefined,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | NoInfer<NullableFieldOptions<unknown>>]
      | [
        validators: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | undefined,
        options: NoInfer<NullableFieldOptions<unknown>> | undefined
      ]
  ): FieldNode<unknown>;
  <TValue>(value: TValue): FieldNode<TValue>;
  <TValue>(value: TValue, validators: NoInfer<ValidatorSource<TValue, FieldNode<TValue>>>): FieldNode<TValue>;
  <TValue extends {}>(value: TValue,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<TValue, FieldNode<TValue>>> | NoInfer<NonNullableFieldOptions<TValue>>]
      | [
        validators: NoInfer<ValidatorSource<TValue, FieldNode<TValue>>> | undefined,
        options: NoInfer<NonNullableFieldOptions<TValue>> | undefined
      ]
  ): FieldNode<TValue>;
}

export type FieldFactory<TNullable extends boolean> = ([TNullable] extends [false]
  ? NonNullableFieldFactory
  : typeof import('./field').field) & FieldNullabilityOverrides;

type ConfiguredAddedNode<TDefinition, TParent extends AnyNode, TNullable extends boolean> = AddedNode<NormalizedNodeWithDefault<TDefinition, TNullable>, TParent>;

export type ConfiguredForm<TDefinitions extends ObjectNodeDefinitions, TNullable extends boolean> = {
  add<TKey extends string, TDefinition>(key: TKey extends keyof TDefinitions | '$api' ? never : TKey, definition: ObjectNodeDefinitionInput<TDefinition>): ConfiguredAddedNode<TDefinition, FormNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>, TNullable>;
  add<TAddedDefinitions extends ObjectNodeDefinitions>(definitions: TAddedDefinitions & ObjectNodeDefinitionInputs<TAddedDefinitions> & Partial<Record<keyof TDefinitions | '$api', never>>): {
    readonly [TKey in keyof TAddedDefinitions]: ConfiguredAddedNode<TAddedDefinitions[TKey], FormNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>, TNullable>;
  };
} & FormNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>;

export interface FormFactory<TNullable extends boolean> {
  <TDefinitions extends ObjectNodeDefinitions>(
    definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions>,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, FormNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>> | NoInfer<FormOptions<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, FormNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>>]
      | [
        validators: NoInfer<ValidatorSource<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, FormNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>> | undefined,
        options: NoInfer<FormOptions<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, FormNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>> | undefined
      ]
  ): ConfiguredForm<TDefinitions, TNullable>;
}

export interface GroupFactory<TNullable extends boolean> {
  <TDefinitions extends ObjectNodeDefinitions>(
    definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions>,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, GroupNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>> | NoInfer<GroupOptions<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, GroupNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>>]
      | [
        validators: NoInfer<ValidatorSource<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, GroupNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>> | undefined,
        options: NoInfer<GroupOptions<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, GroupNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>> | undefined
      ]
  ): ConfiguredGroup<TDefinitions, TNullable>;
}

export type ConfiguredGroup<TDefinitions extends ObjectNodeDefinitions, TNullable extends boolean> = {
  add<TKey extends string, TDefinition>(key: TKey extends keyof TDefinitions | '$api' ? never : TKey, definition: ObjectNodeDefinitionInput<TDefinition>): ConfiguredAddedNode<TDefinition, GroupNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>, TNullable>;
  add<TAddedDefinitions extends ObjectNodeDefinitions>(definitions: TAddedDefinitions & ObjectNodeDefinitionInputs<TAddedDefinitions> & Partial<Record<keyof TDefinitions | '$api', never>>): {
    readonly [TKey in keyof TAddedDefinitions]: ConfiguredAddedNode<TAddedDefinitions[TKey], GroupNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>, TNullable>;
  };
} & GroupNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>;

type ArrayTemplate = AnyNode | ObjectNodeDefinitions;
type ArrayTemplateInput<TDefinition extends ArrayTemplate> = TDefinition extends AnyNode
  ? TDefinition
  : ObjectNodeDefinitionInputs<Extract<TDefinition, ObjectNodeDefinitions>>;
type ConfiguredArrayItem<TDefinition, TNullable extends boolean> = NormalizedNodeWithDefault<TDefinition, TNullable>;
type ConfiguredArrayValue<TDefinition, TNullable extends boolean> = ArrayValue<ConfiguredArrayItem<TDefinition, TNullable>>;
type ArrayInitial<TDefinition, TNullable extends boolean> = number | ArraySet<ConfiguredArrayItem<TDefinition, TNullable>> | null | undefined;
type PositionalArrayOptions<TValue, TArray extends AnyNode = ArrayNode<AnyNode>> = Omit<ArrayOptions<TValue, TArray>, 'initialValue'>;

export interface ArrayFactory<TNullable extends boolean> {
  <TDefinition extends ArrayTemplate>(template: TDefinition & ArrayTemplateInput<TDefinition>,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | NoInfer<ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>>]
      | [
        validators: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined,
        options: NoInfer<ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined
      ]
  ): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(template: TDefinition & ArrayTemplateInput<TDefinition>, initial: NoInfer<ArrayInitial<TDefinition, TNullable>>,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | NoInfer<PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>>]
      | [
        validators: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined,
        options: NoInfer<PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined
      ]
  ): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(factory: () => TDefinition & ArrayTemplateInput<TDefinition>,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | NoInfer<ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>>]
      | [
        validators: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined,
        options: NoInfer<ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined
      ]
  ): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(factory: () => TDefinition & ArrayTemplateInput<TDefinition>, initial: NoInfer<ArrayInitial<TDefinition, TNullable>>,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | NoInfer<PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>>]
      | [
        validators: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined,
        options: NoInfer<PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined
      ]
  ): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
}

export type FormPrimitivesOptions<TNullable extends boolean = true> = {
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
  /** Default nullability for fields created by this primitive set. Defaults to `true`. */
  nullable?: TNullable;
  /** Default built-in validator messages for nodes created by these factories. */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined);
  /** Default injector-inheritance policy for nodes created by these factories. Defaults to `true`. */
  inheritInjector?: boolean;
  /** Default host-injector adoption policy for nodes created by these factories. Defaults to `true`. */
  adoptBindingInjector?: boolean;
};

export type FormPrimitives<TNullable extends boolean = boolean> = {
  field: FieldFactory<TNullable>;
  form: FormFactory<TNullable>;
  group: GroupFactory<TNullable>;
  array: ArrayFactory<TNullable>;
};
