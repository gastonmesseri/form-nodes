import type { Validator } from '../validation.type';
import { markValidatorMetadata } from '../validator-metadata';
import { MIN_DATE_METADATA, type ConstraintSource } from '../constraint-metadata';
import { defaultValidatorMessages } from './default-validator-messages';
import type { ValidatorOptions } from './validator-options';

/** Requires a date on or after a static or reactive minimum date. */
export const minDate = (
  minimum: ConstraintSource<Date>,
  options?: ValidatorOptions,
): Validator<Date | null> => {
  return markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue.getTime())) return null;
    const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
    if (resolvedMinimum === undefined || Number.isNaN(resolvedMinimum.getTime())) return null;
    return currentValue < resolvedMinimum
      ? { kind: 'minDate', minDate: resolvedMinimum, message: options?.message ?? defaultValidatorMessages.minDate(resolvedMinimum) }
      : null;
  }, MIN_DATE_METADATA, minimum);
};
