import { isNil } from '../../utils/is-nil';
import { isFieldContext } from '../utils/field-context-marker';
import { defaultNotNilMessage } from '../utils/default-validator-messages';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, BuiltInValidationErrorMap, FieldContext, ValidationResult, Validator, ValidatorContext } from '../validation.type';

const validateNotNil = (
  { value }: FieldContext<unknown>,
  message?: string | (() => string | undefined),
): BuiltInValidationErrorMap['notNil'] | null => {
  if (!isNil(value())) return null;
  return { kind: 'notNil', message: resolveValidatorMessage('notNil', {}, message, defaultNotNilMessage) };
};

/**
 * Rejects only `null` and `undefined`. Empty strings, `false`, zero, `NaN`, and empty collections pass.
 * Does not contribute required metadata or an HTML required constraint.
 *
 * Supports direct use, custom messages, custom errors, and a reactive `when` condition.
 *
 * ```ts
 * const profile = form({
 *   value: field(null, [
 *     notNil({ message: 'Check this value.' }),
 *   ]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * @reactive Tracks the active condition and custom message signals.
 * @param options Optional message or configuration. Returning undefined from a message uses configured fallbacks.
 */
export function notNil(options: string | ({
  /**
   * Overrides the message of a failing built-in validation error. A reactive function
   * is evaluated only while the rule fails; returning `undefined` continues through the
   * node, provider, global, and built-in message fallbacks. Cannot be combined with `error`.
   *
   * **Default:** `undefined`; use the configured fallback message.
   *
   * **Accepted values:**
   *
   * - **Strings**: Use the supplied text, including an empty string.
   * - **Functions**: Track signals read while resolving the message.
   *
   * ```ts
   * const profile = form({
   *   value: field(null, [
   *     notNil({ message: 'Check this value.' }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const text = signal('Check this value.');
   * const profile = form({
   *   value: field(null, [
   *     notNil({ message: () => text() }),
   *   ]),
   * });
   * ```
   */
  message?: string | (() => string | undefined);
  error?: never;
} | {
  message?: never;
  /**
   * Replaces the built-in failure with a custom error or error array. A callback
   * receives the current validation context and runs only when the built-in rule fails.
   * A callback may return nullish/empty results to suppress the failure. A static nullish
   * value preserves the built-in result. Cannot be combined with `message`.
   *
   * **Default:** `undefined`; retain the built-in error.
   *
   * See {@link ValidationResult} for supported error shapes.
   *
   * ```ts
   * const profile = form({
   *   value: field(null, [
   *     notNil({
   *       error: { kind: 'custom' },
   *     }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * const profile = form({
   *   value: field(null, [
   *     notNil({
   *       error: () => ({ kind: 'custom' }),
   *     }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * const profile = form({
   *   value: field(null, [
   *     notNil({
   *       error: [
   *         { kind: 'custom' },
   *       ],
   *     }),
   *   ]),
   * });
   * ```
   */
  error?: ValidationResult | ((context: ValidatorContext<unknown>) => ValidationResult);
}) & {
  /**
   * Enables the validator and its constraint metadata only while the condition is true.
   * Signal reads are tracked. A false result skips the rule, message, and error callbacks.
   * Parameterless callbacks support class self-references with unchecked returns; return
   * a boolean. Context-taking callbacks retain boolean checking.
   *
   * **Return Type:** `boolean` for the condition callback.
   *
   * **Default:** `undefined`; the validator remains active.
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const active = signal(true);
   * const profile = form({
   *   value: field(null, [
   *     notNil({ when: () => active() }),
   *   ]),
   * });
   * ```
   */
  when?: NoInfer<DeferredCondition | ((context: ValidatorContext<unknown>) => boolean)>;
}): Validator<unknown>;
/**
 * Rejects only `null` and `undefined`. Empty strings, `false`, zero, `NaN`, and empty collections pass.
 * Does not contribute required metadata or an HTML required constraint.
 *
 * ```ts
 * const profile = form({
 *   value: field(null, [notNil]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * @param context Reactive context supplied by the validation pipeline.
 */
export function notNil(context: FieldContext<unknown>): ValidationResult;
export function notNil(
  contextOrOptions: FieldContext<unknown> | string | {
    message?: string | (() => string | undefined);
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<unknown>) => boolean)>;
  },
): Validator<unknown> | ValidationResult {
  if (isFieldContext(contextOrOptions)) return validateNotNil(contextOrOptions);
  return applyValidatorWhen(
    context => validateNotNil(context, resolveValidatorMessageOption(contextOrOptions)),
    contextOrOptions,
  );
}
