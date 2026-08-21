import type { Validator } from '../validation.type';

/** Requires a date on or after a static or reactive minimum date. */
export const minDate = (
  minimum: Date | (() => Date | undefined),
): Validator<Date | null> => ({ value }) => {
  const currentValue = value();
  if (currentValue === null || Number.isNaN(currentValue.getTime())) return null;
  const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
  if (resolvedMinimum === undefined || Number.isNaN(resolvedMinimum.getTime())) return null;
  return currentValue < resolvedMinimum
    ? { minDate: { minDate: resolvedMinimum, actual: currentValue } }
    : null;
};
