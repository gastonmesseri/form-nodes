import { attempt } from '../../utils/attempt';
import { isEmpty } from '../../utils/is-empty';
import { isFieldContext } from '../utils/field-context-marker';
import { defaultUrlMessage } from '../utils/default-validator-messages';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, FieldContext, ValidationResult, Validator, ValidatorContext } from '../validation.type';

const validateUrl = (
  { value }: FieldContext<string | null>,
  message?: string | (() => string | undefined),
): ValidationResult => {
  const currentValue = value();
  if (isEmpty(currentValue)) return null;

  if (attempt(() => new URL(currentValue!), null)) return null;
  return { kind: 'url', message: resolveValidatorMessage('url', {}, message, defaultUrlMessage) };
};

/**
 * Creates an absolute WHATWG URL validator with an optional custom message.
 *
 * `null` and `''` pass so this validator can be composed with `required`. Non-empty strings are
 * parsed with the platform `URL` constructor without a base URL, so relative references fail and
 * any valid absolute scheme is accepted, including `https:`, `mailto:`, and custom schemes. A
 * failure produces `{ kind: 'url', message }`.
 *
 * ```ts
 * const profile = form({
 *   value: field('invalid', [
 *     url({ message: 'Check this value.' }),
 *   ]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * @reactive Tracks signals read by a custom message function while validation is failing.
 * @param options Optional static message string, or an object containing a static or reactive message. Omitting `message`, or returning `undefined`, uses the configured fallback.
 */
export function url(options: string | ({
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
   *     url({ message: 'Check this value.' }),
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
   *     url({ message: () => text() }),
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
   *     url({
   *       error: { kind: 'custom' },
   *     }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * const profile = form({
   *   value: field('invalid', [
   *     url({
   *       error: () => ({ kind: 'custom' }),
   *     }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * const profile = form({
   *   value: field('invalid', [
   *     url({
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
   * **Default:** `undefined`; the validator remains active.
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const active = signal(true);
   * const profile = form({
   *   value: field('invalid', [
   *     url({ when: () => active() }),
   *   ]),
   * });
   * ```
   */
  when?: NoInfer<DeferredCondition | ((context: ValidatorContext<string | null>) => boolean)>;
}): Validator<string | null>;
/**
 * Validates an absolute WHATWG URL when passed directly in a validators array.
 *
 * `null` and `''` pass so this validator can be composed with `required`. A failure produces
 * `{ kind: 'url', message }` using the configured fallback message.
 *
 * ```ts
 * const profile = form({
 *   value: field('invalid', [url]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * @param context Reactive field context supplied by the validation pipeline.
 */
export function url(context: FieldContext<string | null>): ValidationResult;
export function url(
  contextOrOptions: FieldContext<string | null> | string | {
    message?: string | (() => string | undefined);
    /**
     * Enables the validator and its constraint metadata only while the condition is true.
     * Signal reads are tracked. A false result skips the rule, message, and error callbacks.
     * Parameterless callbacks support class self-references with unchecked returns; return
     * a boolean. Context-taking callbacks retain boolean checking.
     *
     * **Default:** `undefined`; the validator remains active.
     *
     * ```ts
     * import { signal } from '@angular/core';
     *
     * const active = signal(true);
     * const profile = form({
     *   value: field('invalid', [
     *     url({ when: () => active() }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<string | null>) => boolean)>;
  },
): Validator<string | null> | ValidationResult {
  if (isFieldContext(contextOrOptions)) return validateUrl(contextOrOptions);
  return applyValidatorWhen(
    context => validateUrl(context, resolveValidatorMessageOption(contextOrOptions)),
    contextOrOptions,
  );
}
