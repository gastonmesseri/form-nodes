import { isNil } from '../../utils/is-nil';
import { defaultOneOfMessage } from '../utils/default-validator-messages';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import type { ValidationResult, Validator, ValidatorContext } from '../validation.type';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';

/**
 * Requires a non-empty value to equal one of the allowed values.
 *
 * `null`, `undefined`, and the empty string are accepted so this validator can be composed with
 * `required`. Values use `Array.prototype.includes` equality, including reference equality for
 * objects. A source function is evaluated reactively and may return `undefined` to disable the
 * constraint temporarily. A failure produces
 * `{ kind: 'oneOf', options, actual, message }`, where `options` contains the resolved allowed
 * values and `actual` contains the rejected value.
 *
 * @reactive Tracks signals read by the allowed-values and message sources while they are active.
 *
 * @example
 * ```ts
 * const myForm = form({
 *   status: field<string>('a', [oneOf(['a', 'b', 'c'])]),
 *   role: field('guest', [oneOf(['admin', 'editor'], 'Choose an allowed role')]),
 * });
 *
 * const reactiveForm = form({
 *   status: field('draft', [
 *     oneOf(() => availableStatuses(), { message: 'Choose an available status' }),
 *   ]),
 * });
 * ```
 *
 * @param allowedValues Static allowed values or a reactive function returning them.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export const oneOf = <TValue>(
  allowedValues: readonly TValue[] | (() => readonly TValue[] | undefined),
  options?: string | ({
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    error?: never;
  } | {
    message?: never;
    /** Custom error or errors returned instead of the built-in error. */
    error?: ValidationResult | ((context: ValidatorContext<TValue | null | undefined>) => ValidationResult);
  }) & {
    /** Reactive predicate deciding whether this validator and its constraint metadata are active. */
    when?: (context: ValidatorContext<TValue | null | undefined>) => boolean;
  },
): Validator<TValue | null | undefined> => {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<TValue | null | undefined> = ({ value }) => {
    const currentValue = value();
    if (isNil(currentValue) || currentValue === '') return null;
    const resolvedAllowedValues = typeof allowedValues === 'function' ? allowedValues() : allowedValues;
    if (resolvedAllowedValues === undefined || resolvedAllowedValues.includes(currentValue)) return null;
    return {
      kind: 'oneOf',
      options: resolvedAllowedValues,
      actual: currentValue,
      message: resolveValidatorMessage('oneOf', { options: resolvedAllowedValues, actual: currentValue }, message, defaultOneOfMessage),
    };
  };
  return applyValidatorWhen(validator, options);
};
