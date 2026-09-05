import { copyConditionalValidatorMetadata } from '../validator-metadata';
import type { ValidationResult, Validator, ValidatorContext } from '../validation.type';

/** Common options supported by built-in validators. */
export type ValidatorOptions<TValue = unknown> = ({
  /**
   * Human-readable message returned with the validation error.
   *
   * A function is evaluated reactively while the validator is failing. Signals read by it trigger
   * revalidation and update the exposed error. Returning `undefined` continues through the form,
   * provider, global, and built-in fallback messages.
   */
  message?: string | (() => string | undefined);
  /** Custom error or errors returned instead of the built-in error. */
  error?: never;
} | {
  message?: never;
  /** Custom error or errors returned instead of the built-in error. */
  error?: ValidationResult | ((context: ValidatorContext<TValue>) => ValidationResult);
}) & {
  /** Reactive predicate deciding whether the validator and its constraint metadata are active. */
  when?: (context: ValidatorContext<TValue>) => boolean;
};

export const resolveValidatorMessageOption = <TValue>(
  options?: string | ValidatorOptions<TValue>,
): string | (() => string | undefined) | undefined => {
  return typeof options === 'string' ? options : options?.message;
};

/** Applies a built-in validator's reactive condition and custom-error override. */
export const applyValidatorWhen = <TValue>(
  validator: Validator<TValue>,
  options?: string | ValidatorOptions<TValue>,
): Validator<TValue> => {
  if (typeof options === 'string') return validator;
  const configuredValidator: Validator<TValue> = (context) => {
    const validatorContext = context as ValidatorContext<TValue>;
    if (options?.when !== undefined && !options.when(validatorContext)) return null;
    const result = validator(context);
    if (result === null || result === undefined || Array.isArray(result) && result.length === 0) return result;
    return typeof options?.error === 'function' ? options.error(validatorContext) : options?.error ?? result;
  };
  copyConditionalValidatorMetadata(validator, configuredValidator, options?.when ?? (() => true));
  return configuredValidator;
};
