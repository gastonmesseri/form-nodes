import type { Validator } from '../validation.type';
import { markValidatorMetadata } from '../validator-metadata';
import { MIN_DATE_METADATA, type ConstraintSource } from '../constraint-metadata';

/** Requires a date on or after a static or reactive minimum date. */
export const minDate = (
  minimum: ConstraintSource<Date>,
): Validator<Date | null> => markValidatorMetadata(({ value }) => {
  const currentValue = value();
  if (currentValue === null || Number.isNaN(currentValue.getTime())) return null;
  const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
  if (resolvedMinimum === undefined || Number.isNaN(resolvedMinimum.getTime())) return null;
  return currentValue < resolvedMinimum
    ? { kind: 'minDate', minDate: resolvedMinimum }
    : null;
}, MIN_DATE_METADATA, minimum);
