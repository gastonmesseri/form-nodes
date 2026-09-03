import { isFieldContext } from '../../utils/field-context-marker';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultIntegerMessage } from './default-validator-messages';
import { applyValidatorWhen, resolveValidatorMessageOption } from './validator-options';
import type { BuiltInValidationErrorMap, FieldContext, ValidationResult, Validator, ValidatorContext } from '../validation.type';

const validateInteger = (
  { value }: FieldContext<number | null>,
  message?: string | (() => string | undefined),
): BuiltInValidationErrorMap['integer'] | null => {
  const currentValue = value();
  if (currentValue === null || Number.isSafeInteger(currentValue)) return null;
  return {
    kind: 'integer',
    actual: currentValue,
    message: resolveValidatorMessage('integer', { actual: currentValue }, message, defaultIntegerMessage),
  };
};

/**
 * Creates a safe-integer validator with an optional custom message.
 *
 * `null` passes so this validator can be composed with `required`. It uses
 * `Number.isSafeInteger()`, rejecting decimals, `NaN`, infinities, and integers outside
 * JavaScript's exactly representable safe range. A failure produces
 * `{ kind: 'integer', actual, message }`.
 *
 * @example
 * ```ts
 * field(1.5, [integer('Enter a whole number')]);
 * field(1.5, [integer({ message: 'Enter a whole number' })]);
 * field(1.5, [integer({ message: () => translatedIntegerMessage() })]);
 * ```
 *
 * @reactive Tracks signals read by a custom message function while validation is failing.
 *
 * @param options Optional static message string, or an object containing a static or reactive message. Omitting `message`, or returning `undefined`, uses the configured fallback.
 */
export function integer(options: string | {
  /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
  message?: string | (() => string | undefined);
  /** Reactive predicate deciding whether this validator is active. */
  when?: (context: ValidatorContext<number | null>) => boolean;
}): Validator<number | null>;
/**
 * Validates a safe integer when passed directly in a validators array.
 *
 * `null` passes so this validator can be composed with `required`. A failure produces
 * `{ kind: 'integer', actual, message }` using the configured fallback message.
 *
 * @example
 * ```ts
 * field(1, [required, integer]);
 * ```
 *
 * @param context Reactive field context supplied by the validation pipeline.
 */
export function integer(context: FieldContext<number | null>): ValidationResult;
export function integer(
  contextOrOptions: FieldContext<number | null> | string | {
    message?: string | (() => string | undefined);
    when?: (context: ValidatorContext<number | null>) => boolean;
  },
): Validator<number | null> | ValidationResult {
  if (isFieldContext(contextOrOptions)) return validateInteger(contextOrOptions);
  return applyValidatorWhen(
    context => validateInteger(context, resolveValidatorMessageOption(contextOrOptions)),
    contextOrOptions,
  );
}
