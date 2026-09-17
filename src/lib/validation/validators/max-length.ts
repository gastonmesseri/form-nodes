import { isEmpty } from '../../utils/is-empty';
import { MAX_LENGTH_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { defaultMaxLengthMessage } from '../utils/default-validator-messages';
import { getLengthOrSize, type ValueWithLengthOrSize } from '../../utils/get-length-or-size';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext } from '../validation.type';

/**
 * Requires a non-empty value's numeric `length` or `size` not to exceed a maximum.
 *
 * This supports strings, arrays, sets, maps, and other values with a numeric `length` or `size`.
 * `null` and `''` pass so this validator can be composed with `required`; an empty array or set is
 * validated normally. A reactive constraint may return `undefined` to disable itself temporarily.
 * A failure produces `{ kind: 'maxLength', maxLength, actual, message }`, where `actual` is the
 * observed length or size.
 *
 * ```ts
 * const profile = form({
 *   value: field('abcd', [maxLength(3)]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * ```ts
 * import { signal } from '@angular/core';
 *
 * const limit = signal(3);
 * const profile = form({
 *   value: field('abcd', [
 *     maxLength(() => limit()),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * const profile = form({
 *   value: field('abcd', [
 *     maxLength(3, 'Check this value.'),
 *   ]),
 * });
 * ```
 *
 * @reactive Tracks signals read by the maximum and message sources while they are active.
 * @param maximum Static maximum length or size, or a reactive function returning it.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export const maxLength = (
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
     *   value: field('abcd', [
     *     maxLength(3, {
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
     *   value: field('abcd', [
     *     maxLength(3, {
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
     *   value: field('abcd', [
     *     maxLength(3, {
     *       error: { kind: 'custom' },
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('abcd', [
     *     maxLength(3, {
     *       error: () => ({ kind: 'custom' }),
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('abcd', [
     *     maxLength(3, {
     *       error: [
     *         { kind: 'custom' },
     *       ],
     *     }),
     *   ]),
     * });
     * ```
     */
    error?: ValidationResult | ((context: ValidatorContext<ValueWithLengthOrSize | null>) => ValidationResult);
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
     *   value: field('abcd', [
     *     maxLength(3, { when: () => active() }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<ValueWithLengthOrSize | null>) => boolean)>;
  },
): Validator<ValueWithLengthOrSize | null> => {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<ValueWithLengthOrSize | null> = markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (isEmpty(currentValue)) return null;
    const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
    if (resolvedMaximum === undefined) return null;
    const actualLength = getLengthOrSize(currentValue!);
    return actualLength > resolvedMaximum
      ? { kind: 'maxLength', maxLength: resolvedMaximum, actual: actualLength, message: resolveValidatorMessage('maxLength', { maxLength: resolvedMaximum, actual: actualLength }, message, () => defaultMaxLengthMessage(resolvedMaximum)) }
      : null;
  }, MAX_LENGTH_METADATA, maximum);
  return applyValidatorWhen(validator, options);
};
