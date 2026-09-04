import type { Node } from '../types/node.type';
import type { Field, FieldOptions } from './field.type';
import type { Group, GroupOptions } from './group.type';
import type { ValidatorSource } from '../validation/validation.type';
import type { ArrayNode, ArrayOptions, ArraySet, ArrayValue } from './array.type';
import type { AddedNode, Form, FormOptions, FormValue, NormalizedNodeWithDefault, NormalizedNodesWithDefault, ObjectNodeDefinitionInput, ObjectNodeDefinitionInputs, ObjectNodeDefinitions } from './form.type';

type NullableFieldOptions<TValue> = FieldOptions<TValue | null> & { nullable?: true };
type NonNullableFieldOptions<TValue> = FieldOptions<TValue> & { nullable?: false };

export interface NonNullableFieldFactory {
  (value: null, options?: NullableFieldOptions<unknown>): Field<unknown>;
  (value: null, validators: ValidatorSource<unknown>, options?: NullableFieldOptions<unknown>): Field<unknown>;
  (value: undefined, options?: NullableFieldOptions<unknown>): Field<unknown>;
  (value: undefined, validators: ValidatorSource<unknown>, options?: NullableFieldOptions<unknown>): Field<unknown>;
  <TValue>(value: TValue): Field<TValue>;
  <TValue>(value: TValue, validators: ValidatorSource<NoInfer<TValue>>): Field<TValue>;
  <TValue extends {}>(value: TValue, options?: NonNullableFieldOptions<NoInfer<TValue>>): Field<TValue>;
  <TValue extends {}>(value: TValue, validators: ValidatorSource<NoInfer<TValue>>, options?: NonNullableFieldOptions<NoInfer<TValue>>): Field<TValue>;
  <TValue>(value: TValue | null, options: NullableFieldOptions<NoInfer<TValue>> & { nullable: true }): Field<TValue | null>;
  <TValue>(value: TValue | null, validators: ValidatorSource<NoInfer<TValue | null>>, options: NullableFieldOptions<NoInfer<TValue>> & { nullable: true }): Field<TValue | null>;
}

export type FieldFactory<TNullable extends boolean> = [TNullable] extends [false]
  ? NonNullableFieldFactory
  : typeof import('./field').field;

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
    validators: ValidatorSource<NoInfer<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>>>,
    options?: FormOptions<NoInfer<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>>, Form<NormalizedNodesWithDefault<TDefinitions, TNullable>>>,
  ): ConfiguredForm<TDefinitions, TNullable>;
}

export interface GroupFactory<TNullable extends boolean> {
  <TDefinitions extends ObjectNodeDefinitions>(
    definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions>,
    options?: GroupOptions<NoInfer<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>>>,
  ): ConfiguredGroup<TDefinitions, TNullable>;
  <TDefinitions extends ObjectNodeDefinitions>(
    definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions>,
    validators: ValidatorSource<NoInfer<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>>>,
    options?: GroupOptions<NoInfer<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>>>,
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
type PositionalArrayOptions<TValue> = Omit<ArrayOptions<TValue>, 'initialValue'>;

export interface ArrayFactory<TNullable extends boolean> {
  <TDefinition extends ArrayTemplate>(template: TDefinition & ArrayTemplateInput<TDefinition>, options?: ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(template: TDefinition & ArrayTemplateInput<TDefinition>, initial: NoInfer<ArrayInitial<TDefinition, TNullable>>, options?: PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(template: TDefinition & ArrayTemplateInput<TDefinition>, initial: NoInfer<ArrayInitial<TDefinition, TNullable>>, validators: ValidatorSource<NoInfer<ConfiguredArrayValue<TDefinition, TNullable>>>, options?: PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(template: TDefinition & ArrayTemplateInput<TDefinition>, validators: ValidatorSource<NoInfer<ConfiguredArrayValue<TDefinition, TNullable>>>, options?: ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(factory: () => TDefinition & ArrayTemplateInput<TDefinition>, options?: ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(factory: () => TDefinition & ArrayTemplateInput<TDefinition>, initial: NoInfer<ArrayInitial<TDefinition, TNullable>>, options?: PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(factory: () => TDefinition & ArrayTemplateInput<TDefinition>, initial: NoInfer<ArrayInitial<TDefinition, TNullable>>, validators: ValidatorSource<NoInfer<ConfiguredArrayValue<TDefinition, TNullable>>>, options?: PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
  <TDefinition extends ArrayTemplate>(factory: () => TDefinition & ArrayTemplateInput<TDefinition>, validators: ValidatorSource<NoInfer<ConfiguredArrayValue<TDefinition, TNullable>>>, options?: ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>>): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
}

export type FormPrimitivesOptions<TNullable extends boolean = true> = {
  /** Default nullability for fields without an explicit `nullable` option. Defaults to `true`. */
  nullable?: TNullable;
};

export type FormPrimitives<TNullable extends boolean = boolean> = {
  field: FieldFactory<TNullable>;
  form: FormFactory<TNullable>;
  group: GroupFactory<TNullable>;
  array: ArrayFactory<TNullable>;
};
