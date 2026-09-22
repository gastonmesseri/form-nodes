import { isEmpty } from '../../utils/is-empty';
import { isFieldContext } from '../utils/field-context-marker';
import { defaultEmailMessage } from '../utils/default-validator-messages';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, FieldContext, ValidationResult, Validator, ValidatorContext } from '../validation.type';

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
 * ```ts
 * const profile = form({
 *   value: field('invalid', [
 *     email({ message: 'Check this value.' }),
 *   ]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * @reactive Tracks signals read by a custom message function while validation is failing.
 * @param options Optional static message string, or an object containing a static or reactive message. Omitting `message`, or returning `undefined`, uses the default.
 */
export function email(options: string | ({
  /**
   * Overrides the message of a failing built-in validation error. A reactive function
   * is evaluated only while the rule fails; returning `undefined` continues through the
   * node, provider, global, and built-in message fallbacks. Cannot be combined with `error`.
   *
   * **Default:** `undefined`; use the configured fallback message.
   *
   * **Accepted values:**
   *
   * - **Strings**: Use the supplied text, including an empty string.
   * - **Functions**: Track signals read while resolving the message.
   *
   * ```ts
   * const profile = form({
   *   value: field('invalid', [
   *     email({ message: 'Check this value.' }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const text = signal('Check this value.');
   * const profile = form({
   *   value: field('invalid', [
   *     email({ message: () => text() }),
   *   ]),
   * });
   * ```
   */
  message?: string | (() => string | undefined);
  error?: never;
} | {
  message?: never;
  /**
   * Replaces the built-in failure with a custom error or error array. A callback
   * receives the current validation context and runs only when the built-in rule fails.
   * A callback may return nullish/empty results to suppress the failure. A static nullish
   * value preserves the built-in result. Cannot be combined with `message`.
   *
   * **Default:** `undefined`; retain the built-in error.
   *
   * See {@link ValidationResult} for supported error shapes.
   *
   * ```ts
   * const profile = form({
   *   value: field('invalid', [
   *     email({
   *       error: { kind: 'custom' },
   *     }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * const profile = form({
   *   value: field('invalid', [
   *     email({
   *       error: () => ({ kind: 'custom' }),
   *     }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * const profile = form({
   *   value: field('invalid', [
   *     email({
   *       error: [
   *         { kind: 'custom' },
   *       ],
   *     }),
   *   ]),
   * });
   * ```
   */
  error?: ValidationResult | ((context: ValidatorContext<string | null>) => ValidationResult);
}) & {
  /**
   * Enables the validator and its constraint metadata only while the condition is true.
   * Signal reads are tracked. A false result skips the rule, message, and error callbacks.
   * Parameterless callbacks support class self-references with unchecked returns; return
   * a boolean. Context-taking callbacks retain boolean checking.
   *
   * **Return Type:** `boolean` for the condition callback.
   *
   * **Default:** `undefined`; the validator remains active.
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const active = signal(true);
   * const profile = form({
   *   value: field('invalid', [
   *     email({ when: () => active() }),
   *   ]),
   * });
   * ```
   */
  when?: NoInfer<DeferredCondition | ((context: ValidatorContext<string | null>) => boolean)>;
}): Validator<string | null>;
/**
 * Validates email format when passed directly in a validators array.
 *
 * `null` and `''` pass so this validator can be composed with `required`. A failure produces
 * `{ kind: 'email', message }` using the default message.
 *
 * ```ts
 * const profile = form({
 *   value: field('invalid', [email]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * @param context Reactive field context supplied by the validation pipeline.
 */
export function email(context: FieldContext<string | null>): ValidationResult;
export function email(
  contextOrOptions: FieldContext<string | null> | string | {
    message?: string | (() => string | undefined);
    /**
     * Enables the validator and its constraint metadata only while the condition is true.
     * Signal reads are tracked. A false result skips the rule, message, and error callbacks.
     * Parameterless callbacks support class self-references with unchecked returns; return
     * a boolean. Context-taking callbacks retain boolean checking.
     *
     * **Return Type:** `boolean` for the condition callback.
     *
     * **Default:** `undefined`; the validator remains active.
     *
     * ```ts
     * import { signal } from '@angular/core';
     *
     * const active = signal(true);
     * const profile = form({
     *   value: field('invalid', [
     *     email({ when: () => active() }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<string | null>) => boolean)>;
  },
): Validator<string | null> | ValidationResult {
  if (isFieldContext(contextOrOptions)) {
    return validateEmail(contextOrOptions);
  }
  return applyValidatorWhen(
    context => validateEmail(context, resolveValidatorMessageOption(contextOrOptions)),
    contextOrOptions,
  );
}
