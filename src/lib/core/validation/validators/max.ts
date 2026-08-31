import type { Validator } from '../validation.type';
import { markValidatorMetadata } from '../validator-metadata';
import { MAX_METADATA, type ConstraintSource } from '../constraint-metadata';

/** Requires a number less than or equal to a static or reactive maximum. */
export const max = (maximum: ConstraintSource<number>): Validator<number | null> =>
  markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue)) return null;
    const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
    if (resolvedMaximum === undefined || Number.isNaN(resolvedMaximum)) return null;
    return currentValue > resolvedMaximum
      ? { kind: 'max', max: resolvedMaximum }
      : null;
  }, MAX_METADATA, maximum);
