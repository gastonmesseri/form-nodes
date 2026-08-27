import { isEmpty } from '../../utils/is-empty';
import type { Validator } from '../validation.type';
import { markValidatorMetadata } from '../validator-metadata';
import { MAX_LENGTH_METADATA, type ConstraintSource } from '../constraint-metadata';
import { getLengthOrSize, type ValueWithLengthOrSize } from '../../utils/get-length-or-size';
import { defaultValidatorMessages } from './default-validator-messages';
import type { ValidatorOptions } from './validator-options';

/** Requires a non-empty value whose length or size does not exceed a static or reactive maximum. */
export const maxLength = (
  maximum: ConstraintSource<number>,
  options?: ValidatorOptions,
): Validator<ValueWithLengthOrSize | null> => {
  return markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (isEmpty(currentValue)) return null;
    const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
    if (resolvedMaximum === undefined) return null;
    const actualLength = getLengthOrSize(currentValue!);
    return actualLength > resolvedMaximum
      ? { kind: 'maxLength', maxLength: resolvedMaximum, message: options?.message ?? defaultValidatorMessages.maxLength(resolvedMaximum) }
      : null;
  }, MAX_LENGTH_METADATA, maximum);
};
