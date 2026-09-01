import { isEmpty } from '../../utils/is-empty';
import type { Validator } from '../validation.type';
import { markValidatorMetadata } from '../validator-metadata';
import { PATTERN_METADATA } from '../constraint-metadata';
import { defaultValidatorMessages } from './default-validator-messages';
import type { ValidatorOptions } from './validator-options';

/**
 * Requires a non-empty string to match a regular expression.
 *
 * `null` and `''` pass so this validator can be composed with `required`. The expression may be
 * static or returned by a reactively tracked function; returning `undefined` disables the
 * constraint temporarily. The expression's `lastIndex` is reset before each validation so global
 * and sticky expressions do not start from stale matching state. A failure produces
 * `{ kind: 'pattern', pattern, actual, message }`.
 *
 * @reactive Tracks signals read by the expression source and revalidates when they change.
 *
 * @example
 * ```ts
 * field('', [pattern(/^[a-z]+$/i)]);
 * field('', [pattern(() => configuredPattern(), { message: 'Use letters only' })]);
 * ```
 *
 * @param expression Static regular expression or a reactive function returning it.
 * @param options Optional custom validation message.
 */
export const pattern = (
  expression: RegExp | (() => RegExp | undefined),
  options?: ValidatorOptions,
): Validator<string | null> => {
  return markValidatorMetadata(({ value }) => {
    const currentValue = value();
    if (isEmpty(currentValue)) return null;
    const resolvedExpression = typeof expression === 'function' ? expression() : expression;
    if (resolvedExpression === undefined) return null;
    resolvedExpression.lastIndex = 0;
    return resolvedExpression.test(currentValue!)
      ? null
      : { kind: 'pattern', pattern: resolvedExpression, actual: currentValue, message: options?.message ?? defaultValidatorMessages.pattern(resolvedExpression) };
  }, PATTERN_METADATA, expression);
};
