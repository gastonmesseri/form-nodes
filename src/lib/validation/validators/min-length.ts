import { isNil } from '../../utils/is-nil';
import { MIN_LENGTH_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { defaultMinLengthMessage } from '../utils/default-validator-messages';
import { getLengthOrSize, type ValueWithLengthOrSize } from '../../utils/get-length-or-size';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext } from '../validation.type';

/**
 * Requires a present value's numeric `length` or `size` to meet a minimum.
 *
 * This supports strings, arrays, sets, maps, and other values with a numeric `length` or `size`.
 * Empty strings, `null`, and `undefined` pass so this validator can be composed with `required`.
 * Empty collections have length zero and fail a positive minimum, matching Angular Signal Forms.
 * Set `allowEmptyString: false` to measure empty strings as zero too.
 * A reactive constraint may return `undefined` to disable itself temporarily.
 * A failure produces `{ kind: 'minLength', minLength, actual, message }`, where `actual` is the
 * observed length or size.
 *
 * ```ts
 * const profile = form({
 *   value: field('ab', [minLength(3)]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * Empty strings are optional by default, but empty arrays must meet the minimum:
 *
 * ```ts
 * const profile = form({
 *   name: field('', [minLength(3)]),
 *   tags: field<string[]>([], [minLength(3)]),
 * });
 * profile.name.valid(); // true
 * profile.tags.valid(); // false
 * profile.tags.hasError('minLength'); // true
 * profile.name.set('a');
 * profile.name.valid(); // false
 * ```
 *
 * ```ts
 * import { signal } from '@angular/core';
 *
 * const limit = signal(3);
 * const profile = form({
 *   value: field('ab', [
 *     minLength(() => limit()),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * const profile = form({
 *   value: field('ab', [
 *     minLength(3, 'Check this value.'),
 *   ]),
 * });
 * ```
 *
 * @reactive Tracks signals read by the minimum and message sources while they are active.
 * @param minimum Static minimum length or size, or a reactive function returning it.
 * @param options Custom message or options for empty text, a condition, message, or replacement error.
 */
export const minLength = (
  minimum: number | (() => number | undefined),
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
     *   value: field('ab', [
     *     minLength(3, {
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
     *   value: field('ab', [
     *     minLength(3, {
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
     *   value: field('ab', [
     *     minLength(3, {
     *       error: { kind: 'custom' },
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('ab', [
     *     minLength(3, {
     *       error: () => ({ kind: 'custom' }),
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('ab', [
     *     minLength(3, {
     *       error: [
     *         { kind: 'custom' },
     *       ],
     *     }),
     *   ]),
     * });
     * ```
     */
    error?: ValidationResult | ((context: ValidatorContext<ValueWithLengthOrSize | null | undefined>) => ValidationResult);
  }) & {
    /**
     * Allows empty strings to pass the minimum-length check. Collections are still measured.
     * Set to false to measure empty text as zero; null and undefined still pass.
     *
     * **Default:** `true`.
     *
     * **Accepted values:**
     *
     * - `true`: Skip the minimum for empty strings.
     * - `false`: Apply the minimum to empty strings too.
     *
     * ```ts
     * const profile = form({
     *   name: field('', [
     *     minLength(3, {
     *       allowEmptyString: false,
     *     }),
     *   ]),
     * });
     * profile.name.invalid(); // true
     * ```
     */
    allowEmptyString?: boolean;
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
     *   value: field('ab', [
     *     minLength(3, { when: () => active() }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<ValueWithLengthOrSize | null | undefined>) => boolean)>;
  },
): Validator<ValueWithLengthOrSize | null | undefined> => {
  const message = resolveValidatorMessageOption(options);
  const allowEmptyString = typeof options === 'string' || options?.allowEmptyString !== false;
  const validator: Validator<ValueWithLengthOrSize | null | undefined> = markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (isNil(currentValue) || allowEmptyString && currentValue === '') return null;
    const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
    if (resolvedMinimum === undefined) return null;
    const actualLength = getLengthOrSize(currentValue);
    return actualLength < resolvedMinimum
      ? { kind: 'minLength', minLength: resolvedMinimum, actual: actualLength, message: resolveValidatorMessage('minLength', { minLength: resolvedMinimum, actual: actualLength }, message, () => defaultMinLengthMessage(resolvedMinimum)) }
      : null;
  }, MIN_LENGTH_METADATA, minimum);
  return applyValidatorWhen(validator, options);
};
