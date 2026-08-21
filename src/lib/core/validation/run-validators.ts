import type { ValidationErrors, Validators } from './validation.type';
import { getValidatorImplementation } from './validator-implementation';

export const runValidators = <TValue>(
  value: TValue,
  validators: Validators<TValue>,
): ValidationErrors | null => {
  const errors: ValidationErrors = {};
  validators.forEach((validator) => {
    Object.assign(errors, getValidatorImplementation(validator)(value) ?? {});
  });
  return Object.keys(errors).length ? errors : null;
};
