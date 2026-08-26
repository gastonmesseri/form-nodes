import type { AsyncValidator, AsyncValidatorApi, AsyncValidatorBaseContext, ValidationResult, ValidatorReadonlyApi } from '../validation/validation.type';

export type AsyncValidatorOptions<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>> = {
  readonly debounce?: number;
  readonly when?: (context: AsyncValidatorBaseContext<TValue, TApi>) => boolean;
  readonly onError?: (error: unknown, context: AsyncValidatorBaseContext<TValue, TApi>) => ValidationResult;
};

export type ParameterizedAsyncValidatorOptions<TValue, TParams, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>> = AsyncValidatorOptions<TValue, TApi> & {
  /** Reactively derives the explicit dependency snapshot passed to the validator. */
  readonly params: (context: AsyncValidatorBaseContext<TValue, TApi>) => TParams;
};

type StoredAsyncValidatorOptions<TValue> = AsyncValidatorOptions<TValue> & {
  readonly params?: (context: AsyncValidatorBaseContext<TValue>) => unknown;
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
