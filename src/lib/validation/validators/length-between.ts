import { isNil } from '../../utils/is-nil';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { MAX_LENGTH_METADATA, MIN_LENGTH_METADATA } from '../constraint-metadata';
import { getLengthOrSize, type ValueWithLengthOrSize } from '../../utils/get-length-or-size';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import { defaultMaxLengthMessage, defaultMinLengthMessage } from '../utils/default-validator-messages';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext, ValidatorError } from '../validation.type';

/**
 * Combines inclusive minimum and maximum length constraints in one validator.
 *
 * Supports strings, arrays, sets, maps, and values with numeric `length` or `size`.
 * Nullish values pass; empty strings and collections fail a positive minimum.
 * Like `maxLength`, the upper constraint skips empty strings. Each reactive limit may return
 * `undefined` to disable only that limit. Bounds are not reordered or rounded.
 * Failures retain the `minLength` and `maxLength` error kinds, parameters, and message fallbacks.
 * Both limits contribute to the corresponding node metadata without making the node required.
 *
 * @reactive Tracks signals read by active limits, conditions, and failing message or error sources.
 *
 * @example
 * ```ts
 * const profile = form({
 *   username: field('', [lengthBetween(3, 20)]),
 * });
 * ```
 *
 * @example
 * ```ts
 * lengthBetween(() => minimumLength(), () => maximumLength());
 * lengthBetween(3, 20, 'Enter between 3 and 20 characters');
 * ```
 *
 * @param minimum Static inclusive minimum length or size, or a reactive function returning it.
 * @param maximum Static inclusive maximum length or size, or a reactive function returning it.
 * @param options Custom message or options for a reactive condition, message, or replacement error.
 */
export const lengthBetween = (
  minimum: number | (() => number | undefined),
  maximum: number | (() => number | undefined),
  options?: string | ({
    /** Static or reactive message used for either failing limit. Undefined uses the existing fallbacks. */
    message?: string | (() => string | undefined);
    error?: never;
  } | {
    message?: never;
    /** Custom error or errors replacing all failures, evaluated once when either limit fails. */
    error?: ValidationResult | ((context: ValidatorContext<ValueWithLengthOrSize | null | undefined>) => ValidationResult);
  }) & {
    /** Reactive predicate controlling both validation and constraint metadata. */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<ValueWithLengthOrSize | null | undefined>) => boolean)>;
  },
): Validator<ValueWithLengthOrSize | null | undefined> => {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<ValueWithLengthOrSize | null | undefined> = ({ value }) => {
    const currentValue = value();
    if (isNil(currentValue)) return null;
    const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
    const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
    const actual = getLengthOrSize(currentValue);
    const errors: ValidatorError[] = [];
    if (resolvedMinimum !== undefined && actual < resolvedMinimum) {
      const parameters = { minLength: resolvedMinimum, actual };
      errors.push({
        kind: 'minLength',
        ...parameters,
        message: resolveValidatorMessage('minLength', parameters, message, () => defaultMinLengthMessage(resolvedMinimum)),
      });
    }
    if (currentValue !== '' && resolvedMaximum !== undefined && actual > resolvedMaximum) {
      const parameters = { maxLength: resolvedMaximum, actual };
      errors.push({
        kind: 'maxLength',
        ...parameters,
        message: resolveValidatorMessage('maxLength', parameters, message, () => defaultMaxLengthMessage(resolvedMaximum)),
      });
    }
    return errors;
  };
  markValidatorMetadata(validator, MIN_LENGTH_METADATA, minimum);
  return applyValidatorWhen(markValidatorMetadata(validator, MAX_LENGTH_METADATA, maximum), options);
};
