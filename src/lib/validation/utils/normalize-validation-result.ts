import { isNil } from '../../utils/is-nil';
import type { ValidationError, ValidationResult } from '../validation.type';

/** Normalizes a validator result to the readonly error array exposed by nodes. */
export const normalizeValidationResult = (result: ValidationResult): readonly ValidationError[] => {
  if (isNil(result)) return [];
  return Array.isArray(result) ? result : [result as ValidationError];
};
