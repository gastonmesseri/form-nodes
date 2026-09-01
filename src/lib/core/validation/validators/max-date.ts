import type { Validator } from '../validation.type';
import { markValidatorMetadata } from '../validator-metadata';
import { MAX_DATE_METADATA, type ConstraintSource } from '../constraint-metadata';
import { defaultValidatorMessages } from './default-validator-messages';
import type { ValidatorOptions } from './validator-options';

/** Requires a date on or before a static or reactive maximum date. */
export const maxDate = (
  maximum: ConstraintSource<Date>,
  options?: ValidatorOptions,
): Validator<Date | null> => {
  return markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue.getTime())) return null;
    const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
    if (resolvedMaximum === undefined || Number.isNaN(resolvedMaximum.getTime())) return null;
    return currentValue > resolvedMaximum
      ? { kind: 'maxDate', maxDate: resolvedMaximum, message: options?.message ?? defaultValidatorMessages.maxDate(resolvedMaximum) }
      : null;
  }, MAX_DATE_METADATA, maximum);
};
