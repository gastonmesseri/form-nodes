import { field } from './field';
import { array } from './array';
import { isNode } from './utils/node-marker';
import type { FieldOptions } from './field.type';
import type { AnyNode } from '../types/node.type';
import { createFormGroupNode } from './form-group-node';
import { isPlainObject } from '../utils/is-plain-object';
import type { ValidatorSource } from '../validation/validation.type';
import type { FormOptions, ObjectNodeDefinitions } from './form.type';
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
    syncInputs: options.syncInputs,
    bindInputOutputPairs: options.bindInputOutputPairs,
    inheritInjector: options.inheritInjector,
    adoptBindingInjector: options.adoptBindingInjector,
  };
  const mergeNodeOptions = <TOptions extends object>(nodeOptions?: TOptions): TOptions => {
    return {
      ...nodeOptions,
      syncInputs: (nodeOptions as FieldOptions | undefined)?.syncInputs === undefined
        ? defaultNodeOptions.syncInputs
        : (nodeOptions as FieldOptions).syncInputs,
      bindInputOutputPairs: (nodeOptions as FieldOptions | undefined)?.bindInputOutputPairs === undefined
        ? defaultNodeOptions.bindInputOutputPairs
        : (nodeOptions as FieldOptions).bindInputOutputPairs,
      inheritInjector: (nodeOptions as FieldOptions | undefined)?.inheritInjector ?? defaultNodeOptions.inheritInjector,
      adoptBindingInjector: (nodeOptions as FieldOptions | undefined)?.adoptBindingInjector ?? defaultNodeOptions.adoptBindingInjector,
    } as TOptions;
  };
  const registerDefaults = <TNode extends AnyNode>(node: TNode): TNode => {
    registerNodeDefaultValidatorMessages(node, options.validatorMessages);
    return node;
  };
  const configuredField = ((...args: unknown[]) => {
    const value = args.length === 0 ? null : args[0];
    const validatorsOrOptions = args[1] as ValidatorSource<unknown> | FieldOptions<unknown> | undefined;
    const separateOptions = args[2] as FieldOptions<unknown> | undefined;
    const createField = value === null || value === undefined || defaultNullable
      ? field.nullable as (...args: any[]) => AnyNode
      : field.strict as (...args: any[]) => AnyNode;
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

  const normalizeDefinition = (definition: unknown): AnyNode => {
    if (isNode(definition)) return definition;
    if (Array.isArray(definition)) return configuredField(definition as never) as AnyNode;
    if (definition !== null && typeof definition === 'object') {
      if (definition instanceof Date) return configuredField(definition as never) as AnyNode;
      if (isPlainObject(definition)) return configuredGroup(definition as ObjectNodeDefinitions) as AnyNode;
    }
    return configuredField(definition as never) as AnyNode;
  };

  const configuredForm = ((
    definitions: ObjectNodeDefinitions,
    validatorsOrOptions?: unknown,
    separateOptions?: unknown,
  ) => {
    const configuredValidatorsOrOptions = isValidatorSource(validatorsOrOptions)
      ? validatorsOrOptions
      : mergeNodeOptions(validatorsOrOptions as FormOptions | undefined);
    const configuredSeparateOptions = isValidatorSource(validatorsOrOptions) || validatorsOrOptions === undefined
      ? mergeNodeOptions(separateOptions as FormOptions | undefined)
      : undefined;
    const resolvedOptions = isValidatorSource(configuredValidatorsOrOptions) || configuredValidatorsOrOptions === undefined
      ? configuredSeparateOptions
      : configuredValidatorsOrOptions;
    const validatorSource = isValidatorSource(configuredValidatorsOrOptions)
      ? configuredValidatorsOrOptions
      : resolvedOptions?.validators ?? [];
    return registerDefaults(createFormGroupNode(definitions, validatorSource, resolvedOptions, 'form', normalizeDefinition));
  }) as unknown as FormPrimitives<TNullable>['form'];

  const configuredGroup = ((
    definitions: ObjectNodeDefinitions,
    validatorsOrOptions?: unknown,
    separateOptions?: unknown,
  ) => {
    const configuredValidatorsOrOptions = isValidatorSource(validatorsOrOptions)
      ? validatorsOrOptions
      : mergeNodeOptions(validatorsOrOptions as FormOptions | undefined);
    const configuredSeparateOptions = isValidatorSource(validatorsOrOptions) || validatorsOrOptions === undefined
      ? mergeNodeOptions(separateOptions as FormOptions | undefined)
      : undefined;
    const resolvedOptions = isValidatorSource(configuredValidatorsOrOptions) || configuredValidatorsOrOptions === undefined
      ? configuredSeparateOptions
      : configuredValidatorsOrOptions;
    const validatorSource = isValidatorSource(configuredValidatorsOrOptions)
      ? configuredValidatorsOrOptions
      : resolvedOptions?.validators ?? [];
    return registerDefaults(createFormGroupNode(definitions, validatorSource, resolvedOptions, 'group', normalizeDefinition));
  }) as unknown as FormPrimitives<TNullable>['group'];

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
    return registerDefaults((array as (...arrayArgs: any[]) => AnyNode)(configuredSource, ...args));
  }) as unknown as FormPrimitives<TNullable>['array'];

  return {
    field: configuredField,
    form: configuredForm,
    group: configuredGroup,
    array: configuredArray,
  };
};
