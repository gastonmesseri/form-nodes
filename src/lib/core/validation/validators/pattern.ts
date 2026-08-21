import { isEmpty } from './is-empty';
import type { Validator } from '../validation.type';

/** Requires a non-empty string to match a static or reactive regular expression. */
export const pattern = (
  expression: RegExp | (() => RegExp | undefined),
): Validator<string | null> => (value) => {
  if (isEmpty(value)) return null;
  const resolvedExpression = typeof expression === 'function' ? expression() : expression;
  if (resolvedExpression === undefined) return null;
  resolvedExpression.lastIndex = 0;
  return resolvedExpression.test(value!)
    ? null
    : { pattern: { pattern: resolvedExpression, actual: value } };
};
