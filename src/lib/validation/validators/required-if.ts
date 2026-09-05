import { required } from './required';
import type { ValidationResult, Validator, ValidatorContext } from '../validation.type';

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
  options?: string | {
    message?: string | (() => string | undefined);
    /** Custom error or errors returned instead of the built-in error. */
    error?: ValidationResult | ((context: ValidatorContext<unknown>) => ValidationResult);
  },
): Validator<unknown> => {
  if (typeof options === 'object' && options.error !== undefined) {
    return required({ error: options.error, when: () => condition() });
  }
  const message = typeof options === 'string' ? options : options?.message;
  return required(message === undefined
    ? { when: () => condition() }
    : { message, when: () => condition() });
};
