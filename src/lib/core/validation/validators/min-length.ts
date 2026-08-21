import { isEmpty } from '../../utils/is-empty';
import type { Validator } from '../validation.type';
import { getLengthOrSize, type ValueWithLengthOrSize } from '../../utils/get-length-or-size';

/** Requires a non-empty value whose length or size meets a static or reactive minimum. */
export const minLength = (
  minimum: number | (() => number | undefined),
): Validator<ValueWithLengthOrSize | null> => ({ value }) => {
  const currentValue = value();
  if (isEmpty(currentValue)) return null;
  const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
  if (resolvedMinimum === undefined) return null;
  const actualLength = getLengthOrSize(currentValue!);
  return actualLength < resolvedMinimum
    ? { minLength: { minLength: resolvedMinimum, actualLength } }
    : null;
};
