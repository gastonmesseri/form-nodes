import { markAsAsyncValidator, type AsyncValidatorOptions, type ParameterizedAsyncValidatorOptions } from '../utils/async-validator-marker';
import type { AsyncValidationResult, AsyncValidator, AsyncValidatorApi, AsyncValidatorContext, ParameterizedAsyncValidatorContext } from './validation.type';

export type ParameterizedAsyncValidatorConfig<TValue, TParams, TApi = AsyncValidatorApi<TValue>> = ParameterizedAsyncValidatorOptions<TValue, TParams, TApi> & {
  readonly validate: (context: ParameterizedAsyncValidatorContext<TValue, TParams, TApi>) => AsyncValidationResult;
};

/** Creates a reactive Promise- or Observable-based validator, optionally with explicit params. */
export function asyncValidator<TValue, TParams, TApi = AsyncValidatorApi<TValue>>(config: ParameterizedAsyncValidatorConfig<TValue, TParams, TApi>): AsyncValidator<TValue>;
export function asyncValidator<TValue, TApi = AsyncValidatorApi<TValue>>(
  validator: (context: AsyncValidatorContext<TValue, TApi>) => AsyncValidationResult,
  options?: AsyncValidatorOptions<TValue, TApi>,
): AsyncValidator<TValue>;
export function asyncValidator<TValue, TParams>(
  validatorOrConfig:
    | ((context: AsyncValidatorContext<TValue>) => AsyncValidationResult)
    | ParameterizedAsyncValidatorConfig<TValue, TParams>,
  options: AsyncValidatorOptions<TValue> | ParameterizedAsyncValidatorOptions<TValue, TParams> = {},
): AsyncValidator<TValue> {
  if (typeof validatorOrConfig === 'function') {
    return markAsAsyncValidator(validatorOrConfig as unknown as AsyncValidator<TValue>, options);
  }
  return markAsAsyncValidator(validatorOrConfig.validate as unknown as AsyncValidator<TValue>, validatorOrConfig);
}

export type { AsyncValidatorOptions, ParameterizedAsyncValidatorOptions } from '../utils/async-validator-marker';
