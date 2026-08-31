import type { Validator, ValidatorContext } from '../validation.type';
import { resolveValidatorMessage } from './resolve-validator-message';
import { defaultEqualToMessage } from './default-validator-messages';
import { applyValidatorWhen, resolveValidatorMessageOption } from './validator-options';

/**
 * Requires a value to equal a static or reactive expected value using `Object.is()`.
 *
 * Unlike optional format and constraint validators, `null` and `undefined` are compared as real
 * values. This makes equality explicit for nullable fields. Signals read by the expected-value
 * source or custom message are tracked reactively. The error deliberately omits both values so
 * confirmation fields do not expose sensitive data such as passwords. A failure produces
 * `{ kind: 'equalTo', message }`.
 *
 * @reactive Tracks signals read by the expected-value and message sources while they are active.
 *
 * @example
 * ```ts
 * const password = field('');
 * const credentials = form({
 *   password,
 *   confirmPassword: field('', [
 *     equalTo(() => password(), { message: 'Passwords must match' }),
 *   ]),
 * });
 *
 * field(true, [equalTo(true, 'You must accept the terms')]);
 * ```
 *
 * @param expected Static expected value or a reactive function returning it.
 * @param options Optional static message string, or an object containing a static or reactive message.
 */
export const equalTo = <TValue>(
  expected: TValue | (() => TValue),
  options?: string | {
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    /** Reactive predicate deciding whether this validator and its constraint metadata are active. */
    when?: (context: ValidatorContext<TValue | null | undefined>) => boolean;
  },
): Validator<TValue | null | undefined> => {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<TValue | null | undefined> = ({ value }) => {
    const expectedValue = typeof expected === 'function' ? (expected as () => TValue)() : expected;
    return Object.is(value(), expectedValue)
      ? null
      : { kind: 'equalTo', message: resolveValidatorMessage('equalTo', {}, message, defaultEqualToMessage) };
  };
  return applyValidatorWhen(validator, options);
};
