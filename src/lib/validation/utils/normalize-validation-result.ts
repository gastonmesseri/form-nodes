import { isNil } from '../../utils/is-nil';
import type { ValidationError } from '../validation.type';
import { warnInDevMode } from '../../utils/warn-in-dev-mode';

const normalizeError = (value: unknown): ValidationError | undefined => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  try {
    const kind: unknown = Reflect.get(value, 'kind');
    if (typeof kind === 'string') return value as ValidationError;
    if (typeof kind === 'number') return { ...value, kind: String(kind) };
  } catch {
    // Unreadable error properties are handled like other malformed results.
  }
  return undefined;
};

/** Keeps supported errors and ignores malformed results without requiring an injector. */
export const normalizeValidationResult = (result: unknown): readonly ValidationError[] => {
  const errors: ValidationError[] = [];
  const items = Array.isArray(result) ? result : [result];
  for (const item of items) {
    if (isNil(item)) continue;
    if (typeof item === 'string') errors.push({ kind: 'custom', message: item });
    else {
      const error = normalizeError(item);
      if (error) errors.push(error);
      else warnInDevMode('Ignored an invalid validator result. Return null, undefined, a message string, or an error object with a string or number "kind" property.');
    }
  }
  return errors;
};
