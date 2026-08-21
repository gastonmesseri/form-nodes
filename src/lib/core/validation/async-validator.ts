import { markAsAsyncValidator, type AsyncValidatorOptions } from '../utils/async-validator-marker';
import type { AsyncValidationResult, AsyncValidator, AsyncValidatorContext } from './validation.type';

/** Marks a Promise- or Observable-based validator for asynchronous execution. */
export const asyncValidator = <TValue>(
  validator: (context: AsyncValidatorContext<TValue>) => AsyncValidationResult,
  options: AsyncValidatorOptions<TValue> = {},
): AsyncValidator<TValue> => markAsAsyncValidator(validator as unknown as AsyncValidator<TValue>, options);

export type { AsyncValidatorOptions } from '../utils/async-validator-marker';
