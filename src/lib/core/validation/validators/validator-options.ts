import type { Validator, ValidatorContext } from '../validation.type';
import { copyConditionalValidatorMetadata } from '../validator-metadata';

/** Common options supported by built-in validators. */
export type ValidatorOptions<TValue = unknown> = {
  /**
   * Human-readable message returned with the validation error.
   *
   * A function is evaluated reactively while the validator is failing. Signals read by it trigger
   * revalidation and update the exposed error. Returning `undefined` continues through the form,
   * provider, global, and built-in fallback messages.
   */
  message?: string | (() => string | undefined);
  /** Reactive predicate deciding whether the validator and its constraint metadata are active. */
  when?: (context: ValidatorContext<TValue>) => boolean;
};

export const resolveValidatorMessageOption = <TValue>(
  options?: string | ValidatorOptions<TValue>,
): string | (() => string | undefined) | undefined => {
  return typeof options === 'string' ? options : options?.message;
};

/** Applies a built-in validator only while its reactive `when` predicate is true. */
export const applyValidatorWhen = <TValue>(
  validator: Validator<TValue>,
  options?: string | ValidatorOptions<TValue>,
): Validator<TValue> => {
  if (typeof options === 'string' || options?.when === undefined) return validator;
  const conditionalValidator: Validator<TValue> = context =>
    (options.when!(context as ValidatorContext<TValue>) ? validator(context) : null);
  copyConditionalValidatorMetadata(validator, conditionalValidator, options.when);
  return conditionalValidator;
};
