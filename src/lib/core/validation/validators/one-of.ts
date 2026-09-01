import type { Validator } from '../validation.type';
import { defaultValidatorMessages } from './default-validator-messages';
import type { ValidatorOptions } from './validator-options';

/**
 * Requires a non-empty value to equal one of the allowed values.
 *
 * `null`, `undefined`, and the empty string are accepted so this validator can be composed with
 * `required`. Values use `Array.prototype.includes` equality, including reference equality for
 * objects. A source function is evaluated reactively and may return `undefined` to disable the
 * constraint temporarily.
 *
 * @example
 * ```ts
 * const myForm = form({
 *   status: field<string>('a', [oneOf(['a', 'b', 'c'])]);
 * })
 * ```
 *
 * @param allowedValues Static allowed values or a reactive function returning them.
 * @param options Optional custom validation message.
 */
export const oneOf = <TValue>(
  allowedValues: readonly TValue[] | (() => readonly TValue[] | undefined),
  options?: ValidatorOptions,
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
      message: options?.message ?? defaultValidatorMessages.oneOf(),
    };
  };
};
