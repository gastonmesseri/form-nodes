import { isNil } from '../../utils/is-nil';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { MAX_LENGTH_METADATA, MIN_LENGTH_METADATA } from '../constraint-metadata';
import { getLengthOrSize, type ValueWithLengthOrSize } from '../../utils/get-length-or-size';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import { defaultMaxLengthMessage, defaultMinLengthMessage } from '../utils/default-validator-messages';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext, ValidatorError } from '../validation.type';

/**
 * Combines inclusive minimum and maximum length constraints in one validator.
 *
 * Supports strings, arrays, sets, maps, and values with numeric `length` or `size`.
 * Nullish values pass; empty strings and collections fail a positive minimum.
 * Like `maxLength`, the upper constraint skips empty strings. Each reactive limit may return
 * `undefined` to disable only that limit. Bounds are not reordered or rounded.
 * Failures retain the `minLength` and `maxLength` error kinds, parameters, and message fallbacks.
 * Both limits contribute to the corresponding node metadata without making the node required.
 *
 * ```ts
 * const profile = form({
 *   value: field('ab', [lengthBetween(3, 20)]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * ```ts
 * import { signal } from '@angular/core';
 *
 * const limit = signal(3);
 * const profile = form({
 *   value: field('ab', [
 *     lengthBetween(() => limit(), 20),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * const profile = form({
 *   value: field('ab', [
 *     lengthBetween(
 *       3,
 *       20,
 *       'Check this value.',
 *     ),
 *   ]),
 * });
 * ```
 *
 * @reactive Tracks signals read by active limits, conditions, and failing message or error sources.
 * @param minimum Static inclusive minimum length or size, or a reactive function returning it.
 * @param maximum Static inclusive maximum length or size, or a reactive function returning it.
 * @param options Custom message or options for a reactive condition, message, or replacement error.
 */
export const lengthBetween = (
  minimum: number | (() => number | undefined),
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
     *   value: field('ab', [
     *     lengthBetween(3, 20, {
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
     *     lengthBetween(3, 20, {
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
     *     lengthBetween(3, 20, {
     *       error: { kind: 'custom' },
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('ab', [
     *     lengthBetween(3, 20, {
     *       error: () => ({ kind: 'custom' }),
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('ab', [
     *     lengthBetween(3, 20, {
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
     *   value: field('ab', [
     *     lengthBetween(3, 20, {
     *       when: () => active(),
     *     }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<ValueWithLengthOrSize | null | undefined>) => boolean)>;
  },
): Validator<ValueWithLengthOrSize | null | undefined> => {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<ValueWithLengthOrSize | null | undefined> = ({ value }) => {
    const currentValue = value();
    if (isNil(currentValue)) return null;
    const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
    const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
    const actual = getLengthOrSize(currentValue);
    const errors: ValidatorError[] = [];
    if (resolvedMinimum !== undefined && actual < resolvedMinimum) {
      const parameters = { minLength: resolvedMinimum, actual };
      errors.push({
        kind: 'minLength',
        ...parameters,
        message: resolveValidatorMessage('minLength', parameters, message, () => defaultMinLengthMessage(resolvedMinimum)),
      });
    }
    if (currentValue !== '' && resolvedMaximum !== undefined && actual > resolvedMaximum) {
      const parameters = { maxLength: resolvedMaximum, actual };
      errors.push({
        kind: 'maxLength',
        ...parameters,
        message: resolveValidatorMessage('maxLength', parameters, message, () => defaultMaxLengthMessage(resolvedMaximum)),
      });
    }
    return errors;
  };
  markValidatorMetadata(validator, MIN_LENGTH_METADATA, minimum);
  return applyValidatorWhen(markValidatorMetadata(validator, MAX_LENGTH_METADATA, maximum), options);
};
