import { countWords } from '../../utils/count-words';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { defaultMaxWordsMessage } from '../utils/default-validator-messages';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext } from '../validation.type';

/**
 * Requires a non-empty string to contain no more than the configured number of words.
 *
 * A word is a Unicode letter-or-number sequence that may contain internal apostrophes or hyphens.
 * Empty strings and `null` pass so this validator can be composed with `required`. A source
 * function is evaluated reactively and may return `undefined` to disable the constraint. A
 * failure produces `{ kind: 'maxWords', maxWords, actual, message }`, where `actual` is the
 * observed word count.
 *
 * @reactive Tracks signals read by the maximum and message sources while they are active.
 *
 * @example
 * ```ts
 * field('', [maxWords(100)]);
 * field('', [maxWords(100, 'Keep it concise')]);
 * field('', [maxWords(() => maximumWords(), { message: 'Keep it concise' })]);
 * ```
 *
 * @param maximum Static maximum word count or a reactive function returning it.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export const maxWords = (
  maximum: number | (() => number | undefined),
  options?: string | ({
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    error?: never;
  } | {
    message?: never;
    /** Custom error or errors returned instead of the built-in error. */
    error?: ValidationResult | ((context: ValidatorContext<string | null>) => ValidationResult);
  }) & {
    /** Reactive predicate deciding whether this validator and its constraint metadata are active. Parameterless conditions have unchecked returns for class self-references; return a boolean. Context-taking conditions retain boolean checking. */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<string | null>) => boolean)>;
  },
): Validator<string | null> => {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<string | null> = ({ value }) => {
    const currentValue = value();
    if (currentValue === null || currentValue === '') return null;
    const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
    if (resolvedMaximum === undefined || Number.isNaN(resolvedMaximum)) return null;
    const actual = countWords(currentValue);
    return actual > resolvedMaximum
      ? { kind: 'maxWords', maxWords: resolvedMaximum, actual, message: resolveValidatorMessage('maxWords', { maxWords: resolvedMaximum, actual }, message, () => defaultMaxWordsMessage(resolvedMaximum)) }
      : null;
  };
  return applyValidatorWhen(validator, options);
};
