import type { FieldContext, ValidationErrors, Validators } from './validation.type';

export const runValidators = <TValue>(
  context: FieldContext<TValue>,
  validators: Validators<TValue>,
): ValidationErrors | null => {
  const errors: ValidationErrors = {};
  validators.forEach((validator) => {
    Object.assign(errors, validator(context) ?? {});
  });
  return Object.keys(errors).length ? errors : null;
};
