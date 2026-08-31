import { isEmpty } from '../../utils/is-empty';
import type { Validator, ValidatorContext } from '../validation.type';
import { PATTERN_METADATA } from '../constraint-metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultPatternMessage } from './default-validator-messages';
import { applyValidatorWhen, resolveValidatorMessageOption } from './validator-options';

/**
 * Requires a non-empty string to match a regular expression.
 *
 * `null` and `''` pass so this validator can be composed with `required`. The expression may be
 * static or returned by a reactively tracked function; returning `undefined` disables the
 * constraint temporarily. The expression's `lastIndex` is reset before each validation so global
 * and sticky expressions do not start from stale matching state. A failure produces
 * `{ kind: 'pattern', pattern, actual, message }`.
 *
 * @reactive Tracks signals read by the expression and message sources while they are active.
 *
 * @example
 * ```ts
 * field('', [pattern(/^[a-z]+$/i)]);
 * field('', [pattern(/^[a-z]+$/i, 'Use letters only')]);
 * field('', [pattern(() => configuredPattern(), { message: 'Use letters only' })]);
 * ```
 *
 * @param expression Static regular expression or a reactive function returning it.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export const pattern = (
  expression: RegExp | (() => RegExp | undefined),
  options?: string | {
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    /** Reactive predicate deciding whether this validator and its constraint metadata are active. */
    when?: (context: ValidatorContext<string | null>) => boolean;
  },
): Validator<string | null> => {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<string | null> = markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (isEmpty(currentValue)) return null;
    const resolvedExpression = typeof expression === 'function' ? expression() : expression;
    if (resolvedExpression === undefined) return null;
    resolvedExpression.lastIndex = 0;
    return resolvedExpression.test(currentValue!)
      ? null
      : { kind: 'pattern', pattern: resolvedExpression, actual: currentValue, message: resolveValidatorMessage('pattern', { pattern: resolvedExpression, actual: currentValue! }, message, () => defaultPatternMessage(resolvedExpression)) };
  }, PATTERN_METADATA, expression);
  return applyValidatorWhen(validator, options);
};
