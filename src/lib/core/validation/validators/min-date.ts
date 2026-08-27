import type { Validator } from '../validation.type';
import { parseDateConstraint } from './date-constraint';
import { MIN_DATE_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultValidatorMessages } from './default-validator-messages';

/**
 * Requires a valid, non-empty date to be on or after a minimum date.
 *
 * `null` and invalid current dates pass so this validator can be composed with `required`. The
 * minimum may be a `Date`, an ISO calendar-date string (`YYYY-MM-DD`), or returned by a reactively
 * tracked function. Strings are parsed as UTC by default; set `parseAs` to `'local'` to use local
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
 * field<Date>(null, [minDate('2026-01-01', { parseAs: 'local' })]);
 * field<Date>(null, [minDate(moment('2026-01-01').toDate())]);
 * field<Date>(null, [minDate(() => bookingWindowStart())]);
 * ```
 *
 * @param minimum Static minimum date or ISO calendar-date string, or a reactive function returning one.
 * @param options Optional static or reactive custom message and string parsing mode. `parseAs` defaults to `'utc'`.
 */
export const minDate = (
  minimum: Date | string | (() => Date | string | undefined),
  options?: {
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    /** Interprets calendar-date strings at UTC or local midnight. Defaults to `'utc'`. */
    parseAs?: 'utc' | 'local';
  },
): Validator<Date | null> => {
  const parseAs = options?.parseAs ?? 'utc';
  const normalizedMinimum = typeof minimum === 'function'
    ? () => {
      const value = minimum();
      return value === undefined ? undefined : parseDateConstraint(value, parseAs);
    }
    : parseDateConstraint(minimum, parseAs);

  return markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue.getTime())) return null;
    const resolvedMinimum = typeof normalizedMinimum === 'function' ? normalizedMinimum() : normalizedMinimum;
    if (resolvedMinimum === undefined || Number.isNaN(resolvedMinimum.getTime())) return null;
    return currentValue < resolvedMinimum
      ? { kind: 'minDate', minDate: resolvedMinimum, actual: currentValue, message: resolveValidatorMessage('minDate', { minDate: resolvedMinimum, actual: currentValue }, options?.message, () => defaultValidatorMessages.minDate(resolvedMinimum)) }
      : null;
  }, MIN_DATE_METADATA, normalizedMinimum);
};
