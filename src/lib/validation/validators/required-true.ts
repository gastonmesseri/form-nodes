import { REQUIRED_METADATA } from './required';
import { markValidatorMetadata } from '../validator-metadata';
import { isFieldContext } from '../utils/field-context-marker';
import { REQUIRED_TRUE_METADATA } from '../constraint-metadata';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { defaultRequiredTrueMessage } from '../utils/default-validator-messages';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, BuiltInValidationErrorMap, FieldContext, ValidationResult, Validator, ValidatorContext } from '../validation.type';

const validateRequiredTrue = (
  { value }: FieldContext<unknown>,
  message?: string | (() => string | undefined),
): BuiltInValidationErrorMap['requiredTrue'] | null => {
  if (value() === true) return null;
  return { kind: 'requiredTrue', message: resolveValidatorMessage('requiredTrue', {}, message, defaultRequiredTrueMessage) };
};

const markRequiredTrue = (validator: Validator<unknown>) => {
  markValidatorMetadata(validator, REQUIRED_METADATA, true);
  return markValidatorMetadata(validator, REQUIRED_TRUE_METADATA, true);
};

/**
 * Requires exactly `true`. All other values, including `false`, `null`, and `undefined`, fail.
 *
 * Supports direct use, custom messages, custom errors, and a reactive `when` condition.
 *
 * @example
 * ```ts
 * const checkout = form({
 *   accepted: field(false, [requiredTrue]),
 * });
 * ```
 *
 * @reactive Tracks the active condition and custom message signals.
 * @param options Optional message or configuration. Returning undefined from a message uses configured fallbacks.
 */
export function requiredTrue(options: string | ({
  /** Static or reactive message; undefined uses configured fallbacks. */
  message?: string | (() => string | undefined);
  error?: never;
} | {
  message?: never;
  /** Custom error or errors replacing the built-in error. */
  error?: ValidationResult | ((context: ValidatorContext<unknown>) => ValidationResult);
}) & {
  /** Reactive activation condition. Parameterless callbacks have unchecked returns for class self-references; return a boolean. */
  when?: NoInfer<DeferredCondition | ((context: ValidatorContext<unknown>) => boolean)>;
}): Validator<unknown>;
/**
 * Requires exactly `true`. All other values, including `false`, `null`, and `undefined`, fail.
 *
 * @example
 * ```ts
 * field(null, [requiredTrue]);
 * ```
 *
 * @param context Reactive context supplied by the validation pipeline.
 */
export function requiredTrue(context: FieldContext<unknown>): ValidationResult;
export function requiredTrue(
  contextOrOptions: FieldContext<unknown> | string | {
    message?: string | (() => string | undefined);
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<unknown>) => boolean)>;
  },
): Validator<unknown> | ValidationResult {
  if (isFieldContext(contextOrOptions)) return validateRequiredTrue(contextOrOptions);
  return applyValidatorWhen(
    markRequiredTrue(context => validateRequiredTrue(context, resolveValidatorMessageOption(contextOrOptions))),
    contextOrOptions,
  );
}

markRequiredTrue(requiredTrue as Validator<unknown>);
