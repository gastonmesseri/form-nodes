import { isFieldContext } from '../utils/field-context-marker';
import { defaultIntegerMessage } from '../utils/default-validator-messages';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, BuiltInValidationErrorMap, FieldContext, ValidationResult, Validator, ValidatorContext } from '../validation.type';

const validateInteger = (
  { value }: FieldContext<number | null>,
  message?: string | (() => string | undefined),
): BuiltInValidationErrorMap['integer'] | null => {
  const currentValue = value();
  if (currentValue === null || Number.isSafeInteger(currentValue)) return null;
  return {
    kind: 'integer',
    actual: currentValue,
    message: resolveValidatorMessage('integer', { actual: currentValue }, message, defaultIntegerMessage),
  };
};

/**
 * Creates a safe-integer validator with an optional custom message.
 *
 * `null` passes so this validator can be composed with `required`. It uses
 * `Number.isSafeInteger()`, rejecting decimals, `NaN`, infinities, and integers outside
 * JavaScript's exactly representable safe range. A failure produces
 * `{ kind: 'integer', actual, message }`.
 *
 * ```ts
 * const profile = form({
 *   value: field(1.5, [
 *     integer({
 *       message: 'Check this value.',
 *     }),
 *   ]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * @reactive Tracks signals read by a custom message function while validation is failing.
 * @param options Optional static message string, or an object containing a static or reactive message. Omitting `message`, or returning `undefined`, uses the configured fallback.
 */
export function integer(options: string | ({
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
   *   value: field(1.5, [
   *     integer({
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
   *   value: field(1.5, [
   *     integer({
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
   *   value: field(1.5, [
   *     integer({
   *       error: { kind: 'custom' },
   *     }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * const profile = form({
   *   value: field(1.5, [
   *     integer({
   *       error: () => ({ kind: 'custom' }),
   *     }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * const profile = form({
   *   value: field(1.5, [
   *     integer({
   *       error: [
   *         { kind: 'custom' },
   *       ],
   *     }),
   *   ]),
   * });
   * ```
   */
  error?: ValidationResult | ((context: ValidatorContext<number | null>) => ValidationResult);
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
   *   value: field(1.5, [
   *     integer({ when: () => active() }),
   *   ]),
   * });
   * ```
   */
  when?: NoInfer<DeferredCondition | ((context: ValidatorContext<number | null>) => boolean)>;
}): Validator<number | null>;
/**
 * Validates a safe integer when passed directly in a validators array.
 *
 * `null` passes so this validator can be composed with `required`. A failure produces
 * `{ kind: 'integer', actual, message }` using the configured fallback message.
 *
 * ```ts
 * const profile = form({
 *   value: field(1.5, [integer]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * @param context Reactive field context supplied by the validation pipeline.
 */
export function integer(context: FieldContext<number | null>): ValidationResult;
export function integer(
  contextOrOptions: FieldContext<number | null> | string | {
    message?: string | (() => string | undefined);
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
     *   value: field(1.5, [
     *     integer({ when: () => active() }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<number | null>) => boolean)>;
  },
): Validator<number | null> | ValidationResult {
  if (isFieldContext(contextOrOptions)) return validateInteger(contextOrOptions);
  return applyValidatorWhen(
    context => validateInteger(context, resolveValidatorMessageOption(contextOrOptions)),
    contextOrOptions,
  );
}
