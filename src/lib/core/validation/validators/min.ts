import type { Validator } from '../validation.type';
import { markValidatorMetadata } from '../validator-metadata';
import { MIN_METADATA, type ConstraintSource } from '../constraint-metadata';

/** Requires a number greater than or equal to a static or reactive minimum. */
export const min = (minimum: ConstraintSource<number>): Validator<number | null> =>
  markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue)) return null;
    const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
    if (resolvedMinimum === undefined || Number.isNaN(resolvedMinimum)) return null;
    return currentValue < resolvedMinimum
      ? { kind: 'min', min: resolvedMinimum }
      : null;
  }, MIN_METADATA, minimum);
