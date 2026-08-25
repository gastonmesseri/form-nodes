import type { Validator } from '../validation.type';
import { markValidatorMetadata } from '../validator-metadata';
import { MAX_DATE_METADATA, type ConstraintSource } from '../constraint-metadata';

/** Requires a date on or before a static or reactive maximum date. */
export const maxDate = (
  maximum: ConstraintSource<Date>,
): Validator<Date | null> => markValidatorMetadata(({ value }) => {
  const currentValue = value();
  if (currentValue === null || Number.isNaN(currentValue.getTime())) return null;
  const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
  if (resolvedMaximum === undefined || Number.isNaN(resolvedMaximum.getTime())) return null;
  return currentValue > resolvedMaximum
    ? { kind: 'maxDate', maxDate: resolvedMaximum }
    : null;
}, MAX_DATE_METADATA, maximum);
