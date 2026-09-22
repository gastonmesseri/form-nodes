import { markValidatorMetadata } from '../validator-metadata';
import { MAX_METADATA, MIN_METADATA } from '../constraint-metadata';
import { defaultBetweenMessage } from '../utils/default-validator-messages';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext } from '../validation.type';

type ResolvedBounds = {
  minimum: number;
  maximum: number;
};

const resolveBound = (source: number | (() => number | undefined)): number | undefined => {
  return typeof source === 'function' ? source() : source;
};

/**
 * Requires a non-empty number to be within an inclusive range.
 *
 * `null` and `NaN` pass so this validator can be composed with `required`. Both limits may be
 * static or returned by reactively tracked functions. Returning `undefined` or `NaN` from either
 * source disables the range temporarily. A failure produces
 * `{ kind: 'between', min, max, actual, message }`.
 *
 * The validator also contributes both limits to the node's `min()` and `max()` metadata.
 *
 * ```ts
 * const profile = form({
 *   value: field(16, [between(18, 65)]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * ```ts
 * import { signal } from '@angular/core';
 *
 * const limit = signal(18);
 * const profile = form({
 *   value: field(16, [
 *     between(() => limit(), 65),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * const profile = form({
 *   value: field(16, [
 *     between(18, 65, 'Check this value.'),
 *   ]),
 * });
 * ```
 *
 * @reactive Tracks signals read by both limits and the message source while they are active.
 * @param minimum Static inclusive minimum or a reactive function returning it.
 * @param maximum Static inclusive maximum or a reactive function returning it.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export const between = (
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
     *   value: field(16, [
     *     between(18, 65, {
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
     *   value: field(16, [
     *     between(18, 65, {
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
     *   value: field(16, [
     *     between(18, 65, {
     *       error: { kind: 'custom' },
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field(16, [
     *     between(18, 65, {
     *       error: () => ({ kind: 'custom' }),
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field(16, [
     *     between(18, 65, {
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
     * **Return Type:** `boolean` for the condition callback.
     *
     * **Default:** `undefined`; the validator remains active.
     *
     * ```ts
     * import { signal } from '@angular/core';
     *
     * const active = signal(true);
     * const profile = form({
     *   value: field(16, [
     *     between(18, 65, {
     *       when: () => active(),
     *     }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<number | null>) => boolean)>;
  },
): Validator<number | null> => {
  const message = resolveValidatorMessageOption(options);
  const resolveBounds = (): ResolvedBounds | undefined => {
    const resolvedMinimum = resolveBound(minimum);
    const resolvedMaximum = resolveBound(maximum);
    if (
      resolvedMinimum === undefined
      || resolvedMaximum === undefined
      || Number.isNaN(resolvedMinimum)
      || Number.isNaN(resolvedMaximum)
    ) return undefined;
    return { minimum: resolvedMinimum, maximum: resolvedMaximum };
  };
  const validator: Validator<number | null> = ({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue)) return null;
    const bounds = resolveBounds();
    if (bounds === undefined) return null;
    if (currentValue >= bounds.minimum && currentValue <= bounds.maximum) return null;
    const parameters = { min: bounds.minimum, max: bounds.maximum, actual: currentValue };
    return {
      kind: 'between',
      ...parameters,
      message: resolveValidatorMessage('between', parameters, message, () => defaultBetweenMessage(bounds.minimum, bounds.maximum)),
    };
  };
  markValidatorMetadata(validator, MIN_METADATA, () => resolveBounds()?.minimum);
  return applyValidatorWhen(
    markValidatorMetadata(validator, MAX_METADATA, () => resolveBounds()?.maximum),
    options,
  );
};
