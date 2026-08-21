import { normalizeValidationResult } from '../utils/normalize-validation-result';
import type { FieldContext, ValidationError, Validators } from './validation.type';

export const runValidators = <TValue>(
  context: FieldContext<TValue>,
  validators: Validators<TValue>,
): readonly ValidationError[] => {
  const errors: ValidationError[] = [];
  validators.forEach((validator) => {
    errors.push(...normalizeValidationResult(validator(context)));
  });
  return errors;
};
