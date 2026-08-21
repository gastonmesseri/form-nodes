import { isEmpty } from './is-empty';
import type { ValidationErrors, Validator } from '../validation.type';
import { registerValidatorImplementation } from '../validator-implementation';

export type RequiredOptions = {
  readonly message: string;
};

const validateRequired = (value: unknown, message?: string): ValidationErrors | null => {
  if (!isEmpty(value)) return null;
  return message === undefined ? { required: true } : { required: { message } };
};

/** Creates a required validator with custom options. */
export function required(options: RequiredOptions): Validator<unknown>;
/** Validates a value when the function is passed directly in a validators array. */
export function required(value: unknown): ValidationErrors | null;
export function required(valueOrOptions?: unknown): Validator<unknown> | ValidationErrors | null {
  if (
    typeof valueOrOptions === 'object' &&
    valueOrOptions !== null &&
    'message' in valueOrOptions
  ) {
    const options = valueOrOptions as RequiredOptions;
    return (value) => validateRequired(value, options.message);
  }
  return validateRequired(valueOrOptions);
}

registerValidatorImplementation(required, validateRequired);
