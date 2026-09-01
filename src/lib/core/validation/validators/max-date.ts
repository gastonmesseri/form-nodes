import type { Validator } from '../validation.type';
import { parseDateConstraint } from './date-constraint';
import { MAX_DATE_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultValidatorMessages } from './default-validator-messages';

/**
 * Requires a valid, non-empty date to be on or before a maximum date.
 *
 * `null` and invalid current dates pass so this validator can be composed with `required`. The
 * maximum may be a `Date`, an ISO calendar-date string (`YYYY-MM-DD`), or returned by a reactively
 * tracked function. Strings are parsed as UTC by default; set `parseAs` to `'local'` to use local
 * midnight. Returning `undefined`, an invalid `Date`, or an invalid string disables the constraint
 * temporarily. A failure produces
 * `{ kind: 'maxDate', maxDate, actual, message }` with the rejected `Date` as `actual`.
 *
 * @reactive Tracks signals read by the maximum and message sources while they are active.
 *
 * @example
 * ```ts
 * field<Date>(null, [maxDate(new Date('2026-12-31'))]);
 * field<Date>(null, [maxDate('2026-12-31')]);
 * field<Date>(null, [maxDate('2026-12-31', { parseAs: 'local' })]);
 * field<Date>(null, [maxDate(moment('2026-12-31').toDate())]);
 * field<Date>(null, [maxDate(() => bookingWindowEnd(), { message: 'Choose an earlier date' })]);
 * ```
 *
 * @param maximum Static maximum date or ISO calendar-date string, or a reactive function returning one.
 * @param options Optional static or reactive custom message and string parsing mode. `parseAs` defaults to `'utc'`.
 */
export const maxDate = (
  maximum: Date | string | (() => Date | string | undefined),
  options?: {
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    /** Interprets calendar-date strings at UTC or local midnight. Defaults to `'utc'`. */
    parseAs?: 'utc' | 'local';
  },
): Validator<Date | null> => {
  const parseAs = options?.parseAs ?? 'utc';
  const normalizedMaximum = typeof maximum === 'function'
    ? () => {
      const value = maximum();
      return value === undefined ? undefined : parseDateConstraint(value, parseAs);
    }
    : parseDateConstraint(maximum, parseAs);

  return markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue.getTime())) return null;
    const resolvedMaximum = typeof normalizedMaximum === 'function' ? normalizedMaximum() : normalizedMaximum;
    if (resolvedMaximum === undefined || Number.isNaN(resolvedMaximum.getTime())) return null;
    return currentValue > resolvedMaximum
      ? { kind: 'maxDate', maxDate: resolvedMaximum, actual: currentValue, message: resolveValidatorMessage('maxDate', { maxDate: resolvedMaximum, actual: currentValue }, options?.message, () => defaultValidatorMessages.maxDate(resolvedMaximum)) }
      : null;
  }, MAX_DATE_METADATA, normalizedMaximum);
};
