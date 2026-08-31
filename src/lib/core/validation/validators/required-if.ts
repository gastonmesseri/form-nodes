import { required, REQUIRED_METADATA } from './required';
import type { Validator } from '../validation.type';
import { markValidatorMetadata } from '../validator-metadata';

/**
 * Requires a value only while a reactive condition is true.
 *
 * It uses the same empty-value and message behavior as `required()`. Signals read by `condition`
 * are tracked, and the node's `required()` metadata follows the active condition.
 *
 * @example Require a company name only for business accounts.
 * ```ts
 * const businessAccount = signal(false);
 *
 * const companyName = field('', [
 *   requiredIf(() => businessAccount()),
 * ]);
 * ```
 *
 * @reactive Tracks signals read by `condition` and by a custom message function while active.
 * @param condition Reactive function deciding whether required validation is active.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export const requiredIf = (
  condition: () => boolean,
  options?: string | { message?: string | (() => string | undefined) },
): Validator<unknown> => {
  const requiredValidator = options === undefined
    ? required as Validator<unknown>
    : required(options);

  return markValidatorMetadata(
    context => (condition() ? requiredValidator(context) : null),
    REQUIRED_METADATA,
    condition,
  );
};
