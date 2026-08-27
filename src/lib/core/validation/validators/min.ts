import type { Validator } from '../validation.type';
import { markValidatorMetadata } from '../validator-metadata';
import { MIN_METADATA, type ConstraintSource } from '../constraint-metadata';
import { defaultValidatorMessages } from './default-validator-messages';
import type { ValidatorOptions } from './validator-options';

/** Requires a number greater than or equal to a static or reactive minimum. */
export const min = (
  minimum: ConstraintSource<number>,
  options?: ValidatorOptions,
): Validator<number | null> => {
  return markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue)) return null;
    const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
    if (resolvedMinimum === undefined || Number.isNaN(resolvedMinimum)) return null;
    return currentValue < resolvedMinimum
      ? { kind: 'min', min: resolvedMinimum, message: options?.message ?? defaultValidatorMessages.min(resolvedMinimum) }
      : null;
  }, MIN_METADATA, minimum);
};
