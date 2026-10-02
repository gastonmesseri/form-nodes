import { MaxLengthValidator, MaxValidator, MinLengthValidator, MinValidator, PatternValidator } from '@angular/forms';

type ValidatorDirective = MinValidator | MaxValidator | MinLengthValidator | MaxLengthValidator | PatternValidator;

type ConstraintKey = 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern';

/** Reads only public inputs of standard Angular validator directives; never executes validators. */
export const readValidatorConstraint = (validator: unknown): { key: ConstraintKey; value: unknown; directive: ValidatorDirective } | undefined => {
  if (validator instanceof MinValidator) return { key: 'min', value: validator.min, directive: validator };
  if (validator instanceof MaxValidator) return { key: 'max', value: validator.max, directive: validator };
  if (validator instanceof MinLengthValidator) return { key: 'minLength', value: validator.minlength, directive: validator };
  if (validator instanceof MaxLengthValidator) return { key: 'maxLength', value: validator.maxlength, directive: validator };
  if (validator instanceof PatternValidator) return { key: 'pattern', value: validator.pattern, directive: validator };
};

/** Normalizes declared constraints using Angular's numeric parsing and string-pattern anchoring. */
export const resolveValidatorConstraints = (validators: readonly unknown[]) => {
  const result: { min?: number; max?: number; minLength?: number; maxLength?: number; pattern: RegExp[] } = { pattern: [] };
  for (const validator of validators) {
    const constraint = readValidatorConstraint(validator);
    if (!constraint || constraint.value === null || constraint.value === undefined) continue;
    const { key, value } = constraint;
    if (key === 'pattern') {
      if (!value) continue;
      if (value instanceof RegExp) result.pattern.push(value);
      else {
        const pattern = String(value);
        result.pattern.push(new RegExp(`${pattern.startsWith('^') ? '' : '^'}${pattern}${pattern.endsWith('$') ? '' : '$'}`));
      }
    } else {
      const number = typeof value === 'number' ? value
        : key === 'minLength' || key === 'maxLength' ? parseInt(String(value), 10) : parseFloat(String(value));
      if (Number.isNaN(number)) continue;
      const previous = result[key];
      result[key] = previous === undefined ? number
        : key === 'min' || key === 'minLength' ? Math.max(previous, number) : Math.min(previous, number);
    }
  }
  return result;
};
