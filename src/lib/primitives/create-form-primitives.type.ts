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
  /**
   * Creates a field that excludes `null`, independently of the configured default.
   *
   * ```ts
   * const forms = createFormPrimitives({
   *   nullable: false,
   * });
   * const name = forms.field.strict('Ada');
   * name(); // 'Ada'
   * ```
   */
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
   *
   * ```ts
   * const forms = createFormPrimitives({
   *   nullable: false,
   * });
   * const name = forms.field.nullable('Ada');
   * name(); // 'Ada'
   * ```
   */
  nullable(value: null | undefined,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | NoInfer<NullableFieldOptions<unknown>>]
      | [
        validators: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | undefined,
        options: NoInfer<NullableFieldOptions<unknown>> | undefined
      ]
  ): FieldNode<unknown>;
  // Match field.nullable overload ordering so literal completions use the value type.
  nullable<TValue>(value: TValue | null,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<TValue | null, FieldNode<TValue | null>>> | NoInfer<NullableFieldOptions<TValue>>]
      | [
        validators: NoInfer<ValidatorSource<TValue | null, FieldNode<TValue | null>>> | undefined,
        options: NoInfer<NullableFieldOptions<TValue>> | undefined
      ]
  ): FieldNode<TValue | null>;
  nullable<TValue>(value: undefined,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<TValue | null | undefined, FieldNode<TValue | null | undefined>>> | NoInfer<FieldOptions<TValue | null | undefined>>]
      | [
        validators: NoInfer<ValidatorSource<TValue | null | undefined, FieldNode<TValue | null | undefined>>> | undefined,
        options: NoInfer<FieldOptions<TValue | null | undefined>> | undefined
      ]
  ): FieldNode<TValue | null | undefined>;
  nullable<TValue>(): FieldNode<TValue | null>;
}

export interface NonNullableFieldFactory extends FieldNullabilityOverrides {
  /**
   * Creates an unknown-valued field initialized to `null` when no initial value is supplied.
   *
   * ```ts
   * const forms = createFormPrimitives({
   *   nullable: false,
   * });
   * const node = forms.field();
   * node(); // null
   * ```
   */
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

export type FieldFactory<TNullable extends boolean | undefined> = ([TNullable] extends [false]
  ? NonNullableFieldFactory
  : [TNullable] extends [undefined]
    ? typeof import('./field').field
    : typeof import('./field').field.nullable) & FieldNullabilityOverrides;

type ConfiguredAddedNode<TDefinition, TParent extends AnyNode, TNullable extends boolean | undefined> = AddedNode<NormalizedNodeWithDefault<TDefinition, TNullable>, TParent>;

export type ConfiguredForm<TDefinitions extends ObjectNodeDefinitions, TNullable extends boolean | undefined> = {
  add<TKey extends string, TDefinition>(key: TKey extends keyof TDefinitions | '$api' ? never : TKey, definition: ObjectNodeDefinitionInput<TDefinition>): ConfiguredAddedNode<TDefinition, FormNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>, TNullable>;
  add<TAddedDefinitions extends ObjectNodeDefinitions>(definitions: TAddedDefinitions & ObjectNodeDefinitionInputs<TAddedDefinitions> & Partial<Record<keyof TDefinitions | '$api', never>>): {
    readonly [TKey in keyof TAddedDefinitions]: ConfiguredAddedNode<TAddedDefinitions[TKey], FormNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>, TNullable>;
  };
} & FormNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>;

export interface FormFactory<TNullable extends boolean | undefined> {
  /**
   * Creates an empty form while preserving configured defaults for later additions.
   *
   * ```ts
   * const forms = createFormPrimitives({
   *   nullable: false,
   * });
   * const node = forms.form();
   * node(); // {}
   * ```
   */
  (): ConfiguredForm<{}, TNullable>;
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

export interface GroupFactory<TNullable extends boolean | undefined> {
  /**
   * Creates an empty group while preserving configured defaults for later additions.
   *
   * ```ts
   * const forms = createFormPrimitives({
   *   nullable: false,
   * });
   * const node = forms.group();
   * node(); // {}
   * ```
   */
  (): ConfiguredGroup<{}, TNullable>;
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

export type ConfiguredGroup<TDefinitions extends ObjectNodeDefinitions, TNullable extends boolean | undefined> = {
  add<TKey extends string, TDefinition>(key: TKey extends keyof TDefinitions | '$api' ? never : TKey, definition: ObjectNodeDefinitionInput<TDefinition>): ConfiguredAddedNode<TDefinition, GroupNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>, TNullable>;
  add<TAddedDefinitions extends ObjectNodeDefinitions>(definitions: TAddedDefinitions & ObjectNodeDefinitionInputs<TAddedDefinitions> & Partial<Record<keyof TDefinitions | '$api', never>>): {
    readonly [TKey in keyof TAddedDefinitions]: ConfiguredAddedNode<TAddedDefinitions[TKey], GroupNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>, TNullable>;
  };
} & GroupNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>;

type ArrayTemplate = AnyNode | ObjectNodeDefinitions;
type ArrayTemplateInput<TDefinition extends ArrayTemplate> = TDefinition extends AnyNode
  ? TDefinition
  : ObjectNodeDefinitionInputs<Extract<TDefinition, ObjectNodeDefinitions>>;
type ConfiguredArrayItem<TDefinition, TNullable extends boolean | undefined> = NormalizedNodeWithDefault<TDefinition, TNullable>;
type ConfiguredArrayValue<TDefinition, TNullable extends boolean | undefined> = ArrayValue<ConfiguredArrayItem<TDefinition, TNullable>>;
type ArrayInitial<TDefinition, TNullable extends boolean | undefined> = number | ArraySet<ConfiguredArrayItem<TDefinition, TNullable>> | null | undefined;
type PositionalArrayOptions<TValue, TArray extends AnyNode = ArrayNode<AnyNode>> = Omit<ArrayOptions<TValue, TArray>, 'initialValue'>;

export interface ArrayFactory<TNullable extends boolean | undefined> {
  /**
   * Creates an empty array using a configured unknown-valued field template initialized to null.
   *
   * ```ts
   * const forms = createFormPrimitives({
   *   nullable: false,
   * });
   * const node = forms.array();
   * node(); // []
   * ```
   */
  (): ArrayNode<FieldNode<unknown>>;
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

export type FormPrimitivesOptions<TNullable extends boolean | undefined = boolean | undefined> = {
  /**
   * Reactively copies node state and constraints into matching custom-control inputs. This is
   * one-way node-to-component synchronization; it does not enable value binding, execute
   * validators, or alter node state. Use `bindInputOutputPairs` separately for input/output value pairs.
   *
   * **Default:** Omission inherits the next configuration layer; the final fallback is `false`.
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
   * createFormPrimitives({
   *   syncInputs: false,
   * });
   * ```
   *
   * ```ts
   * createFormPrimitives({
   *   syncInputs: 'declared',
   * });
   * ```
   *
   * ```ts
   * createFormPrimitives({
   *   syncInputs: 'all',
   * });
   * ```
   *
   * ```ts
   * createFormPrimitives({
   *   syncInputs: 'signal-controls',
   * });
   * ```
   *
   * ```ts
   * createFormPrimitives({
   *   syncInputs: ['required', 'minLength'],
   * });
   * ```
   *
   * ```ts
   * createFormPrimitives({
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
   * **Default:** Omission inherits the next configuration layer; the final fallback is `false`.
   *
   * **Accepted values:**
   *
   * - `true`: Connect the pair, including touch and optional focus/reset/node hooks.
   * - `false` or `null`: Disable pair connections, overriding inherited settings.
   * - `undefined`: Inherit factory, provider, or global configuration as applicable.
   *
   * Provider/global defaults are captured on connection; parent node options do not configure
   * descendants. Rebinding releases old subscriptions and node references. Inactive pairs retain
   * component input values, so use initialized inputs rather than required inputs.
   *
   * ```ts
   * createFormPrimitives({
   *   bindInputOutputPairs: true,
   * });
   * ```
   *
   * ```ts
   * createFormPrimitives({
   *   bindInputOutputPairs: false,
   * });
   * ```
   *
   * @experimental Custom-control input writes depend on Angular internals.
   * @see {@link https://form-nodes.js.org/reference/provide-form-nodes-config | Binding configuration}
   */
  bindInputOutputPairs?: boolean | null | undefined;
  /**
   * Default nullability for fields created by this primitive set.
   *
   * **Default:** Infer nullability from the generic and initial value.
   * Set true to always include null, or false to require it in the declared type.
   *
   * ```ts
   * const forms = createFormPrimitives({
   *   nullable: false,
   * });
   * const profile = forms.form({
   *   name: forms.field('Ada'),
   * });
   * ```
   */
  nullable?: TNullable;
  /**
   * Default built-in validator messages for nodes created by these factories.
   *
   * **Default:** No factory-specific message catalog.
   *
   * ```ts
   * const forms = createFormPrimitives({
   *   validatorMessages: {
   *     required: 'Required.',
   *   },
   * });
   * const profile = forms.form({
   *   name: forms.field('Ada'),
   * });
   * ```
   */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined);
  /**
   * Default injector-inheritance policy for nodes created by these factories.
   *
   * **Default:** `true`.
   *
   * ```ts
   * const forms = createFormPrimitives({
   *   inheritInjector: false,
   * });
   * const profile = forms.form({
   *   name: forms.field('Ada'),
   * });
   * ```
   */
  inheritInjector?: boolean;
  /**
   * Default host-injector adoption policy for nodes created by these factories.
   *
   * **Default:** `true`.
   *
   * ```ts
   * const forms = createFormPrimitives({
   *   adoptBindingInjector: false,
   * });
   * const profile = forms.form({
   *   name: forms.field('Ada'),
   * });
   * ```
   */
  adoptBindingInjector?: boolean;
};

export type FormPrimitives<TNullable extends boolean | undefined = boolean | undefined> = {
  field: FieldFactory<TNullable>;
  form: FormFactory<TNullable>;
  group: GroupFactory<TNullable>;
  array: ArrayFactory<TNullable>;
};
