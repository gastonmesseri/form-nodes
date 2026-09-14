import { isNil } from '../../utils/is-nil';
import { MIN_LENGTH_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { defaultMinLengthMessage } from '../utils/default-validator-messages';
import { getLengthOrSize, type ValueWithLengthOrSize } from '../../utils/get-length-or-size';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext } from '../validation.type';

/**
 * Requires a present value's numeric `length` or `size` to meet a minimum.
 *
 * This supports strings, arrays, sets, maps, and other values with a numeric `length` or `size`.
 * `null` and `undefined` pass so this validator can be composed with `required`. Empty strings and
 * collections have length zero and fail a positive minimum. Unlike Angular's `minLength`,
 * this validator does not skip empty strings; use `when` to explicitly allow optional empty text.
 * A reactive constraint may return `undefined` to disable itself temporarily.
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
  options?: string | ({
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    error?: never;
  } | {
    message?: never;
    /** Custom error or errors returned instead of the built-in error. */
    error?: ValidationResult | ((context: ValidatorContext<ValueWithLengthOrSize | null | undefined>) => ValidationResult);
  }) & {
    /** Reactive predicate deciding whether this validator and its constraint metadata are active. Parameterless conditions have unchecked returns for class self-references; return a boolean. Context-taking conditions retain boolean checking. */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<ValueWithLengthOrSize | null | undefined>) => boolean)>;
  },
): Validator<ValueWithLengthOrSize | null | undefined> => {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<ValueWithLengthOrSize | null | undefined> = markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (isNil(currentValue)) return null;
    const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
    if (resolvedMinimum === undefined) return null;
    const actualLength = getLengthOrSize(currentValue);
    return actualLength < resolvedMinimum
      ? { kind: 'minLength', minLength: resolvedMinimum, actual: actualLength, message: resolveValidatorMessage('minLength', { minLength: resolvedMinimum, actual: actualLength }, message, () => defaultMinLengthMessage(resolvedMinimum)) }
      : null;
  }, MIN_LENGTH_METADATA, minimum);
  return applyValidatorWhen(validator, options);
};
