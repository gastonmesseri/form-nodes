import type { Validator } from '../validation.type';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultOneOfMessage } from './default-validator-messages';

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
 * @param options Optional static or reactive custom validation message.
 */
export const oneOf = <TValue>(
  allowedValues: readonly TValue[] | (() => readonly TValue[] | undefined),
  options?: {
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
  },
): Validator<TValue | null | undefined> => {
  return ({ value }) => {
    const currentValue = value();
    if (currentValue === null || currentValue === undefined || currentValue === '') return null;
    const resolvedAllowedValues = typeof allowedValues === 'function' ? allowedValues() : allowedValues;
    if (resolvedAllowedValues === undefined || resolvedAllowedValues.includes(currentValue)) return null;
    return {
      kind: 'oneOf',
      options: resolvedAllowedValues,
      actual: currentValue,
      message: resolveValidatorMessage('oneOf', { options: resolvedAllowedValues, actual: currentValue }, options?.message, defaultOneOfMessage),
    };
  };
};
