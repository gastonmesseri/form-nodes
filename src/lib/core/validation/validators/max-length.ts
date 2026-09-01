import { isEmpty } from '../../utils/is-empty';
import type { Validator } from '../validation.type';
import { MAX_LENGTH_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultValidatorMessages } from './default-validator-messages';
import { getLengthOrSize, type ValueWithLengthOrSize } from '../../utils/get-length-or-size';

/**
 * Requires a non-empty value's numeric `length` or `size` not to exceed a maximum.
 *
 * This supports strings, arrays, sets, maps, and other values with a numeric `length` or `size`.
 * `null` and `''` pass so this validator can be composed with `required`; an empty array or set is
 * validated normally. A reactive constraint may return `undefined` to disable itself temporarily.
 * A failure produces `{ kind: 'maxLength', maxLength, actual, message }`, where `actual` is the
 * observed length or size.
 *
 * @reactive Tracks signals read by the maximum and message sources while they are active.
 *
 * @example
 * ```ts
 * field('', [maxLength(500)]);
 * array(field(''), [], [maxLength(10, { message: 'Choose at most 10 items' })]);
 * ```
 *
 * @param maximum Static maximum length or size, or a reactive function returning it.
 * @param options Optional static or reactive custom validation message.
 */
export const maxLength = (
  maximum: number | (() => number | undefined),
  options?: {
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
  },
): Validator<ValueWithLengthOrSize | null> => {
  return markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (isEmpty(currentValue)) return null;
    const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
    if (resolvedMaximum === undefined) return null;
    const actualLength = getLengthOrSize(currentValue!);
    return actualLength > resolvedMaximum
      ? { kind: 'maxLength', maxLength: resolvedMaximum, actual: actualLength, message: resolveValidatorMessage('maxLength', { maxLength: resolvedMaximum, actual: actualLength }, options?.message, () => defaultValidatorMessages.maxLength(resolvedMaximum)) }
      : null;
  }, MAX_LENGTH_METADATA, maximum);
};
