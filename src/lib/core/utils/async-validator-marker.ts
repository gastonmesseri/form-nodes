import type { AsyncValidator, FieldContext, ValidationResult } from '../validation/validation.type';

export type AsyncValidatorOptions<TValue> = {
  readonly debounce?: number;
  readonly when?: (context: FieldContext<TValue>) => boolean;
  readonly onError?: (error: unknown, context: FieldContext<TValue>) => ValidationResult;
};

const asyncValidators = new WeakMap<Function, AsyncValidatorOptions<any>>();

export const markAsAsyncValidator = <TValue>(
  validator: AsyncValidator<TValue>,
  options: AsyncValidatorOptions<TValue>,
): AsyncValidator<TValue> => {
  asyncValidators.set(validator, options);
  return validator;
};

export const isAsyncValidator = (validator: Function): boolean => asyncValidators.has(validator);

export const getAsyncValidatorOptions = <TValue>(validator: AsyncValidator<TValue>): AsyncValidatorOptions<TValue> =>
  asyncValidators.get(validator) ?? {};
