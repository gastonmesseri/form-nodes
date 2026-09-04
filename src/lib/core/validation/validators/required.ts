import { isEmpty } from '../../utils/is-empty';
import { createMetadataKey } from '../../metadata/metadata';
import { applyValidatorWhen, resolveValidatorMessageOption } from './validator-options';
import { markValidatorMetadata } from '../validator-metadata';
import { isFieldContext } from '../../utils/field-context-marker';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultRequiredMessage } from './default-validator-messages';
import type { FieldContext, ValidationError, ValidationResult, Validator, ValidatorContext } from '../validation.type';

export const REQUIRED_METADATA = createMetadataKey<boolean, boolean>({
  getInitial: () => false,
  reduce: (current, contribution) => current || contribution,
});

const validateRequired = (
  context: FieldContext<unknown>,
  message?: string | (() => string | undefined),
): ValidationError | null => {
  if (!isEmpty(context.value())) return null;
  return { kind: 'required', message: resolveValidatorMessage('required', {}, message, defaultRequiredMessage) };
};

/**
 * Creates a required validator with an optional custom message.
 *
 * The validator rejects `null`, `undefined`, `''`, `false`, and `NaN`. A failure produces
 * `{ kind: 'required', message }`.
 *
 * ℹ️ `required` does not reject empty arrays, sets, maps, or objects. Combine it with
 * `minLength(1)` when an aggregate must contain at least one item.
 *
 * @example
 * ```ts
 * field('', [required('Enter your name')]);
 * field('', [required({ message: 'Enter your name' })]);
 * field('', [required({ message: () => translatedRequiredMessage() })]);
 * array(field(''), [], [required, minLength(1)]);
 * ```
 *
 * @reactive Tracks signals read by a custom message function while validation is failing.
 *
 * @param options Optional static message string, or an object containing a static or reactive message. Omitting `message`, or returning `undefined`, uses the default.
 */
export function required(options: string | ({
  /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
  message?: string | (() => string | undefined);
  error?: never;
} | {
  message?: never;
  /** Custom error or errors returned instead of the built-in error. */
  error?: ValidationResult | ((context: ValidatorContext<unknown>) => ValidationResult);
}) & {
  /** Reactive predicate deciding whether this validator and its required metadata are active. */
  when?: (context: ValidatorContext<unknown>) => boolean;
}): Validator<unknown>;
/**
 * Validates required presence when passed directly in a validators array.
 *
 * The validator rejects `null`, `undefined`, `''`, `false`, and `NaN`. A failure produces
 * `{ kind: 'required', message }` using the default message.
 *
 * ℹ️ `required` does not reject empty arrays, sets, maps, or objects. Combine it with
 * `minLength(1)` when an aggregate must contain at least one item.
 *
 * @example
 * ```ts
 * field('', [required]);
 * array(field(''), [], [required, minLength(1)]);
 * ```
 *
 * @param context Reactive field context supplied by the validation pipeline.
 */
export function required(context: FieldContext<unknown>): ValidationResult;
export function required(
  contextOrOptions: FieldContext<unknown> | string | {
    message?: string | (() => string | undefined);
    when?: (context: ValidatorContext<unknown>) => boolean;
  },
): Validator<unknown> | ValidationResult {
  if (isFieldContext(contextOrOptions)) {
    return validateRequired(contextOrOptions);
  }
  return applyValidatorWhen(
    markValidatorMetadata(
      context => validateRequired(context, resolveValidatorMessageOption(contextOrOptions)),
      REQUIRED_METADATA,
      true,
    ),
    contextOrOptions,
  );
}

markValidatorMetadata(required as Validator<unknown>, REQUIRED_METADATA, true);
