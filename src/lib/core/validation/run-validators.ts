import type { ValidationErrors, Validators } from './validation.type';

export const runValidators = <TValue>(
  value: TValue,
  validators: Validators<TValue>,
): ValidationErrors | null => {
  const errors: ValidationErrors = {};
  validators.forEach((validator) => Object.assign(errors, validator(value) ?? {}));
  return Object.keys(errors).length ? errors : null;
};
