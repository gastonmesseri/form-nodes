import type { Node } from '../types/node.type';
import type { Field, FieldOptions } from './field.type';
import type { Group, GroupOptions } from './group.type';
import type { ValidatorSource } from '../validation/validation.type';
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
  add<TKey extends string, TDefinition>(key: TKey extends keyof TDefinitions | '$api' | '$field' ? never : TKey, definition: ObjectNodeDefinitionInput<TDefinition>): ConfiguredAddedNode<TDefinition, Form<NormalizedNodesWithDefault<TDefinitions, TNullable>>, TNullable>;
  add<TAddedDefinitions extends ObjectNodeDefinitions>(definitions: TAddedDefinitions & ObjectNodeDefinitionInputs<TAddedDefinitions> & Partial<Record<keyof TDefinitions | '$api' | '$field', never>>): {
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
  add<TKey extends string, TDefinition>(key: TKey extends keyof TDefinitions | '$api' | '$field' ? never : TKey, definition: ObjectNodeDefinitionInput<TDefinition>): ConfiguredAddedNode<TDefinition, Group<NormalizedNodesWithDefault<TDefinitions, TNullable>>, TNullable>;
  add<TAddedDefinitions extends ObjectNodeDefinitions>(definitions: TAddedDefinitions & ObjectNodeDefinitionInputs<TAddedDefinitions> & Partial<Record<keyof TDefinitions | '$api' | '$field', never>>): {
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
