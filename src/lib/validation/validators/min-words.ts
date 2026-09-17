import { countWords } from '../../utils/count-words';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { defaultMinWordsMessage } from '../utils/default-validator-messages';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext } from '../validation.type';

/**
 * Requires a non-empty string to contain at least the configured number of words.
 *
 * A word is a Unicode letter-or-number sequence that may contain internal apostrophes or hyphens.
 * Empty strings and `null` pass so this validator can be composed with `required`. A source
 * function is evaluated reactively and may return `undefined` to disable the constraint. A
 * failure produces `{ kind: 'minWords', minWords, actual, message }`, where `actual` is the
 * observed word count.
 *
 * ```ts
 * const profile = form({
 *   value: field('One word', [minWords(3)]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * ```ts
 * import { signal } from '@angular/core';
 *
 * const limit = signal(3);
 * const profile = form({
 *   value: field('One word', [
 *     minWords(() => limit()),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * const profile = form({
 *   value: field('One word', [
 *     minWords(3, 'Check this value.'),
 *   ]),
 * });
 * ```
 *
 * @reactive Tracks signals read by the minimum and message sources while they are active.
 * @param minimum Static minimum word count or a reactive function returning it.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export const minWords = (
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
     *   value: field('One word', [
     *     minWords(3, {
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
     *   value: field('One word', [
     *     minWords(3, {
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
     *   value: field('One word', [
     *     minWords(3, {
     *       error: { kind: 'custom' },
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('One word', [
     *     minWords(3, {
     *       error: () => ({ kind: 'custom' }),
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('One word', [
     *     minWords(3, {
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
     *   value: field('One word', [
     *     minWords(3, { when: () => active() }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<string | null>) => boolean)>;
  },
): Validator<string | null> => {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<string | null> = ({ value }) => {
    const currentValue = value();
    if (currentValue === null || currentValue === '') return null;
    const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
    if (resolvedMinimum === undefined || Number.isNaN(resolvedMinimum)) return null;
    const actual = countWords(currentValue);
    return actual < resolvedMinimum
      ? { kind: 'minWords', minWords: resolvedMinimum, actual, message: resolveValidatorMessage('minWords', { minWords: resolvedMinimum, actual }, message, () => defaultMinWordsMessage(resolvedMinimum)) }
      : null;
  };
  return applyValidatorWhen(validator, options);
};
