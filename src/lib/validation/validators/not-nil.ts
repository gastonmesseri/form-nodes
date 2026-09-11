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
 * @example
 * ```ts
 * const checkout = form({
 *   reference: field<string>(null, [notNil]),
 * });
 * ```
 *
 * @reactive Tracks the active condition and custom message signals.
 * @param options Optional message or configuration. Returning undefined from a message uses configured fallbacks.
 */
export function notNil(options: string | ({
  /** Static or reactive message; undefined uses configured fallbacks. */
  message?: string | (() => string | undefined);
  error?: never;
} | {
  message?: never;
  /** Custom error or errors replacing the built-in error. */
  error?: ValidationResult | ((context: ValidatorContext<unknown>) => ValidationResult);
}) & {
  /** Reactive activation condition. Parameterless callbacks have unchecked returns for class self-references; return a boolean. */
  when?: NoInfer<DeferredCondition | ((context: ValidatorContext<unknown>) => boolean)>;
}): Validator<unknown>;
/**
 * Rejects only `null` and `undefined`. Empty strings, `false`, zero, `NaN`, and empty collections pass.
 * Does not contribute required metadata or an HTML required constraint.
 *
 * @example
 * ```ts
 * field(null, [notNil]);
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
