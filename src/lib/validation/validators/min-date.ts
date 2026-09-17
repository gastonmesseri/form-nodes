import { MIN_DATE_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { defaultMinDateMessage } from '../utils/default-validator-messages';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import { normalizeDateConstraintSource, type DateConstraintSource } from '../utils/date-constraint';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext } from '../validation.type';

/**
 * Requires a valid, non-empty date to be on or after a minimum date.
 *
 * `null` and invalid current dates pass so this validator can be composed with `required`. The
 * minimum may be a `Date`, an ISO calendar-date string (`YYYY-MM-DD`), a relative shortcut
 * (`'today'`), or returned by a reactively tracked function.
 * Strings and shortcuts are parsed as UTC by default; set `parseAs` to `'local'` to use local
 * midnight. Returning `undefined`, an invalid `Date`, or an invalid string disables the constraint
 * temporarily. A failure produces
 * `{ kind: 'minDate', minDate, actual, message }` with the rejected `Date` as `actual`.
 *
 * ```ts
 * const profile = form({
 *   value: field(new Date('2026-01-01'), [
 *     minDate('2026-02-01'),
 *   ]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * ```ts
 * import { signal } from '@angular/core';
 *
 * const limit = signal('2026-02-01');
 * const profile = form({
 *   value: field(new Date('2026-01-01'), [
 *     minDate(() => limit()),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * const profile = form({
 *   value: field(new Date('2026-01-01'), [
 *     minDate(
 *       '2026-02-01',
 *       'Check this value.',
 *     ),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * form({
 *   date: field<Date>(null, [
 *     minDate(new Date('2026-01-01')),
 *   ]),
 * });
 * ```
 *
 * ```ts
 * form({
 *   date: field<Date>(null, [
 *     minDate('today'),
 *   ]),
 * });
 * ```
 *
 * @reactive Tracks signals read by the minimum and message sources while they are active.
 * @param minimum Static minimum date or ISO calendar-date string, or a reactive function returning one.
 * @param options Optional static message string, or an object containing a message and string parsing mode. `parseAs` defaults to `'utc'`.
 */
export const minDate = (
  minimum: Date | 'today' | (string & {}) | (() => Date | 'today' | (string & {}) | undefined),
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
     *   value: field(new Date('2026-01-01'), [
     *     minDate('2026-02-01', {
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
     *   value: field(new Date('2026-01-01'), [
     *     minDate('2026-02-01', {
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
     *   value: field(new Date('2026-01-01'), [
     *     minDate('2026-02-01', {
     *       error: { kind: 'custom' },
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field(new Date('2026-01-01'), [
     *     minDate('2026-02-01', {
     *       error: () => ({ kind: 'custom' }),
     *     }),
     *   ]),
     * });
     * ```
     *
     * ```ts
     * const profile = form({
     *   value: field(new Date('2026-01-01'), [
     *     minDate('2026-02-01', {
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
     * **Default:** `undefined`; the validator remains active.
     *
     * ```ts
     * import { signal } from '@angular/core';
     *
     * const active = signal(true);
     * const profile = form({
     *   value: field(new Date('2026-01-01'), [
     *     minDate('2026-02-01', {
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
     *   value: field(new Date('2026-01-01'), [
     *     minDate('2026-02-01', {
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

  const validator: Validator<Date | null> = markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue.getTime())) return null;
    const resolvedMinimum = typeof normalizedMinimum === 'function' ? normalizedMinimum() : normalizedMinimum;
    if (resolvedMinimum === undefined || Number.isNaN(resolvedMinimum.getTime())) return null;
    return currentValue < resolvedMinimum
      ? { kind: 'minDate', minDate: resolvedMinimum, actual: currentValue, message: resolveValidatorMessage('minDate', { minDate: resolvedMinimum, actual: currentValue }, message, () => defaultMinDateMessage(resolvedMinimum)) }
      : null;
  }, MIN_DATE_METADATA, normalizedMinimum);
  return applyValidatorWhen(validator, options);
};
