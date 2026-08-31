import { isEmpty } from '../../utils/is-empty';
import type { Validator } from '../validation.type';
import { markValidatorMetadata } from '../validator-metadata';
import { PATTERN_METADATA, type ConstraintSource } from '../constraint-metadata';

/** Requires a non-empty string to match a static or reactive regular expression. */
export const pattern = (
  expression: ConstraintSource<RegExp>,
): Validator<string | null> => markValidatorMetadata(({ value }) => {
  const currentValue = value();
  if (isEmpty(currentValue)) return null;
  const resolvedExpression = typeof expression === 'function' ? expression() : expression;
  if (resolvedExpression === undefined) return null;
  resolvedExpression.lastIndex = 0;
  return resolvedExpression.test(currentValue!)
    ? null
    : { kind: 'pattern', pattern: resolvedExpression };
}, PATTERN_METADATA, expression);
