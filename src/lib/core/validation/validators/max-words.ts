import type { Validator } from '../validation.type';
import type { ConstraintSource } from '../constraint-metadata';
import { countWords } from './count-words';
import { defaultValidatorMessages } from './default-validator-messages';
import type { ValidatorOptions } from './validator-options';

/**
 * Requires a non-empty string to contain no more than the configured number of words.
 *
 * A word is a Unicode letter-or-number sequence that may contain internal apostrophes or hyphens.
 * Empty strings and `null` pass so this validator can be composed with `required`. A source
 * function is evaluated reactively and may return `undefined` to disable the constraint.
 *
 * @example
 * ```ts
 * field('', [maxWords(100)]);
 * ```
 *
 * @param maximum Static maximum word count or a reactive function returning it.
 * @param options Optional custom validation message.
 */
export const maxWords = (
  maximum: ConstraintSource<number>,
  options?: ValidatorOptions,
): Validator<string | null> => {
  return ({ value }) => {
    const currentValue = value();
    if (currentValue === null || currentValue === '') return null;
    const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
    if (resolvedMaximum === undefined || Number.isNaN(resolvedMaximum)) return null;
    const actual = countWords(currentValue);
    return actual > resolvedMaximum
      ? { kind: 'maxWords', maxWords: resolvedMaximum, actual, message: options?.message ?? defaultValidatorMessages.maxWords(resolvedMaximum) }
      : null;
  };
};
