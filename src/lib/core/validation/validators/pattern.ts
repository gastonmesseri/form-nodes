import { isEmpty } from '../../utils/is-empty';
import type { Validator } from '../validation.type';
import { markValidatorMetadata } from '../validator-metadata';
import { PATTERN_METADATA, type ConstraintSource } from '../constraint-metadata';
import { defaultValidatorMessages } from './default-validator-messages';
import type { ValidatorOptions } from './validator-options';

/** Requires a non-empty string to match a static or reactive regular expression. */
export const pattern = (
  expression: ConstraintSource<RegExp>,
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
      : { kind: 'pattern', pattern: resolvedExpression, message: options?.message ?? defaultValidatorMessages.pattern(resolvedExpression) };
  }, PATTERN_METADATA, expression);
};
