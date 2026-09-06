import { FieldNode } from './field-node';
import type { Field, FieldOptions } from './field.type';
import type { ValidatorSource } from '../validation/validation.type';
import { isValidatorSource } from '../validation/utils/validator-source';

export type { Field, FieldApi, FieldOptions } from './field.type';

type NullableFieldOptions<TValue> = FieldOptions<TValue | null>;
type NonNullableFieldOptions<TValue> = FieldOptions<TValue>;

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
 * @param options Field configuration.
 */
export function field(
  value: null,
  options?: NullableFieldOptions<unknown>,
): Field<unknown>;
/**
 * Creates a field inferred as `Field<unknown>` from `null`, with positional validators.
 *
 * ```ts
 * const name = field(null, [required]);
 * ```
 *
 * @param value Initial committed value.
 * @param validators Validators for the field value.
 * @param options Field configuration.
 */
export function field(
  value: null,
  validators: ValidatorSource<unknown, Field<unknown>>,
  options?: NullableFieldOptions<unknown>,
): Field<unknown>;
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
 * @param options Field configuration.
 */
export function field(
  value: undefined,
  options?: NullableFieldOptions<unknown>,
): Field<unknown>;
/**
 * Creates a field inferred as `Field<unknown>` from `undefined`, with positional validators.
 *
 * ```ts
 * const name = field(undefined, [required]);
 * ```
 *
 * @param value Initial committed value. An explicit `undefined` is preserved.
 * @param validators Validators for the field value.
 * @param options Field configuration.
 */
export function field(
  value: undefined,
  validators: ValidatorSource<unknown, Field<unknown>>,
  options?: NullableFieldOptions<unknown>,
): Field<unknown>;
/** Creates a nullable field that preserves an explicitly typed `undefined` initial value. */
export function field<TValue>(
  value: undefined,
  options?: FieldOptions<NoInfer<TValue | null | undefined>>,
): Field<TValue | null | undefined>;
/** Creates a nullable field with validators that preserves an explicitly typed `undefined` initial value. */
export function field<TValue>(
  value: undefined,
  validators: ValidatorSource<NoInfer<TValue | null | undefined>, Field<NoInfer<TValue | null | undefined>>>,
  options?: FieldOptions<NoInfer<TValue | null | undefined>>,
): Field<TValue | null | undefined>;
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
 * @param options Field configuration.
 */
export function field<TValue>(
  value: TValue | null,
  options?: NullableFieldOptions<NoInfer<TValue>>,
): Field<TValue | null>;
export function field<TValue>(): Field<TValue | null>;
/**
 * Creates a nullable field from an initial value, positional validators, and optional configuration.
 *
 * ```ts
 * const name = field('', [required]);
 * ```
 *
 * @param value Initial committed value.
 * @param validators Validators for the field value.
 * @param options Field configuration.
 */
export function field<TValue>(
  value: TValue | null,
  validators?: ValidatorSource<NoInfer<TValue | null>, Field<NoInfer<TValue | null>>>,
  options?: NullableFieldOptions<NoInfer<TValue>>,
): Field<TValue | null>;
export function field<TValue>(
  value?: TValue,
  validatorsOrOptions?: ValidatorSource<NoInfer<TValue>, Field<NoInfer<TValue>>> | FieldOptions<NoInfer<TValue>>,
  separateOptions?: FieldOptions<NoInfer<TValue>>,
): Field<TValue> {
  const initialValue = (arguments.length === 0 ? null : value) as TValue;
  const resolvedOptions = isValidatorSource<TValue, Field<TValue>>(validatorsOrOptions) || validatorsOrOptions === undefined
    ? separateOptions
    : validatorsOrOptions;
  const validatorSource = isValidatorSource<TValue, Field<TValue>>(validatorsOrOptions)
    ? validatorsOrOptions
    : resolvedOptions?.validators ?? [];
  return new FieldNode<TValue>(initialValue, validatorSource, resolvedOptions).getNode();
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
   * @param options Field configuration.
   */
  export function strict<TValue extends {}>(value: TValue, options?: NonNullableFieldOptions<NoInfer<TValue>>): Field<TValue>;
  /**
   * Creates a non-nullable field with positional validators.
   *
   * ```ts
   * const name = field.strict('Marco', [required]);
   * ```
   *
   * @param value Initial committed value.
   * @param validators Validators for the field value.
   * @param options Field configuration.
   */
  export function strict<TValue extends {}>(value: TValue, validators: ValidatorSource<NoInfer<TValue>, Field<NoInfer<TValue>>>, options?: NonNullableFieldOptions<NoInfer<TValue>>): Field<TValue>;
  export function strict<TValue extends {}>(
    value: TValue,
    validatorsOrOptions?: ValidatorSource<NoInfer<TValue>, Field<NoInfer<TValue>>> | NonNullableFieldOptions<NoInfer<TValue>>,
    separateOptions?: NonNullableFieldOptions<NoInfer<TValue>>,
  ): Field<TValue> {
    const createField = field as unknown as (
      initialValue: TValue,
      initialValidatorsOrOptions?: ValidatorSource<TValue, Field<TValue>> | FieldOptions<TValue>,
      initialOptions?: FieldOptions<TValue>,
    ) => Field<TValue>;
    if (isValidatorSource<TValue, Field<TValue>>(validatorsOrOptions) || validatorsOrOptions === undefined) {
      return createField(value, validatorsOrOptions, separateOptions);
    }
    return createField(value, validatorsOrOptions);
  }

  /**
   * Creates a field that includes `null`, independently of the configured default.
   *
   * The package-level `field()` is already nullable by default, so `field<string>()` returns
   * `Field<string | null>`. Use `field.nullable()` to make that choice explicit or to override a
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
   * @param options Field configuration.
   */
  export function nullable(value: null | undefined, options?: NullableFieldOptions<unknown>): Field<unknown>;
  export function nullable<TValue>(value: undefined, options?: FieldOptions<NoInfer<TValue | null | undefined>>): Field<TValue | null | undefined>;
  export function nullable<TValue>(value: TValue | null, options?: NullableFieldOptions<NoInfer<TValue>>): Field<TValue | null>;
  export function nullable<TValue>(): Field<TValue | null>;
  /**
   * Creates a nullable field with positional validators.
   *
   * ```ts
   * const nickname = field.nullable('', [required]);
   * ```
   *
   * @param value Initial committed value.
   * @param validators Validators for the nullable field value.
   * @param options Field configuration.
   */
  export function nullable(value: null | undefined, validators: ValidatorSource<unknown, Field<unknown>>, options?: NullableFieldOptions<unknown>): Field<unknown>;
  export function nullable<TValue>(value: undefined, validators: ValidatorSource<NoInfer<TValue | null | undefined>, Field<NoInfer<TValue | null | undefined>>>, options?: FieldOptions<NoInfer<TValue | null | undefined>>): Field<TValue | null | undefined>;
  export function nullable<TValue>(value: TValue | null, validators: ValidatorSource<NoInfer<TValue | null>, Field<NoInfer<TValue | null>>>, options?: NullableFieldOptions<NoInfer<TValue>>): Field<TValue | null>;
  export function nullable<TValue>(
    value?: TValue | null,
    validatorsOrOptions?: ValidatorSource<NoInfer<TValue | null>, Field<NoInfer<TValue | null>>> | NullableFieldOptions<NoInfer<TValue>>,
    separateOptions?: NullableFieldOptions<NoInfer<TValue>>,
  ): Field<TValue | null | undefined> {
    const initialValue = arguments.length === 0 ? null : value;
    const createField = field as unknown as (
      initialValue: TValue | null | undefined,
      initialValidatorsOrOptions?: ValidatorSource<TValue | null | undefined, Field<TValue | null | undefined>> | FieldOptions<TValue | null | undefined>,
      initialOptions?: FieldOptions<TValue | null | undefined>,
    ) => Field<TValue | null | undefined>;
    if (isValidatorSource<TValue | null | undefined, Field<TValue | null | undefined>>(validatorsOrOptions) || validatorsOrOptions === undefined) {
      return createField(
        initialValue,
        validatorsOrOptions as ValidatorSource<TValue | null | undefined, Field<TValue | null | undefined>> | undefined,
        separateOptions as FieldOptions<TValue | null | undefined> | undefined,
      );
    }
    return createField(initialValue, validatorsOrOptions as FieldOptions<TValue | null | undefined>);
  }
}
