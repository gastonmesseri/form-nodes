import { REQUIRED_METADATA } from './required';
import { markValidatorMetadata } from '../validator-metadata';
import { isFieldContext } from '../utils/field-context-marker';
import { REQUIRED_TRUE_METADATA } from '../constraint-metadata';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { defaultRequiredTrueMessage } from '../utils/default-validator-messages';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, BuiltInValidationErrorMap, FieldContext, ValidationResult, Validator, ValidatorContext } from '../validation.type';

const validateRequiredTrue = (
  { value }: FieldContext<unknown>,
  message?: string | (() => string | undefined),
): BuiltInValidationErrorMap['requiredTrue'] | null => {
  if (value() === true) return null;
  return { kind: 'requiredTrue', message: resolveValidatorMessage('requiredTrue', {}, message, defaultRequiredTrueMessage) };
};

const markRequiredTrue = (validator: Validator<unknown>) => {
  markValidatorMetadata(validator, REQUIRED_METADATA, true);
  return markValidatorMetadata(validator, REQUIRED_TRUE_METADATA, true);
};

/**
 * Requires exactly `true`. All other values, including `false`, `null`, and `undefined`, fail.
 *
 * Supports direct use, custom messages, custom errors, and a reactive `when` condition.
 *
 * ```ts
 * const profile = form({
 *   value: field(false, [
 *     requiredTrue({
 *       message: 'Check this value.',
 *     }),
 *   ]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * @reactive Tracks the active condition and custom message signals.
 * @param options Optional message or configuration. Returning undefined from a message uses configured fallbacks.
 */
export function requiredTrue(options: string | ({
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
   *   value: field(false, [
   *     requiredTrue({
   *       message: 'Check this value.',
   *     }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const text = signal('Check this value.');
   * const profile = form({
   *   value: field(false, [
   *     requiredTrue({
   *       message: () => text(),
   *     }),
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
   *   value: field(false, [
   *     requiredTrue({
   *       error: { kind: 'custom' },
   *     }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * const profile = form({
   *   value: field(false, [
   *     requiredTrue({
   *       error: () => ({ kind: 'custom' }),
   *     }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * const profile = form({
   *   value: field(false, [
   *     requiredTrue({
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
   * **Default:** `undefined`; the validator remains active.
   *
   * ```ts
   * import { signal } from '@angular/core';
   *
   * const active = signal(true);
   * const profile = form({
   *   value: field(false, [
   *     requiredTrue({ when: () => active() }),
   *   ]),
   * });
   * ```
   */
  when?: NoInfer<DeferredCondition | ((context: ValidatorContext<unknown>) => boolean)>;
}): Validator<unknown>;
/**
 * Requires exactly `true`. All other values, including `false`, `null`, and `undefined`, fail.
 *
 * ```ts
 * const profile = form({
 *   value: field(false, [requiredTrue]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * @param context Reactive context supplied by the validation pipeline.
 */
export function requiredTrue(context: FieldContext<unknown>): ValidationResult;
export function requiredTrue(
  contextOrOptions: FieldContext<unknown> | string | {
    message?: string | (() => string | undefined);
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<unknown>) => boolean)>;
  },
): Validator<unknown> | ValidationResult {
  if (isFieldContext(contextOrOptions)) return validateRequiredTrue(contextOrOptions);
  return applyValidatorWhen(
    markRequiredTrue(context => validateRequiredTrue(context, resolveValidatorMessageOption(contextOrOptions))),
    contextOrOptions,
  );
}

markRequiredTrue(requiredTrue as Validator<unknown>);
