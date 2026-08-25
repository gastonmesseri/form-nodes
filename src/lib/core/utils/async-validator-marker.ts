import type { AsyncValidator, FieldContext, ValidationResult } from '../validation/validation.type';

export type AsyncValidatorOptions<TValue> = {
  readonly debounce?: number;
  readonly when?: (context: FieldContext<TValue>) => boolean;
  readonly onError?: (error: unknown, context: FieldContext<TValue>) => ValidationResult;
};

export type ParameterizedAsyncValidatorOptions<TValue, TParams> = AsyncValidatorOptions<TValue> & {
  /** Reactively derives the explicit dependency snapshot passed to the validator. */
  readonly params: (context: FieldContext<TValue>) => TParams;
};

type StoredAsyncValidatorOptions<TValue> = AsyncValidatorOptions<TValue> & {
  readonly params?: (context: FieldContext<TValue>) => unknown;
};

const asyncValidators = new WeakMap<Function, StoredAsyncValidatorOptions<any>>();

export const markAsAsyncValidator = <TValue>(
  validator: AsyncValidator<TValue>,
  options: StoredAsyncValidatorOptions<TValue>,
): AsyncValidator<TValue> => {
  asyncValidators.set(validator, options);
  return validator;
};

export const isAsyncValidator = (validator: Function): boolean => asyncValidators.has(validator);

export const getAsyncValidatorOptions = <TValue>(validator: AsyncValidator<TValue>): StoredAsyncValidatorOptions<TValue> =>
  asyncValidators.get(validator) ?? {};
