import { isNil } from '../../utils/is-nil';
import { defaultOneOfMessage } from '../utils/default-validator-messages';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext } from '../validation.type';

/**
 * Requires a non-empty value to equal one of the allowed values.
 *
 * `null`, `undefined`, and the empty string are accepted so this validator can be composed with
 * `required`. Values use `Array.prototype.includes` equality, including reference equality for
 * objects. A source function is evaluated reactively and may return `undefined` to disable the
 * constraint temporarily. A failure produces
 * `{ kind: 'oneOf', options, actual, message }`, where `options` contains the resolved allowed
 * values and `actual` contains the rejected value.
 *
 * ```ts
 * const profile = form({
 *   value: field('draft', [
 *     oneOf(['published', 'archived']),
 *   ]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * ```ts
 * import { signal } from '@angular/core';
 *
 * const limit = signal([
 *   'published',
 *   'archived',
 * ]);
 * const profile = form({
 *   value: field('draft', [
 *     oneOf(() => limit()),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * const profile = form({
 *   value: field('draft', [
 *     oneOf(
 *       ['published', 'archived'],
 *       'Check this value.',
 *     ),
 *   ]),
 * });
 * ```
 *
 * @reactive Tracks signals read by the allowed-values and message sources while they are active.
 * @param allowedValues Static allowed values or a reactive function returning them.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export function oneOf<TValue = never>(
  allowedValues: readonly NoInfer<TValue>[] | (() => readonly NoInfer<TValue>[] | undefined),
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
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
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
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
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
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
     *       error: { kind: 'custom' },
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
     *       error: () => ({ kind: 'custom' }),
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
     *       error: [
     *         { kind: 'custom' },
     *       ],
     *     }),
     *   ]),
     * });
     * ```
     */
    error?: ValidationResult | ((context: ValidatorContext<TValue | null | undefined>) => ValidationResult);
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
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
     *       when: () => active(),
     *     }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<TValue | null | undefined>) => boolean)>;
  },
): Validator<TValue | null | undefined>;
/**
 * Infers the constraint value type when no consuming node provides a context.
 *
 * ```ts
 * const statusRule = oneOf(['published']);
 * const article = form({
 *   status: field('draft', [statusRule]),
 * });
 * article.status.invalid(); // true
 * ```
 *
 * ```ts
 * import { signal } from '@angular/core';
 *
 * const limit = signal([
 *   'published',
 *   'archived',
 * ]);
 * const profile = form({
 *   value: field('draft', [
 *     oneOf(() => limit()),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * const profile = form({
 *   value: field('draft', [
 *     oneOf(
 *       ['published', 'archived'],
 *       'Check this value.',
 *     ),
 *   ]),
 * });
 * ```
 */
export function oneOf<TValue>(
  allowedValues: readonly TValue[] | (() => readonly TValue[] | undefined),
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
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
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
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
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
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
     *       error: { kind: 'custom' },
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
     *       error: () => ({ kind: 'custom' }),
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
     *       error: [
     *         { kind: 'custom' },
     *       ],
     *     }),
     *   ]),
     * });
     * ```
     */
    error?: ValidationResult | ((context: ValidatorContext<TValue | null | undefined>) => ValidationResult);
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
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
     *       when: () => active(),
     *     }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<TValue | null | undefined>) => boolean)>;
  },
): Validator<TValue | null | undefined>;
export function oneOf<TValue>(
  allowedValues: readonly TValue[] | (() => readonly TValue[] | undefined),
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
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
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
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
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
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
     *       error: { kind: 'custom' },
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
     *       error: () => ({ kind: 'custom' }),
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
     *       error: [
     *         { kind: 'custom' },
     *       ],
     *     }),
     *   ]),
     * });
     * ```
     */
    error?: ValidationResult | ((context: ValidatorContext<TValue | null | undefined>) => ValidationResult);
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
     *   value: field('draft', [
     *     oneOf(['published', 'archived'], {
     *       when: () => active(),
     *     }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<TValue | null | undefined>) => boolean)>;
  },
): Validator<TValue | null | undefined> {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<TValue | null | undefined> = ({ value }) => {
    const currentValue = value();
    if (isNil(currentValue) || currentValue === '') return null;
    const resolvedAllowedValues = typeof allowedValues === 'function' ? allowedValues() : allowedValues;
    if (resolvedAllowedValues === undefined || resolvedAllowedValues.includes(currentValue)) return null;
    return {
      kind: 'oneOf',
      options: resolvedAllowedValues,
      actual: currentValue,
      message: resolveValidatorMessage('oneOf', { options: resolvedAllowedValues, actual: currentValue }, message, defaultOneOfMessage),
    };
  };
  return applyValidatorWhen(validator, options);
}
