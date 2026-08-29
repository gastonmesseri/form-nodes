import { isEmpty } from '../../utils/is-empty';
import type { Validator } from '../validation.type';
import { MIN_LENGTH_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultMinLengthMessage } from './default-validator-messages';
import { resolveValidatorMessageOption } from './validator-options';
import { getLengthOrSize, type ValueWithLengthOrSize } from '../../utils/get-length-or-size';

/**
 * Requires a non-empty value's numeric `length` or `size` to meet a minimum.
 *
 * This supports strings, arrays, sets, maps, and other values with a numeric `length` or `size`.
 * `null` and `''` pass so this validator can be composed with `required`; an empty array or set is
 * validated normally. A reactive constraint may return `undefined` to disable itself temporarily.
 * A failure produces `{ kind: 'minLength', minLength, actual, message }`, where `actual` is the
 * observed length or size.
 *
 * @reactive Tracks signals read by the minimum and message sources while they are active.
 *
 * @example
 * ```ts
 * field('', [required, minLength(3)]);
 * field('', [minLength(3, 'Enter at least 3 characters')]);
 * array(field(''), [], [minLength(() => minimumItems())]);
 * ```
 *
 * @param minimum Static minimum length or size, or a reactive function returning it.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export const minLength = (
  minimum: number | (() => number | undefined),
  options?: string | {
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
  },
): Validator<ValueWithLengthOrSize | null> => {
  const message = resolveValidatorMessageOption(options);
  return markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (isEmpty(currentValue)) return null;
    const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
    if (resolvedMinimum === undefined) return null;
    const actualLength = getLengthOrSize(currentValue!);
    return actualLength < resolvedMinimum
      ? { kind: 'minLength', minLength: resolvedMinimum, actual: actualLength, message: resolveValidatorMessage('minLength', { minLength: resolvedMinimum, actual: actualLength }, message, () => defaultMinLengthMessage(resolvedMinimum)) }
      : null;
  }, MIN_LENGTH_METADATA, minimum);
};
