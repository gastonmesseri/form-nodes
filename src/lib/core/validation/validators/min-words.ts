import type { Validator } from '../validation.type';
import type { ConstraintSource } from '../constraint-metadata';
import { countWords } from './count-words';
import { defaultValidatorMessages } from './default-validator-messages';
import type { ValidatorOptions } from './validator-options';

/**
 * Requires a non-empty string to contain at least the configured number of words.
 *
 * A word is a Unicode letter-or-number sequence that may contain internal apostrophes or hyphens.
 * Empty strings and `null` pass so this validator can be composed with `required`. A source
 * function is evaluated reactively and may return `undefined` to disable the constraint.
 *
 * @example
 * ```ts
 * field('', [required, minWords(3)]);
 * ```
 *
 * @param minimum Static minimum word count or a reactive function returning it.
 * @param options Optional custom validation message.
 */
export const minWords = (
  minimum: ConstraintSource<number>,
  options?: ValidatorOptions,
): Validator<string | null> => {
  return ({ value }) => {
    const currentValue = value();
    if (currentValue === null || currentValue === '') return null;
    const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
    if (resolvedMinimum === undefined || Number.isNaN(resolvedMinimum)) return null;
    const actual = countWords(currentValue);
    return actual < resolvedMinimum
      ? { kind: 'minWords', minWords: resolvedMinimum, actual, message: options?.message ?? defaultValidatorMessages.minWords(resolvedMinimum) }
      : null;
  };
};
