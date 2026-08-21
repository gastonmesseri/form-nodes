import { isEmpty } from '../../utils/is-empty';
import type { Validator } from '../validation.type';
import { getLengthOrSize, type ValueWithLengthOrSize } from '../../utils/get-length-or-size';

/** Requires a non-empty value whose length or size does not exceed a static or reactive maximum. */
export const maxLength = (
  maximum: number | (() => number | undefined),
): Validator<ValueWithLengthOrSize | null> => ({ value }) => {
  const currentValue = value();
  if (isEmpty(currentValue)) return null;
  const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
  if (resolvedMaximum === undefined) return null;
  const actualLength = getLengthOrSize(currentValue!);
  return actualLength > resolvedMaximum
    ? { kind: 'maxLength', maxLength: resolvedMaximum }
    : null;
};
