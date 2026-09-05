import { isEmpty } from '../../utils/is-empty';
import { isFieldContext } from '../utils/field-context-marker';
import { defaultUrlMessage } from '../utils/default-validator-messages';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { FieldContext, ValidationResult, Validator, ValidatorContext } from '../validation.type';

const validateUrl = (
  { value }: FieldContext<string | null>,
  message?: string | (() => string | undefined),
): ValidationResult => {
  const currentValue = value();
  if (isEmpty(currentValue)) return null;

  try {
    new URL(currentValue!);
    return null;
  } catch {
    return { kind: 'url', message: resolveValidatorMessage('url', {}, message, defaultUrlMessage) };
  }
};

/**
 * Creates an absolute WHATWG URL validator with an optional custom message.
 *
 * `null` and `''` pass so this validator can be composed with `required`. Non-empty strings are
 * parsed with the platform `URL` constructor without a base URL, so relative references fail and
 * any valid absolute scheme is accepted, including `https:`, `mailto:`, and custom schemes. A
 * failure produces `{ kind: 'url', message }`.
 *
 * @example
 * ```ts
 * field('', [url('Enter a complete URL')]);
 * field('', [url({ message: 'Enter a complete URL' })]);
 * field('', [url({ message: () => translatedUrlMessage() })]);
 * ```
 *
 * @reactive Tracks signals read by a custom message function while validation is failing.
 *
 * @param options Optional static message string, or an object containing a static or reactive message. Omitting `message`, or returning `undefined`, uses the configured fallback.
 */
export function url(options: string | ({
  /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
  message?: string | (() => string | undefined);
  error?: never;
} | {
  message?: never;
  /** Custom error or errors returned instead of the built-in error. */
  error?: ValidationResult | ((context: ValidatorContext<string | null>) => ValidationResult);
}) & {
  /** Reactive predicate deciding whether this validator is active. */
  when?: (context: ValidatorContext<string | null>) => boolean;
}): Validator<string | null>;
/**
 * Validates an absolute WHATWG URL when passed directly in a validators array.
 *
 * `null` and `''` pass so this validator can be composed with `required`. A failure produces
 * `{ kind: 'url', message }` using the configured fallback message.
 *
 * @example
 * ```ts
 * field('', [required, url]);
 * ```
 *
 * @param context Reactive field context supplied by the validation pipeline.
 */
export function url(context: FieldContext<string | null>): ValidationResult;
export function url(
  contextOrOptions: FieldContext<string | null> | string | {
    message?: string | (() => string | undefined);
    when?: (context: ValidatorContext<string | null>) => boolean;
  },
): Validator<string | null> | ValidationResult {
  if (isFieldContext(contextOrOptions)) return validateUrl(contextOrOptions);
  return applyValidatorWhen(
    context => validateUrl(context, resolveValidatorMessageOption(contextOrOptions)),
    contextOrOptions,
  );
}
