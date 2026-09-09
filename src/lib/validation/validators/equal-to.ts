import { defaultEqualToMessage } from '../utils/default-validator-messages';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, ValidationResult, Validator, ValidatorContext } from '../validation.type';

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
export function equalTo<TValue = never>(
  expected: NoInfer<TValue> | (() => NoInfer<TValue>),
  options?: string | ({
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    error?: never;
  } | {
    message?: never;
    /** Custom error or errors returned instead of the built-in error. */
    error?: ValidationResult | ((context: ValidatorContext<TValue | null | undefined>) => ValidationResult);
  }) & {
    /** Reactive predicate deciding whether this validator and its constraint metadata are active. Parameterless conditions have unchecked returns for class self-references; return a boolean. Context-taking conditions retain boolean checking. */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<TValue | null | undefined>) => boolean)>;
  },
): Validator<TValue | null | undefined>;
/** Infers the constraint value type when no consuming node provides a context. */
export function equalTo<TValue>(
  expected: TValue | (() => TValue),
  options?: string | ({
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    error?: never;
  } | {
    message?: never;
    /** Custom error or errors returned instead of the built-in error. */
    error?: ValidationResult | ((context: ValidatorContext<TValue | null | undefined>) => ValidationResult);
  }) & {
    /** Reactive predicate deciding whether this validator and its constraint metadata are active. Parameterless conditions have unchecked returns for class self-references; return a boolean. Context-taking conditions retain boolean checking. */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<TValue | null | undefined>) => boolean)>;
  },
): Validator<TValue | null | undefined>;
export function equalTo<TValue>(
  expected: TValue | (() => TValue),
  options?: string | ({
    /** Static or reactive custom message. Returning `undefined` continues through the configured fallbacks. */
    message?: string | (() => string | undefined);
    error?: never;
  } | {
    message?: never;
    /** Custom error or errors returned instead of the built-in error. */
    error?: ValidationResult | ((context: ValidatorContext<TValue | null | undefined>) => ValidationResult);
  }) & {
    /** Reactive predicate deciding whether this validator and its constraint metadata are active. Parameterless conditions have unchecked returns for class self-references; return a boolean. Context-taking conditions retain boolean checking. */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<TValue | null | undefined>) => boolean)>;
  },
): Validator<TValue | null | undefined> {
  const message = resolveValidatorMessageOption(options);
  const validator: Validator<TValue | null | undefined> = ({ value }) => {
    const expectedValue = typeof expected === 'function' ? (expected as () => TValue)() : expected;
    return Object.is(value(), expectedValue)
      ? null
      : { kind: 'equalTo', message: resolveValidatorMessage('equalTo', {}, message, defaultEqualToMessage) };
  };
  return applyValidatorWhen(validator, options);
}
