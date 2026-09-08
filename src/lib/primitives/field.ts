import { createFieldNode } from './field-node';
import type { FieldNode, FieldOptions } from './field.type';
import type { ValidatorSource } from '../validation/validation.type';
import { isValidatorSource } from '../validation/utils/validator-source';

export type { FieldNode, FieldApi, FieldOptions } from './field.type';

type NullableFieldOptions<TValue> = FieldOptions<TValue | null>;
type NonNullableFieldOptions<TValue> = FieldOptions<TValue>;

// Keep inference barriers on each argument alternative so option keys remain visible to editors.

/**
 * Creates a nullable field whose future value type is not yet known.
 *
 * ```ts
 * const value = field(null);
 *
 * value(); // null
 * ```
 *
 * Literal `null` and `undefined` initial values both use this safe inference. Use an explicit
 * generic such as `field<string>(null)` when the eventual value type is known.
 *
 * @param value Initial committed value.
 * @param args Validators or node configuration, optionally followed by configuration for positional validators.
 */
export function field(
  value: null,
  ...args:
    | [validatorsOrOptions?: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | NoInfer<NullableFieldOptions<unknown>>]
    | [
      validators: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | undefined,
      options: NoInfer<NullableFieldOptions<unknown>> | undefined
    ]
): FieldNode<unknown>;
/**
 * Creates a nullable field whose future value type is not yet known from an `undefined` initial value.
 *
 * ```ts
 * const value = field(undefined);
 * ```
 *
 * Use an explicit generic such as `field<string>(undefined)` when the eventual value type is known.
 *
 * @param value Initial committed value. An explicit `undefined` is preserved.
 * @param args Validators or node configuration, optionally followed by configuration for positional validators.
 */
export function field(
  value: undefined,
  ...args:
    | [validatorsOrOptions?: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | NoInfer<NullableFieldOptions<unknown>>]
    | [
      validators: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | undefined,
      options: NoInfer<NullableFieldOptions<unknown>> | undefined
    ]
): FieldNode<unknown>;
/** Creates a nullable field that preserves an explicitly typed `undefined` initial value. */
export function field<TValue>(
  value: undefined,
  ...args:
    | [validatorsOrOptions?: NoInfer<ValidatorSource<TValue | null | undefined, FieldNode<TValue | null | undefined>>> | NoInfer<FieldOptions<TValue | null | undefined>>]
    | [
      validators: NoInfer<ValidatorSource<TValue | null | undefined, FieldNode<TValue | null | undefined>>> | undefined,
      options: NoInfer<FieldOptions<TValue | null | undefined>> | undefined
    ]
): FieldNode<TValue | null | undefined>;
/**
 * Creates a nullable field from an initial value and optional configuration.
 *
 * ```ts
 * const name = field('Marco');
 *
 * name(); // 'Marco'
 * ```
 *
 * The inferred value type includes `null`. Omitting the value initializes the field to `null`.
 * Use `field.strict()` when the field must remain non-nullable.
 *
 * @param value Initial committed value.
 * @param args Validators or node configuration, optionally followed by configuration for positional validators.
 */
export function field<TValue>(
  value: TValue | null,
  ...args:
    | [validatorsOrOptions?: NoInfer<ValidatorSource<TValue | null, FieldNode<TValue | null>>> | NoInfer<NullableFieldOptions<TValue>>]
    | [
      validators: NoInfer<ValidatorSource<TValue | null, FieldNode<TValue | null>>> | undefined,
      options: NoInfer<NullableFieldOptions<TValue>> | undefined
    ]
): FieldNode<TValue | null>;
export function field<TValue>(): FieldNode<TValue | null>;
export function field<TValue>(
  value?: TValue,
  validatorsOrOptions?: ValidatorSource<NoInfer<TValue>, FieldNode<NoInfer<TValue>>> | FieldOptions<NoInfer<TValue>>,
  separateOptions?: FieldOptions<NoInfer<TValue>>,
): FieldNode<TValue> {
  const initialValue = (arguments.length === 0 ? null : value) as TValue;
  const resolvedOptions = isValidatorSource<TValue, FieldNode<TValue>>(validatorsOrOptions) || validatorsOrOptions === undefined
    ? separateOptions
    : validatorsOrOptions;
  const validatorSource = isValidatorSource<TValue, FieldNode<TValue>>(validatorsOrOptions)
    ? validatorsOrOptions
    : resolvedOptions?.validators ?? [];
  return createFieldNode<TValue>(initialValue, validatorSource, resolvedOptions);
}

export namespace field {
  /**
   * Creates a field that excludes `null`, independently of the configured default.
   *
   * ```ts
   * const name = field.strict('Marco');
   *
   * name(); // 'Marco'
   * ```
   *
   * @param value Initial committed value.
   * @param args Validators or node configuration, optionally followed by configuration for positional validators.
   */
  export function strict<TValue extends {}>(value: TValue,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<TValue, FieldNode<TValue>>> | NoInfer<NonNullableFieldOptions<TValue>>]
      | [
        validators: NoInfer<ValidatorSource<TValue, FieldNode<TValue>>> | undefined,
        options: NoInfer<NonNullableFieldOptions<TValue>> | undefined
      ]
  ): FieldNode<TValue>;
  export function strict<TValue extends {}>(
    value: TValue,
    validatorsOrOptions?: ValidatorSource<NoInfer<TValue>, FieldNode<NoInfer<TValue>>> | NonNullableFieldOptions<NoInfer<TValue>>,
    separateOptions?: NonNullableFieldOptions<NoInfer<TValue>>,
  ): FieldNode<TValue> {
    const createField = field as unknown as (
      initialValue: TValue,
      initialValidatorsOrOptions?: ValidatorSource<TValue, FieldNode<TValue>> | FieldOptions<TValue>,
      initialOptions?: FieldOptions<TValue>,
    ) => FieldNode<TValue>;
    if (isValidatorSource<TValue, FieldNode<TValue>>(validatorsOrOptions) || validatorsOrOptions === undefined) {
      return createField(value, validatorsOrOptions, separateOptions);
    }
    return createField(value, validatorsOrOptions);
  }

  /**
   * Creates a field that includes `null`, independently of the configured default.
   *
   * The package-level `field()` is already nullable by default, so `field<string>()` returns
   * `FieldNode<string | null>`. Use `field.nullable()` to make that choice explicit or to override a
   * non-nullable `createFormPrimitives()` default.
   *
   * ```ts
   * const defaultName = field<string>();
   * const nickname = field.nullable('Marco');
   *
   * defaultName.set(null);
   * nickname.set(null);
   * ```
   *
   * @param value Initial committed value.
   * @param args Validators or node configuration, optionally followed by configuration for positional validators.
   */
  export function nullable(value: null | undefined,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | NoInfer<NullableFieldOptions<unknown>>]
      | [
        validators: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | undefined,
        options: NoInfer<NullableFieldOptions<unknown>> | undefined
      ]
  ): FieldNode<unknown>;
  export function nullable<TValue>(value: undefined,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<TValue | null | undefined, FieldNode<TValue | null | undefined>>> | NoInfer<FieldOptions<TValue | null | undefined>>]
      | [
        validators: NoInfer<ValidatorSource<TValue | null | undefined, FieldNode<TValue | null | undefined>>> | undefined,
        options: NoInfer<FieldOptions<TValue | null | undefined>> | undefined
      ]
  ): FieldNode<TValue | null | undefined>;
  export function nullable<TValue>(value: TValue | null,
    ...args:
      | [validatorsOrOptions?: NoInfer<ValidatorSource<TValue | null, FieldNode<TValue | null>>> | NoInfer<NullableFieldOptions<TValue>>]
      | [
        validators: NoInfer<ValidatorSource<TValue | null, FieldNode<TValue | null>>> | undefined,
        options: NoInfer<NullableFieldOptions<TValue>> | undefined
      ]
  ): FieldNode<TValue | null>;
  export function nullable<TValue>(): FieldNode<TValue | null>;
  export function nullable<TValue>(
    value?: TValue | null,
    validatorsOrOptions?: ValidatorSource<NoInfer<TValue | null>, FieldNode<NoInfer<TValue | null>>> | NullableFieldOptions<NoInfer<TValue>>,
    separateOptions?: NullableFieldOptions<NoInfer<TValue>>,
  ): FieldNode<TValue | null | undefined> {
    const initialValue = arguments.length === 0 ? null : value;
    const createField = field as unknown as (
      initialValue: TValue | null | undefined,
      initialValidatorsOrOptions?: ValidatorSource<TValue | null | undefined, FieldNode<TValue | null | undefined>> | FieldOptions<TValue | null | undefined>,
      initialOptions?: FieldOptions<TValue | null | undefined>,
    ) => FieldNode<TValue | null | undefined>;
    if (isValidatorSource<TValue | null | undefined, FieldNode<TValue | null | undefined>>(validatorsOrOptions) || validatorsOrOptions === undefined) {
      return createField(
        initialValue,
        validatorsOrOptions as ValidatorSource<TValue | null | undefined, FieldNode<TValue | null | undefined>> | undefined,
        separateOptions as FieldOptions<TValue | null | undefined> | undefined,
      );
    }
    return createField(initialValue, validatorsOrOptions as FieldOptions<TValue | null | undefined>);
  }
}
