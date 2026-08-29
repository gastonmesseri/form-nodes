import type { ValidationError, ValidationResult } from '../validation/validation.type';
import { isNil } from './is-nil';

/** Normalizes a validator result to the readonly error array exposed by nodes. */
export const normalizeValidationResult = (result: ValidationResult): readonly ValidationError[] => {
  if (isNil(result)) return [];
  return Array.isArray(result) ? result : [result as ValidationError];
};
