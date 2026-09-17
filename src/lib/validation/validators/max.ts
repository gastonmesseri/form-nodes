import { MAX_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { defaultMaxMessage } from '../utils/default-validator-messages';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext } from '../validation.type';

/**
 * Requires a non-empty number to be less than or equal to a maximum.
 *
 * `null` and `NaN` pass so this validator can be composed with `required`. The maximum may be
 * static or returned by a reactively tracked function. Returning `undefined` or `NaN` disables
 * the constraint temporarily. A failure produces
 * `{ kind: 'max', max, actual, message }`.
 *
 * ```ts
 * const profile = form({
 *   value: field(70, [max(65)]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * ```ts
 * import { signal } from '@angular/core';
 *
 * const limit = signal(65);
 * const profile = form({
 *   value: field(70, [max(() => limit())]),
 * });
 * ```
 *
 * ```ts
 * const profile = form({
 *   value: field(70, [
 *     max(65, 'Check this value.'),
 *   ]),
 * });
 * ```
 *
 * @reactive Tracks signals read by the maximum and message sources while they are active.
 * @param maximum Static maximum or a reactive function returning it.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export const max = (
  maximum: number | (() => number | undefined),
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
     *     max(65, {
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
     *     max(65, {
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
     *     max(65, {
     *       error: { kind: 'custom' },
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field(70, [
     *     max(65, {
     *       error: () => ({ kind: 'custom' }),
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field(70, [
     *     max(65, {
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
     *   value: field(70, [
     *     max(65, { when: () => active() }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<number | null>) => boolean)>;
  },
): Validator<number | null> => {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<number | null> = markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue)) return null;
    const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
    if (resolvedMaximum === undefined || Number.isNaN(resolvedMaximum)) return null;
    return currentValue > resolvedMaximum
      ? { kind: 'max', max: resolvedMaximum, actual: currentValue, message: resolveValidatorMessage('max', { max: resolvedMaximum, actual: currentValue }, message, () => defaultMaxMessage(resolvedMaximum)) }
      : null;
  }, MAX_METADATA, maximum);
  return applyValidatorWhen(validator, options);
};
