import { isNil } from '../../utils/is-nil';
import type { ValidationError } from '../validation.type';
import { warnInDevMode } from '../../utils/warn-in-dev-mode';

const isValidationError = (value: unknown): value is ValidationError => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  try {
    return 'kind' in value && typeof value.kind === 'string';
  } catch {
    return false;
  }
};

/** Keeps supported errors and ignores malformed results without requiring an injector. */
export const normalizeValidationResult = (result: unknown): readonly ValidationError[] => {
  const errors: ValidationError[] = [];
  const items = Array.isArray(result) ? result : [result];
  for (const item of items) {
    if (isNil(item)) continue;
    if (isValidationError(item)) errors.push(item);
    else warnInDevMode('Ignored an invalid validator result. Return null, undefined, or an error object with a string "kind" property.');
  }
  return errors;
};
