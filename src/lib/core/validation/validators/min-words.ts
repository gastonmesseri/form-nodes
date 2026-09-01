import { countWords } from './count-words';
import type { Validator } from '../validation.type';
import type { ValidatorOptions } from './validator-options';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultValidatorMessages } from './default-validator-messages';

/**
 * Requires a non-empty string to contain at least the configured number of words.
 *
 * A word is a Unicode letter-or-number sequence that may contain internal apostrophes or hyphens.
 * Empty strings and `null` pass so this validator can be composed with `required`. A source
 * function is evaluated reactively and may return `undefined` to disable the constraint. A
 * failure produces `{ kind: 'minWords', minWords, actual, message }`, where `actual` is the
 * observed word count.
 *
 * @reactive Tracks signals read by the minimum and message sources while they are active.
 *
 * @example
 * ```ts
 * field('', [required, minWords(3)]);
 * field('', [minWords(() => minimumWords(), { message: 'Add more detail' })]);
 * ```
 *
 * @param minimum Static minimum word count or a reactive function returning it.
 * @param options Optional static or reactive custom validation message.
 */
export const minWords = (
  minimum: number | (() => number | undefined),
  options?: ValidatorOptions,
): Validator<string | null> => {
  return ({ value }) => {
    const currentValue = value();
    if (currentValue === null || currentValue === '') return null;
    const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
    if (resolvedMinimum === undefined || Number.isNaN(resolvedMinimum)) return null;
    const actual = countWords(currentValue);
    return actual < resolvedMinimum
      ? { kind: 'minWords', minWords: resolvedMinimum, actual, message: resolveValidatorMessage(options?.message, () => defaultValidatorMessages.minWords(resolvedMinimum)) }
      : null;
  };
};
