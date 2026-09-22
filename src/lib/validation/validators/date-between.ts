import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { MAX_DATE_METADATA, MIN_DATE_METADATA } from '../constraint-metadata';
import { defaultDateBetweenMessage } from '../utils/default-validator-messages';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import { normalizeDateConstraintSource, type DateConstraintSource } from '../utils/date-constraint';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext } from '../validation.type';

type ResolvedDateBounds = {
  minimum: Date;
  maximum: Date;
};

const resolveDateSource = (source: Date | (() => Date | undefined)): Date | undefined => {
  return typeof source === 'function' ? source() : source;
};

/**
 * Requires a valid, non-empty date to be within an inclusive date range.
 *
 * `null` and invalid current dates pass so this validator can be composed with `required`. Both
 * limits accept a `Date`, an ISO calendar-date string (`YYYY-MM-DD`), a relative shortcut
 * (`'today'`), or a reactively tracked function returning one of
 * those representations. Strings and shortcuts use UTC midnight by default; set `parseAs` to
 * `'local'` to use local midnight. An absent or invalid limit disables the range temporarily.
 * A failure produces `{ kind: 'dateBetween', minDate, maxDate, actual, message }`.
 *
 * The validator also contributes both dates to the node's `min()` and `max()` metadata.
 *
 * ```ts
 * const profile = form({
 *   value: field(new Date('2025-01-01'), [
 *     dateBetween('2026-01-01', '2026-12-31'),
 *   ]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * ```ts
 * import { signal } from '@angular/core';
 *
 * const limit = signal('2026-01-01');
 * const profile = form({
 *   value: field(new Date('2025-01-01'), [
 *     dateBetween(() => limit(), '2026-12-31'),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * const profile = form({
 *   value: field(new Date('2025-01-01'), [
 *     dateBetween(
 *       '2026-01-01',
 *       '2026-12-31',
 *       'Check this value.',
 *     ),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * form({
 *   date: field<Date>(null, [
 *     dateBetween(
 *       new Date('2026-01-01'),
 *       new Date('2026-12-31'),
 *     ),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * form({
 *   date: field<Date>(null, [
 *     dateBetween('today', '2026-12-31'),
 *   ]),
 * });
 * ```
 *
 * @reactive Tracks signals read by both limits and the message source while they are active.
 * @param minimum Static inclusive minimum date or ISO calendar-date string, or a reactive function returning one.
 * @param maximum Static inclusive maximum date or ISO calendar-date string, or a reactive function returning one.
 * @param options Optional static message string, or an object containing a message and string parsing mode. `parseAs` defaults to `'utc'`.
 */
export const dateBetween = (
  minimum: Date | 'today' | (string & {}) | (() => Date | 'today' | (string & {}) | undefined),
  maximum: Date | 'today' | (string & {}) | (() => Date | 'today' | (string & {}) | undefined),
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
     *   value: field(new Date('2025-01-01'), [
     *     dateBetween('2026-01-01', '2026-12-31', {
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
     *   value: field(new Date('2025-01-01'), [
     *     dateBetween('2026-01-01', '2026-12-31', {
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
     *   value: field(new Date('2025-01-01'), [
     *     dateBetween('2026-01-01', '2026-12-31', {
     *       error: { kind: 'custom' },
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field(new Date('2025-01-01'), [
     *     dateBetween('2026-01-01', '2026-12-31', {
     *       error: () => ({ kind: 'custom' }),
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field(new Date('2025-01-01'), [
     *     dateBetween('2026-01-01', '2026-12-31', {
     *       error: [
     *         { kind: 'custom' },
     *       ],
     *     }),
     *   ]),
     * });
     * ```
     */
    error?: ValidationResult | ((context: ValidatorContext<Date | null>) => ValidationResult);
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
     *   value: field(new Date('2025-01-01'), [
     *     dateBetween('2026-01-01', '2026-12-31', {
     *       when: () => active(),
     *     }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<Date | null>) => boolean)>;
    /**
     * Interprets calendar-date strings and the `today` shortcut at UTC or local midnight.
     * Existing Date objects retain their timestamps.
     *
     * **Default:** `'utc'`.
     *
     * **Accepted values:**
     *
     * - `utc`: Resolve the calendar date at UTC midnight.
     * - `local`: Resolve it at midnight in the local timezone.
     *
     * ```ts
     * const profile = form({
     *   value: field(new Date('2025-01-01'), [
     *     dateBetween('2026-01-01', '2026-12-31', {
     *       parseAs: 'local',
     *     }),
     *   ]),
     * });
     * ```
     */
    parseAs?: 'utc' | 'local';
  },
): Validator<Date | null> => {
  const parseAs = typeof options === 'object' ? options.parseAs ?? 'utc' : 'utc';
  const message = resolveValidatorMessageOption(options);
  const normalizedMinimum = normalizeDateConstraintSource(minimum as DateConstraintSource, parseAs);
  const normalizedMaximum = normalizeDateConstraintSource(maximum as DateConstraintSource, parseAs);
  const resolveBounds = (): ResolvedDateBounds | undefined => {
    const resolvedMinimum = resolveDateSource(normalizedMinimum);
    const resolvedMaximum = resolveDateSource(normalizedMaximum);
    if (
      resolvedMinimum === undefined
      || resolvedMaximum === undefined
      || Number.isNaN(resolvedMinimum.getTime())
      || Number.isNaN(resolvedMaximum.getTime())
    ) return undefined;
    return { minimum: resolvedMinimum, maximum: resolvedMaximum };
  };
  const validator: Validator<Date | null> = ({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue.getTime())) return null;
    const bounds = resolveBounds();
    if (bounds === undefined) return null;
    if (currentValue >= bounds.minimum && currentValue <= bounds.maximum) return null;
    const parameters = { minDate: bounds.minimum, maxDate: bounds.maximum, actual: currentValue };
    return {
      kind: 'dateBetween',
      ...parameters,
      message: resolveValidatorMessage('dateBetween', parameters, message, () => defaultDateBetweenMessage(bounds.minimum, bounds.maximum)),
    };
  };
  markValidatorMetadata(validator, MIN_DATE_METADATA, () => resolveBounds()?.minimum);
  return applyValidatorWhen(
    markValidatorMetadata(validator, MAX_DATE_METADATA, () => resolveBounds()?.maximum),
    options,
  );
};
