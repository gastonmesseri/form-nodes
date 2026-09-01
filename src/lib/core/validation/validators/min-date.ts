import type { ValidationResult, Validator, ValidatorContext } from '../validation.type';
import { normalizeDateConstraintSource, type DateConstraintSource } from './date-constraint';
import { MIN_DATE_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultMinDateMessage } from './default-validator-messages';
import { applyValidatorWhen, resolveValidatorMessageOption } from './validator-options';

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
 * @reactive Tracks signals read by the minimum and message sources while they are active.
 *
 * @example
 * ```ts
 * field<Date>(null, [minDate(new Date('2026-01-01'))]);
 * field<Date>(null, [minDate('2026-01-01')]);
 * field<Date>(null, [minDate('2026-01-01', 'Choose a later date')]);
 * field<Date>(null, [minDate('2026-01-01', { parseAs: 'local' })]);
 * field<Date>(null, [minDate(moment('2026-01-01').toDate())]);
 * field<Date>(null, [minDate('today')]);
 * field<Date>(null, [minDate(() => useCurrentDay() ? 'today' : '2026-01-01')]);
 * field<Date>(null, [minDate(() => bookingWindowStart())]);
 * ```
 *
 * @param minimum Static minimum date or ISO calendar-date string, or a reactive function returning one.
 * @param options Optional static message string, or an object containing a message and string parsing mode. `parseAs` defaults to `'utc'`.
 */
export const minDate = (
  minimum: Date | 'today' | (string & {}) | (() => Date | 'today' | (string & {}) | undefined),
  options?: string | ({
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    error?: never;
  } | {
    message?: never;
    /** Custom error or errors returned instead of the built-in error. */
    error?: ValidationResult | ((context: ValidatorContext<Date | null>) => ValidationResult);
  }) & {
    /** Reactive predicate deciding whether this validator and its constraint metadata are active. */
    when?: (context: ValidatorContext<Date | null>) => boolean;
    /** Interprets calendar-date strings at UTC or local midnight. Defaults to `'utc'`. */
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
