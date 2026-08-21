import type { Validator } from '../validation.type';

/** Requires a date on or before a static or reactive maximum date. */
export const maxDate = (
  maximum: Date | (() => Date | undefined),
): Validator<Date | null> => (value) => {
  if (value === null || Number.isNaN(value.getTime())) return null;
  const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
  if (resolvedMaximum === undefined || Number.isNaN(resolvedMaximum.getTime())) return null;
  return value > resolvedMaximum
    ? { maxDate: { maxDate: resolvedMaximum, actual: value } }
    : null;
};
