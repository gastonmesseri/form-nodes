import type { Validator } from '../validation.type';
import { parseDateConstraint } from './date-constraint';
import { markValidatorMetadata } from '../validator-metadata';
import { MAX_DATE_METADATA, MIN_DATE_METADATA } from '../constraint-metadata';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultDateBetweenMessage } from './default-validator-messages';

type DateSource = Date | string | (() => Date | string | undefined);

type ResolvedDateBounds = {
  minimum: Date;
  maximum: Date;
};

const normalizeDateSource = (
  source: DateSource,
  parseAs: 'utc' | 'local',
): Date | (() => Date | undefined) => {
  if (typeof source !== 'function') return parseDateConstraint(source, parseAs);
  return () => {
    const value = source();
    return value === undefined ? undefined : parseDateConstraint(value, parseAs);
  };
};

const resolveDateSource = (source: Date | (() => Date | undefined)): Date | undefined => {
  return typeof source === 'function' ? source() : source;
};

/**
 * Requires a valid, non-empty date to be within an inclusive date range.
 *
 * `null` and invalid current dates pass so this validator can be composed with `required`. Both
 * limits accept a `Date`, an ISO calendar-date string (`YYYY-MM-DD`), or a reactively tracked
 * function returning either representation. Strings use UTC midnight by default; set `parseAs`
 * to `'local'` to use local midnight. An absent or invalid limit disables the range temporarily.
 * A failure produces `{ kind: 'dateBetween', minDate, maxDate, actual, message }`.
 *
 * The validator also contributes both dates to the node's `min()` and `max()` metadata.
 *
 * @reactive Tracks signals read by both limits and the message source while they are active.
 *
 * @example
 * ```ts
 * field<Date>(null, [dateBetween('2026-01-01', '2026-12-31')]);
 * field<Date>(null, [dateBetween(
 *   () => bookingWindow().start,
 *   () => bookingWindow().end,
 *   { parseAs: 'local', message: 'Choose a date within the booking window' },
 * )]);
 * field<Date>(null, [dateBetween(
 *   moment('2026-01-01').toDate(),
 *   moment('2026-12-31').toDate(),
 * )]);
 * ```
 *
 * @param minimum Static inclusive minimum date or ISO calendar-date string, or a reactive function returning one.
 * @param maximum Static inclusive maximum date or ISO calendar-date string, or a reactive function returning one.
 * @param options Optional static or reactive custom message and string parsing mode. `parseAs` defaults to `'utc'`.
 */
export const dateBetween = (
  minimum: Date | string | (() => Date | string | undefined),
  maximum: Date | string | (() => Date | string | undefined),
  options?: {
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    /** Interprets calendar-date strings at UTC or local midnight. Defaults to `'utc'`. */
    parseAs?: 'utc' | 'local';
  },
): Validator<Date | null> => {
  const parseAs = options?.parseAs ?? 'utc';
  const normalizedMinimum = normalizeDateSource(minimum, parseAs);
  const normalizedMaximum = normalizeDateSource(maximum, parseAs);
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
      message: resolveValidatorMessage('dateBetween', parameters, options?.message, () => defaultDateBetweenMessage(bounds.minimum, bounds.maximum)),
    };
  };
  markValidatorMetadata(validator, MIN_DATE_METADATA, () => resolveBounds()?.minimum);
  return markValidatorMetadata(validator, MAX_DATE_METADATA, () => resolveBounds()?.maximum);
};
