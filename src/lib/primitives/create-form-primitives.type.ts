import type { Node } from '../types/node.type';
import type { Field, FieldOptions } from './field.type';
import type { Group, GroupOptions } from './group.type';
import type { ValidatorSource } from '../validation/validation.type';
import type { SyncInputName } from '../configuration/node-input-config';
import type { ValidatorMessages } from '../validation/validator-messages';
import type { ArrayNode, ArrayOptions, ArraySet, ArrayValue } from './array.type';
import type { AddedNode, Form, FormOptions, FormValue, NormalizedNodeWithDefault, NormalizedNodesWithDefault, ObjectNodeDefinitionInput, ObjectNodeDefinitionInputs, ObjectNodeDefinitions } from './form.type';

type NullableFieldOptions<TValue> = FieldOptions<TValue | null>;
type NonNullableFieldOptions<TValue> = FieldOptions<TValue>;

interface FieldNullabilityOverrides {
  /** Creates a field that excludes `null`, independently of the configured default. */
  strict<TValue extends {}>(value: TValue, options?: NonNullableFieldOptions<NoInfer<TValue>>): Field<TValue>;
  strict<TValue extends {}>(value: TValue, validators: ValidatorSource<NoInfer<TValue>, Field<NoInfer<TValue>>>, options?: NonNullableFieldOptions<NoInfer<TValue>>): Field<TValue>;
  /**
   * Creates a field that includes `null`, independently of the configured default.
   * The package-level `field<T>()` already returns `Field<T | null>` by default; this method is
   * useful for an explicit declaration or for overriding a non-nullable factory default.
   */
  nullable(value: null | undefined, options?: NullableFieldOptions<unknown>): Field<unknown>;
  nullable<TValue>(value: undefined, options?: FieldOptions<NoInfer<TValue | null | undefined>>): Field<TValue | null | undefined>;
  nullable<TValue>(value: TValue | null, options?: NullableFieldOptions<NoInfer<TValue>>): Field<TValue | null>;
  nullable<TValue>(): Field<TValue | null>;
  nullable(value: null | undefined, validators: ValidatorSource<unknown, Field<unknown>>, options?: NullableFieldOptions<unknown>): Field<unknown>;
  nullable<TValue>(value: undefined, validators: ValidatorSource<NoInfer<TValue | null | undefined>, Field<NoInfer<TValue | null | undefined>>>, options?: FieldOptions<NoInfer<TValue | null | undefined>>): Field<TValue | null | undefined>;
  nullable<TValue>(value: TValue | null, validators: ValidatorSource<NoInfer<TValue | null>, Field<NoInfer<TValue | null>>>, options?: NullableFieldOptions<NoInfer<TValue>>): Field<TValue | null>;
}

export interface NonNullableFieldFactory extends FieldNullabilityOverrides {
  /** Creates an unknown-valued field initialized to `null` when no initial value is supplied. */
  (): Field<unknown>;
  (value: null, options?: NullableFieldOptions<unknown>): Field<unknown>;
  (value: null, validators: ValidatorSource<unknown, Field<unknown>>, options?: NullableFieldOptions<unknown>): Field<unknown>;
  (value: undefined, options?: NullableFieldOptions<unknown>): Field<unknown>;
  (value: undefined, validators: ValidatorSource<unknown, Field<unknown>>, options?: NullableFieldOptions<unknown>): Field<unknown>;
  <TValue>(value: TValue): Field<TValue>;
  <TValue>(value: TValue, validators: ValidatorSource<NoInfer<TValue>, Field<NoInfer<TValue>>>): Field<TValue>;
  <TValue extends {}>(value: TValue, options?: NonNullableFieldOptions<NoInfer<TValue>>): Field<TValue>;
  <TValue extends {}>(value: TValue, validators: ValidatorSource<NoInfer<TValue>, Field<NoInfer<TValue>>>, options?: NonNullableFieldOptions<NoInfer<TValue>>): Field<TValue>;
}

export type FieldFactory<TNullable extends boolean> = ([TNullable] extends [false]
  ? NonNullableFieldFactory
  : typeof import('./field').field) & FieldNullabilityOverrides;

type ConfiguredAddedNode<TDefinition, TParent extends Node, TNullable extends boolean> = AddedNode<NormalizedNodeWithDefault<TDefinition, TNullable>, TParent>;

export type ConfiguredForm<TDefinitions extends ObjectNodeDefinitions, TNullable extends boolean> = {
  add<TKey extends string, TDefinition>(key: TKey extends keyof TDefinitions | '$api' ? never : TKey, definition: ObjectNodeDefinitionInput<TDefinition>): ConfiguredAddedNode<TDefinition, Form<NormalizedNodesWithDefault<TDefinitions, TNullable>>, TNullable>;
  add<TAddedDefinitions extends ObjectNodeDefinitions>(definitions: TAddedDefinitions & ObjectNodeDefinitionInputs<TAddedDefinitions> & Partial<Record<keyof TDefinitions | '$api', never>>): {
    readonly [TKey in keyof TAddedDefinitions]: ConfiguredAddedNode<TAddedDefinitions[TKey], Form<NormalizedNodesWithDefault<TDefinitions, TNullable>>, TNullable>;
  };
} & Form<NormalizedNodesWithDefault<TDefinitions, TNullable>>;

export interface FormFactory<TNullable extends boolean> {
  <TDefinitions extends ObjectNodeDefinitions>(
    definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions>,
    options?: FormOptions<NoInfer<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>>, Form<NormalizedNodesWithDefault<TDefinitions, TNullable>>>,
  ): ConfiguredForm<TDefinitions, TNullable>;
  <TDefinitions extends ObjectNodeDefinitions>(
    definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions>,
    validators: ValidatorSource<NoInfer<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>>, Form<NormalizedNodesWithDefault<TDefinitions, TNullable>>>,
    options?: FormOptions<NoInfer<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>>, Form<NormalizedNodesWithDefault<TDefinitions, TNullable>>>,
  ): ConfiguredForm<TDefinitions, TNullable>;
}

export interface GroupFactory<TNullable extends boolean> {
  <TDefinitions extends ObjectNodeDefinitions>(
    definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions>,
    options?: GroupOptions<NoInfer<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>>, Group<NormalizedNodesWithDefault<TDefinitions, TNullable>>>,
  ): ConfiguredGroup<TDefinitions, TNullable>;
  <TDefinitions extends ObjectNodeDefinitions>(
    definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions>,
    validators: ValidatorSource<NoInfer<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>>, Group<NormalizedNodesWithDefault<TDefinitions, TNullable>>>,
    options?: GroupOptions<NoInfer<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>>, Group<NormalizedNodesWithDefault<TDefinitions, TNullable>>>,
  ): ConfiguredGroup<TDefinitions, TNullable>;
}

export type ConfiguredGroup<TDefinitions extends ObjectNodeDefinitions, TNullable extends boolean> = {
  add<TKey extends string, TDefinition>(key: TKey extends keyof TDefinitions | '$api' ? never : TKey, definition: ObjectNodeDefinitionInput<TDefinition>): ConfiguredAddedNode<TDefinition, Group<NormalizedNodesWithDefault<TDefinitions, TNullable>>, TNullable>;
  add<TAddedDefinitions extends ObjectNodeDefinitions>(definitions: TAddedDefinitions & ObjectNodeDefinitionInputs<TAddedDefinitions> & Partial<Record<keyof TDefinitions | '$api', never>>): {
    readonly [TKey in keyof TAddedDefinitions]: ConfiguredAddedNode<TAddedDefinitions[TKey], Group<NormalizedNodesWithDefault<TDefinitions, TNullable>>, TNullable>;
  };
} & Group<NormalizedNodesWithDefault<TDefinitions, TNullable>>;

type ArrayTemplate = Node | ObjectNodeDefinitions;
type ArrayTemplateInput<TDefinition extends ArrayTemplate> = TDefinition extends Node
  ? TDefinition
  : ObjectNodeDefinitionInputs<Extract<TDefinition, ObjectNodeDefinitions>>;
type ConfiguredArrayItem<TDefinition, TNullable extends boolean> = NormalizedNodeWithDefault<TDefinition, TNullable>;
type ConfiguredArrayValue<TDefinition, TNullable extends boolean> = ArrayValue<ConfiguredArrayItem<TDefinition, TNullable>>;
type ArrayInitial<TDefinition, TNullable extends boolean> = number | ArraySet<ConfiguredArrayItem<TDefinition, TNullable>> | null | undefined;
type PositionalArrayOptions<TValue, TArray extends Node = ArrayNode<Node>> = Omit<ArrayOptions<TValue, TArray>, 'initialValue'>;

export interface ArrayFactory<TNullable extends boolean> {
  <TDefinition extends ArrayTemplate>(template: TDefinition & ArrayTemplateInput<TDefinition>, options?: ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(template: TDefinition & ArrayTemplateInput<TDefinition>, validators: ValidatorSource<NoInfer<ConfiguredArrayValue<TDefinition, TNullable>>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>, options?: ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(template: TDefinition & ArrayTemplateInput<TDefinition>, initial: NoInfer<ArrayInitial<TDefinition, TNullable>>, options?: PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(template: TDefinition & ArrayTemplateInput<TDefinition>, initial: NoInfer<ArrayInitial<TDefinition, TNullable>>, validators: ValidatorSource<NoInfer<ConfiguredArrayValue<TDefinition, TNullable>>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>, options?: PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(factory: () => TDefinition & ArrayTemplateInput<TDefinition>, options?: ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(factory: () => TDefinition & ArrayTemplateInput<TDefinition>, validators: ValidatorSource<NoInfer<ConfiguredArrayValue<TDefinition, TNullable>>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>, options?: ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(factory: () => TDefinition & ArrayTemplateInput<TDefinition>, initial: NoInfer<ArrayInitial<TDefinition, TNullable>>, options?: PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(factory: () => TDefinition & ArrayTemplateInput<TDefinition>, initial: NoInfer<ArrayInitial<TDefinition, TNullable>>, validators: ValidatorSource<NoInfer<ConfiguredArrayValue<TDefinition, TNullable>>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>, options?: PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
}

export type FormPrimitivesOptions<TNullable extends boolean = true> = {
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
   * Initial validators with known built-in metadata select `required`, `min`, `max`, `minLength`,
   * `maxLength`, and `pattern`. Inspecting declarations does not execute validators. Selected
   * reactive constraints and conditional validators keep updating, including their inactive or
   * empty values. Arbitrary validator compositions and validators added later do not add new
   * only-declared selections; use always mode or an input list to synchronize those constraints.
   * Removing an initially selected constraint updates that input to its neutral value.
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
   * Here this supplies the default for nodes created by the returned field/form/group/array
   * factories, including cloned array templates. A node's explicit option overrides this default;
   * its omitted or undefined option preserves the factory default. Omitting this factory option
   * leaves nodes to the provider/global fallback. Factory defaults become node options and thus
   * take precedence over providers. They are not a form-tree inheritance mechanism.
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
   * @example Share a selection and explicitly opt out for one node.
   * ```ts
   * const forms = createFormPrimitives({ syncInputs: ['disabled', 'dirty'] });
   * const profile = forms.form({
   *   name: forms.field(''),
   *   notes: forms.field('', { syncInputs: false }),
   * });
   * ```
   *
   * @experimental Uses Angular internals for optional input writes; disabled by default.
   * @see {@link https://gastonmesseri.github.io/form-nodes/reference/provide-form-nodes-config#custom-control-inputs | Full syncInputs reference}
   * @see {@link https://gastonmesseri.github.io/form-nodes/guides/custom-controls#create-a-signal-model-control | Value models and useFormNodeState without experimental input writes}
   */
  syncInputs?: boolean | 'only-declared' | 'always' | readonly SyncInputName[] | { mode: 'only-declared' | 'always'; inputs: readonly SyncInputName[] } | null | undefined;
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
