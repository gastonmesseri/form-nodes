import { markAsAsyncValidator, type AsyncValidatorOptions, type ParameterizedAsyncValidatorOptions } from '../utils/async-validator-marker';
import type { AsyncValidationResult, AsyncValidator, AsyncValidatorContext, ParameterizedAsyncValidatorContext } from './validation.type';

export type ParameterizedAsyncValidatorConfig<TValue, TParams> = ParameterizedAsyncValidatorOptions<TValue, TParams> & {
  readonly validate: (context: ParameterizedAsyncValidatorContext<TValue, TParams>) => AsyncValidationResult;
};

/** Creates a reactive Promise- or Observable-based validator, optionally with explicit params. */
export function asyncValidator<TValue, TParams>(config: ParameterizedAsyncValidatorConfig<TValue, TParams>): AsyncValidator<TValue>;
export function asyncValidator<TValue>(
  validator: (context: AsyncValidatorContext<TValue>) => AsyncValidationResult,
  options?: AsyncValidatorOptions<TValue>,
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
