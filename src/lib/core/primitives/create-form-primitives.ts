import { field } from './field';
import { array } from './array';
import { createObjectNode } from './form';
import { isNode } from '../utils/node-marker';
import type { Node } from '../types/node.type';
import type { FieldOptions } from './field.type';
import { isPlainObject } from '../utils/is-plain-object';
import type { ObjectNodeDefinitions } from './form.type';
import type { ValidatorSource } from '../validation/validation.type';
import { isValidatorSource } from '../validation/utils/validator-source';
import { registerNodeDefaultValidatorMessages } from '../validation/validator-messages';
import type { FormPrimitives, FormPrimitivesOptions } from './create-form-primitives.type';

export type { ArrayFactory, FieldFactory, FormFactory, FormPrimitives, FormPrimitivesOptions, GroupFactory, NonNullableFieldFactory } from './create-form-primitives.type';

/**
 * Creates an isolated set of form primitives with shared defaults.
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
 * The default also applies to field shorthands, dynamic children, and nodes created from array
 * templates or factories. Use `field.strict()` or `field.nullable()` for a local override.
 * Existing nodes keep the policy of the factory that created them.
 *
 * @param options Defaults shared by the returned primitive factories.
 */
export const createFormPrimitives = <const TNullable extends boolean = true>(options: FormPrimitivesOptions<TNullable> = {}): FormPrimitives<TNullable> => {
  const defaultNullable = options.nullable ?? true;
  const defaultNodeOptions = {
    inheritInjector: options.inheritInjector,
    adoptBindingInjector: options.adoptBindingInjector,
  };
  const mergeNodeOptions = <TOptions extends object>(nodeOptions?: TOptions): TOptions => {
    return {
      ...nodeOptions,
      inheritInjector: (nodeOptions as FieldOptions | undefined)?.inheritInjector ?? defaultNodeOptions.inheritInjector,
      adoptBindingInjector: (nodeOptions as FieldOptions | undefined)?.adoptBindingInjector ?? defaultNodeOptions.adoptBindingInjector,
    } as TOptions;
  };
  const registerDefaults = <TNode extends Node>(node: TNode): TNode => {
    registerNodeDefaultValidatorMessages(node, options.validatorMessages);
    return node;
  };
  const configuredField = ((...args: unknown[]) => {
    const value = args.length === 0 ? null : args[0];
    const validatorsOrOptions = args[1] as ValidatorSource<unknown> | FieldOptions<unknown> | undefined;
    const separateOptions = args[2] as FieldOptions<unknown> | undefined;
    const createField = value === null || value === undefined || defaultNullable
      ? field.nullable as (...args: any[]) => Node
      : field.strict as (...args: any[]) => Node;
    if (isValidatorSource(validatorsOrOptions) || validatorsOrOptions === undefined) {
      return registerDefaults(createField(value, validatorsOrOptions, mergeNodeOptions(separateOptions)));
    }
    return registerDefaults(createField(value, mergeNodeOptions(validatorsOrOptions)));
  }) as FormPrimitives<TNullable>['field'];
  configuredField.strict = ((value: unknown, validatorsOrOptions?: unknown, separateOptions?: unknown) => {
    return isValidatorSource(validatorsOrOptions)
      ? registerDefaults(field.strict(value as never, validatorsOrOptions as never, mergeNodeOptions(separateOptions as object | undefined) as never))
      : registerDefaults(field.strict(value as never, mergeNodeOptions(validatorsOrOptions as object | undefined) as never));
  }) as unknown as FormPrimitives<TNullable>['field']['strict'];
  configuredField.nullable = ((...args: unknown[]) => {
    const value = args.length === 0 ? null : args[0];
    const validatorsOrOptions = args[1];
    const separateOptions = args[2];
    return isValidatorSource(validatorsOrOptions)
      ? registerDefaults(field.nullable(value as never, validatorsOrOptions as never, mergeNodeOptions(separateOptions as object | undefined) as never))
      : registerDefaults(field.nullable(value as never, mergeNodeOptions(validatorsOrOptions as object | undefined) as never));
  }) as unknown as FormPrimitives<TNullable>['field']['nullable'];

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
  ) => registerDefaults(createObjectNode(
    definitions,
    isValidatorSource(validatorsOrOptions) ? validatorsOrOptions as never : mergeNodeOptions(validatorsOrOptions as object | undefined) as never,
    isValidatorSource(validatorsOrOptions) || validatorsOrOptions === undefined ? mergeNodeOptions(separateOptions as object | undefined) as never : undefined,
    'form',
    normalizeDefinition,
  ))) as FormPrimitives<TNullable>['form'];

  const configuredGroup = ((
    definitions: ObjectNodeDefinitions,
    validatorsOrOptions?: unknown,
    separateOptions?: unknown,
  ) => registerDefaults(createObjectNode(
    definitions,
    isValidatorSource(validatorsOrOptions) ? validatorsOrOptions as never : mergeNodeOptions(validatorsOrOptions as object | undefined) as never,
    isValidatorSource(validatorsOrOptions) || validatorsOrOptions === undefined ? mergeNodeOptions(separateOptions as object | undefined) as never : undefined,
    'group',
    normalizeDefinition,
  ))) as FormPrimitives<TNullable>['group'];

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
    const secondIsValidators = typeof args[0] === 'function'
      || (Array.isArray(args[0]) && args[0].some(entry => typeof entry === 'function')
        && args[0].every(entry => entry === null || entry === undefined || typeof entry === 'function'));
    const thirdIsValidators = typeof args[1] === 'function'
      || (Array.isArray(args[1]) && args[1].some(entry => typeof entry === 'function')
        && args[1].every(entry => entry === null || entry === undefined || typeof entry === 'function'));
    const hasInitial = args[0] === null || typeof args[0] === 'number'
      || (Array.isArray(args[0]) && (!secondIsValidators || thirdIsValidators || args[2] !== undefined));
    const optionsIndex = hasInitial ? (thirdIsValidators ? 2 : 1) : (secondIsValidators ? 1 : 0);
    args[optionsIndex] = mergeNodeOptions(args[optionsIndex] as object | undefined);
    return registerDefaults((array as (...arrayArgs: any[]) => Node)(configuredSource, ...args));
  }) as FormPrimitives<TNullable>['array'];

  return {
    field: configuredField,
    form: configuredForm,
    group: configuredGroup,
    array: configuredArray,
  };
};
