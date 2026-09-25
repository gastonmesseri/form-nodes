import { defaultLessThanMessage } from '../utils/default-validator-messages';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext } from '../validation.type';

/**
 * Requires a non-empty number to be strictly less than a limit.
 *
 * `null` and `NaN` pass so this validator can be composed with `required`. The limit may be
 * static or returned by a reactively tracked function. Returning `undefined` or `NaN` disables
 * the rule temporarily. A failure produces
 * `{ kind: 'lessThan', limit, actual, message }`. Strict rules do not publish inclusive
 * `min()` or `max()` constraint metadata.
 *
 * ```ts
 * const profile = form({
 *   value: field(70, [lessThan(65)]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * ```ts
 * import { signal } from '@angular/core';
 *
 * const limit = signal(65);
 * const profile = form({
 *   value: field(70, [
 *     lessThan(() => limit()),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * const profile = form({
 *   value: field(70, [
 *     lessThan(65, 'Check this value.'),
 *   ]),
 * });
 * ```
 *
 * @reactive Tracks signals read by the limit and message sources while they are active.
 * @param limit Static strict upper boundary or a reactive function returning it.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export const lessThan = (
  limit: number | (() => number | undefined),
  options?: string | ({
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
     *   value: field(70, [
     *     lessThan(65, {
     *       message: 'Check this value.',
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * import { signal } from '@angular/core';
     *
     * const text = signal('Check this value.');
     * const profile = form({
     *   value: field(70, [
     *     lessThan(65, {
     *       message: () => text(),
     *     }),
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
     *   value: field(70, [
     *     lessThan(65, {
     *       error: { kind: 'custom' },
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field(70, [
     *     lessThan(65, {
     *       error: () => ({ kind: 'custom' }),
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field(70, [
     *     lessThan(65, {
     *       error: [
     *         { kind: 'custom' },
     *       ],
     *     }),
     *   ]),
     * });
     * ```
     */
    error?: ValidationResult | ((context: ValidatorContext<number | null>) => ValidationResult);
  }) & {
    /**
     * Enables the validator only while the condition is true.
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
     *   value: field(70, [
     *     lessThan(65, { when: () => active() }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<number | null>) => boolean)>;
  },
): Validator<number | null> => {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<number | null> = ({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue)) return null;
    const resolvedLimit = typeof limit === 'function' ? limit() : limit;
    if (resolvedLimit === undefined || Number.isNaN(resolvedLimit)) return null;
    return currentValue >= resolvedLimit
      ? { kind: 'lessThan', limit: resolvedLimit, actual: currentValue, message: resolveValidatorMessage('lessThan', { limit: resolvedLimit, actual: currentValue }, message, () => defaultLessThanMessage(resolvedLimit)) }
      : null;
  };
  return applyValidatorWhen(validator, options);
};
