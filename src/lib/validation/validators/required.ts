import { isEmpty } from '../../utils/is-empty';
import { createMetadataKey } from '../../metadata/metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { isFieldContext } from '../utils/field-context-marker';
import { resolveValidatorMessage } from '../utils/resolve-validator-message';
import { defaultRequiredMessage } from '../utils/default-validator-messages';
import { applyValidatorWhen, resolveValidatorMessageOption } from '../utils/validator-options';
import type { DeferredCondition, FieldContext, ValidationError, ValidationResult, Validator, ValidatorContext } from '../validation.type';

export const REQUIRED_METADATA = createMetadataKey<boolean, boolean>({
  getInitial: () => false,
  reduce: (current, contribution) => current || contribution,
});

const validateRequired = (
  context: FieldContext<unknown>,
  message?: string | (() => string | undefined),
): ValidationError | null => {
  const value = context.value();
  if (value === false || !isEmpty(value)) return null;
  return { kind: 'required', message: resolveValidatorMessage('required', {}, message, defaultRequiredMessage) };
};

/**
 * Creates a required validator with an optional custom message.
 *
 * The validator rejects `null`, `undefined`, `''`, and `NaN`; `false` and `0` are valid. A failure produces
 * `{ kind: 'required', message }`.
 *
 * ℹ️ `required` does not reject empty arrays, sets, maps, or objects. Combine it with
 * `minLength(1)` when an aggregate must contain at least one item.
 *
 * ```ts
 * const profile = form({
 *   value: field('', [
 *     required({
 *       message: 'Check this value.',
 *     }),
 *   ]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * @reactive Tracks signals read by a custom message function while validation is failing.
 * @param options Optional static message string, or an object containing a static or reactive message. Omitting `message`, or returning `undefined`, uses the default.
 */
export function required(options: string | ({
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
   *   value: field('', [
   *     required({
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
   *   value: field('', [
   *     required({
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
   *   value: field('', [
   *     required({
   *       error: { kind: 'custom' },
   *     }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * const profile = form({
   *   value: field('', [
   *     required({
   *       error: () => ({ kind: 'custom' }),
   *     }),
   *   ]),
   * });
   * ```
   *
   * ```ts
   * const profile = form({
   *   value: field('', [
   *     required({
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
   *   value: field('', [
   *     required({ when: () => active() }),
   *   ]),
   * });
   * ```
   */
  when?: NoInfer<DeferredCondition | ((context: ValidatorContext<unknown>) => boolean)>;
}): Validator<unknown>;
/**
 * Validates required presence when passed directly in a validators array.
 *
 * The validator rejects `null`, `undefined`, `''`, and `NaN`; `false` and `0` are valid. A failure produces
 * `{ kind: 'required', message }` using the default message.
 *
 * ℹ️ `required` does not reject empty arrays, sets, maps, or objects. Combine it with
 * `minLength(1)` when an aggregate must contain at least one item.
 *
 * ```ts
 * const profile = form({
 *   value: field('', [required]),
 * });
 * profile.value.invalid(); // true
 * ```
 *
 * @param context Reactive field context supplied by the validation pipeline.
 */
export function required(context: FieldContext<unknown>): ValidationResult;
export function required(
  contextOrOptions: FieldContext<unknown> | string | {
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
     *   value: field('', [
     *     required({ when: () => active() }),
     *   ]),
     * });
     * ```
     */
    when?: NoInfer<DeferredCondition | ((context: ValidatorContext<unknown>) => boolean)>;
  },
): Validator<unknown> | ValidationResult {
  if (isFieldContext(contextOrOptions)) {
    return validateRequired(contextOrOptions);
  }
  return applyValidatorWhen(
    markValidatorMetadata(
      context => validateRequired(context, resolveValidatorMessageOption(contextOrOptions)),
      REQUIRED_METADATA,
      true,
    ),
    contextOrOptions,
  );
}

markValidatorMetadata(required as Validator<unknown>, REQUIRED_METADATA, true);
