import { isEmpty } from '../../utils/is-empty';
import { MAX_LENGTH_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { defaultMaxLengthMessage } from '../utils/default-validator-messages';
import type { ValidationResult, Validator, ValidatorContext } from '../validation.type';
import { getLengthOrSize, type ValueWithLengthOrSize } from '../../utils/get-length-or-size';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';

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
 * field('', [maxLength(500, 'Keep this under 500 characters')]);
 * array(field(''), [], [maxLength(10, { message: 'Choose at most 10 items' })]);
 * ```
 *
 * @param maximum Static maximum length or size, or a reactive function returning it.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export const maxLength = (
  maximum: number | (() => number | undefined),
  options?: string | ({
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    error?: never;
  } | {
    message?: never;
    /** Custom error or errors returned instead of the built-in error. */
    error?: ValidationResult | ((context: ValidatorContext<ValueWithLengthOrSize | null>) => ValidationResult);
  }) & {
    /** Reactive predicate deciding whether this validator and its constraint metadata are active. */
    when?: (context: ValidatorContext<ValueWithLengthOrSize | null>) => boolean;
  },
): Validator<ValueWithLengthOrSize | null> => {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<ValueWithLengthOrSize | null> = markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (isEmpty(currentValue)) return null;
    const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
    if (resolvedMaximum === undefined) return null;
    const actualLength = getLengthOrSize(currentValue!);
    return actualLength > resolvedMaximum
      ? { kind: 'maxLength', maxLength: resolvedMaximum, actual: actualLength, message: resolveValidatorMessage('maxLength', { maxLength: resolvedMaximum, actual: actualLength }, message, () => defaultMaxLengthMessage(resolvedMaximum)) }
      : null;
  }, MAX_LENGTH_METADATA, maximum);
  return applyValidatorWhen(validator, options);
};
