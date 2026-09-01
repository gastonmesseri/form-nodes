import { field } from './field';
import { array } from './array';
import { createObjectNode } from './form';
import { isNode } from '../utils/node-marker';
import type { Node } from '../types/node.type';
import type { FieldOptions } from './field.type';
import { isPlainObject } from '../utils/is-plain-object';
import type { ObjectNodeDefinitions } from './form.type';
import type { FormPrimitives, FormPrimitivesOptions } from './create-form-primitives.type';
import { isValidatorSource } from '../validation/validator-source';
import type { ValidatorSource } from '../validation/validation.type';

export type { ArrayFactory, FieldFactory, FormFactory, FormPrimitives, FormPrimitivesOptions, GroupFactory, NonNullableFieldFactory } from './create-form-primitives.type';

/**
 * Creates an isolated set of form primitives with a shared field-nullability default.
 *
 * ```ts
 * const { form, field } = createFormPrimitives({ nullable: false });
 * const profile = form({
 *   username: field(''),
 *   nickname: field.nullable(''),
 * });
 *
 * profile.username(); // ''
 * profile.nickname(); // ''
 * ```
 *
 * Explicit field options take precedence. The default also applies to field shorthands, dynamic
 * children, and nodes created from array templates or factories. Existing nodes keep the policy
 * of the factory that created them.
 *
 * @param options Defaults shared by the returned primitive factories.
 */
export const createFormPrimitives = <const TNullable extends boolean = true>(options: FormPrimitivesOptions<TNullable> = {}): FormPrimitives<TNullable> => {
  const defaultNullable = options.nullable ?? true;
  const configuredField = ((
    value: unknown,
    validatorsOrOptions?: ValidatorSource<unknown> | FieldOptions<unknown>,
    separateOptions?: FieldOptions<unknown>,
  ) => {
    const createField = field as (
      initialValue: unknown,
      initialValidatorsOrOptions?: ValidatorSource<unknown> | FieldOptions<unknown>,
      initialOptions?: FieldOptions<unknown>,
    ) => Node;
    if (isValidatorSource(validatorsOrOptions) || validatorsOrOptions === undefined) {
      return createField(value, validatorsOrOptions, {
        ...separateOptions,
        nullable: separateOptions?.nullable ?? (value === null || value === undefined ? true : defaultNullable),
      });
    }
    return createField(value, {
      ...validatorsOrOptions,
      nullable: validatorsOrOptions.nullable ?? (value === null || value === undefined ? true : defaultNullable),
    });
  }) as FormPrimitives<TNullable>['field'];
  configuredField.strict = field.strict;
  configuredField.nullable = field.nullable;

  const normalizeDefinition = (definition: unknown): Node => {
    if (isNode(definition)) return definition;
    if (Array.isArray(definition)) return configuredField(definition as never) as Node;
    if (definition !== null && typeof definition === 'object') {
      if (definition instanceof Date) return configuredField(definition as never) as Node;
      if (isPlainObject(definition)) return configuredGroup(definition as ObjectNodeDefinitions) as Node;
    }
    return configuredField(definition as never) as Node;
  };

  const configuredForm = ((
    definitions: ObjectNodeDefinitions,
    validatorsOrOptions?: unknown,
    separateOptions?: unknown,
  ) => createObjectNode(
    definitions,
    validatorsOrOptions as never,
    separateOptions as never,
    'form',
    normalizeDefinition,
  )) as FormPrimitives<TNullable>['form'];

  const configuredGroup = ((
    definitions: ObjectNodeDefinitions,
    validatorsOrOptions?: unknown,
    separateOptions?: unknown,
  ) => createObjectNode(
    definitions,
    validatorsOrOptions as never,
    separateOptions as never,
    'group',
    normalizeDefinition,
  )) as FormPrimitives<TNullable>['group'];

  const normalizeArrayDefinition = (definition: unknown): unknown => {
    if (isNode(definition)) return definition;
    return definition !== null && typeof definition === 'object' && !Array.isArray(definition) && isPlainObject(definition)
      ? configuredGroup(definition as ObjectNodeDefinitions)
      : definition;
  };

  const configuredArray = ((source: unknown, ...args: unknown[]) => {
    const configuredSource = typeof source === 'function' && !isNode(source)
      ? () => normalizeArrayDefinition((source as () => unknown)())
      : normalizeArrayDefinition(source);
    return (array as (...arrayArgs: any[]) => Node)(configuredSource, ...args);
  }) as FormPrimitives<TNullable>['array'];

  return {
    field: configuredField,
    form: configuredForm,
    group: configuredGroup,
    array: configuredArray,
  };
};
