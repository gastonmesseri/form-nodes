import { isEmpty } from '../../utils/is-empty';
import { PATTERN_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { defaultPatternMessage } from '../utils/default-validator-messages';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext } from '../validation.type';

/**
 * Requires a non-empty string to match a regular expression.
 *
 * `null` and `''` pass so this validator can be composed with `required`. The expression may be
 * static or returned by a reactively tracked function; returning `undefined` disables the
 * constraint temporarily. The expression's `lastIndex` is reset before each validation so global
 * and sticky expressions do not start from stale matching state. A failure produces
 * `{ kind: 'pattern', pattern, actual, message }`.
 *
 * ```ts
 * const profile = form({
 *   value: field('123', [pattern(/^[a-z]+$/)]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * ```ts
 * import { signal } from '@angular/core';
 *
 * const limit = signal(/^[a-z]+$/);
 * const profile = form({
 *   value: field('123', [
 *     pattern(() => limit()),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * const profile = form({
 *   value: field('123', [
 *     pattern(/^[a-z]+$/, 'Check this value.'),
 *   ]),
 * });
 * ```
 *
 * @reactive Tracks signals read by the expression and message sources while they are active.
 * @param expression Static regular expression or a reactive function returning it.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export const pattern = (
  expression: RegExp | (() => RegExp | undefined),
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
     *   value: field('123', [
     *     pattern(/^[a-z]+$/, {
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
     *   value: field('123', [
     *     pattern(/^[a-z]+$/, {
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
     *   value: field('123', [
     *     pattern(/^[a-z]+$/, {
     *       error: { kind: 'custom' },
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('123', [
     *     pattern(/^[a-z]+$/, {
     *       error: () => ({ kind: 'custom' }),
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('123', [
     *     pattern(/^[a-z]+$/, {
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
     *   value: field('123', [
     *     pattern(/^[a-z]+$/, {
     *       when: () => active(),
     *     }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<string | null>) => boolean)>;
  },
): Validator<string | null> => {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<string | null> = markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (isEmpty(currentValue)) return null;
    const resolvedExpression = typeof expression === 'function' ? expression() : expression;
    if (resolvedExpression === undefined) return null;
    resolvedExpression.lastIndex = 0;
    return resolvedExpression.test(currentValue!)
      ? null
      : { kind: 'pattern', pattern: resolvedExpression, actual: currentValue, message: resolveValidatorMessage('pattern', { pattern: resolvedExpression, actual: currentValue! }, message, () => defaultPatternMessage(resolvedExpression)) };
  }, PATTERN_METADATA, expression);
  return applyValidatorWhen(validator, options);
};
