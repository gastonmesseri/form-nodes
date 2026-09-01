import { isEmpty } from '../../utils/is-empty';
import { isFieldContext } from '../../utils/field-context-marker';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultEmailMessage } from './default-validator-messages';
import { resolveValidatorMessageOption } from './validator-options';
import type { FieldContext, ValidationResult, Validator } from '../validation.type';

const emailPattern = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const validateEmail = (
  { value }: FieldContext<string | null>,
  message?: string | (() => string | undefined),
): ValidationResult => {
  const currentValue = value();
  if (isEmpty(currentValue)) return null;
  return emailPattern.test(currentValue!)
    ? null
    : { kind: 'email', message: resolveValidatorMessage('email', {}, message, defaultEmailMessage) };
};

/**
 * Creates an email-format validator with an optional custom message.
 *
 * `null` and `''` pass so this validator can be composed with `required`. Non-empty strings use
 * Angular's standard email-address format. A failure produces `{ kind: 'email', message }`.
 *
 * @example
 * ```ts
 * field('', [email('Enter a valid work email')]);
 * field('', [email({ message: 'Enter a valid work email' })]);
 * field('', [email({ message: () => translatedEmailMessage() })]);
 * ```
 *
 * @reactive Tracks signals read by a custom message function while validation is failing.
 *
 * @param options Optional static message string, or an object containing a static or reactive message. Omitting `message`, or returning `undefined`, uses the default.
 */
export function email(options: string | {
  /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
  message?: string | (() => string | undefined);
}): Validator<string | null>;
/**
 * Validates email format when passed directly in a validators array.
 *
 * `null` and `''` pass so this validator can be composed with `required`. A failure produces
 * `{ kind: 'email', message }` using the default message.
 *
 * @example
 * ```ts
 * field('', [required, email]);
 * ```
 *
 * @param context Reactive field context supplied by the validation pipeline.
 */
export function email(context: FieldContext<string | null>): ValidationResult;
export function email(
  contextOrOptions: FieldContext<string | null> | string | { message?: string | (() => string | undefined) },
): Validator<string | null> | ValidationResult {
  if (isFieldContext(contextOrOptions)) {
    return validateEmail(contextOrOptions);
  }
  return context => validateEmail(context, resolveValidatorMessageOption(contextOrOptions));
}
