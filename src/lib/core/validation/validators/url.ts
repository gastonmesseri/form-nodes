import { isEmpty } from '../../utils/is-empty';
import { isFieldContext } from '../../utils/field-context-marker';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultValidatorMessages } from './default-validator-messages';
import type { FieldContext, ValidationResult, Validator } from '../validation.type';

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
    return { kind: 'url', message: resolveValidatorMessage('url', {}, message, defaultValidatorMessages.url) };
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
 * field('', [url({ message: 'Enter a complete URL' })]);
 * field('', [url({ message: () => translatedUrlMessage() })]);
 * ```
 *
 * @reactive Tracks signals read by a custom message function while validation is failing.
 *
 * @param options Optional static or reactive custom validation message. Omitting `message`, or returning `undefined`, uses the configured fallback.
 */
export function url(options: {
  /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
  message?: string | (() => string | undefined);
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
  contextOrOptions: FieldContext<string | null> | { message?: string | (() => string | undefined) },
): Validator<string | null> | ValidationResult {
  if (isFieldContext(contextOrOptions)) return validateUrl(contextOrOptions);
  return context => validateUrl(context, contextOrOptions.message);
}
