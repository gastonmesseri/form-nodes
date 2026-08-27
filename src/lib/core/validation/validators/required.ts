import { isEmpty } from '../../utils/is-empty';
import { createMetadataKey } from '../../metadata/metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { isFieldContext } from '../../utils/field-context-marker';
import type { FieldContext, ValidationError, ValidationResult, Validator } from '../validation.type';
import { defaultValidatorMessages } from './default-validator-messages';
import type { ValidatorOptions } from './validator-options';

export const REQUIRED_METADATA = createMetadataKey<boolean, boolean>({
  getInitial: () => false,
  reduce: (current, contribution) => current || contribution,
});

export type RequiredOptions = ValidatorOptions;

const validateRequired = (
  context: FieldContext<unknown>,
  message?: string,
): ValidationError | null => {
  if (!isEmpty(context.value())) return null;
  return { kind: 'required', message: message ?? defaultValidatorMessages.required() };
};

/**
 * Creates a required validator with an optional custom message.
 *
 * The validator rejects `null`, `undefined`, `''`, `false`, and `NaN`. Empty arrays, sets, maps,
 * and objects are considered present; combine `required` with `minLength(1)` when an aggregate
 * must contain an item. A failure produces `{ kind: 'required', message }`.
 *
 * @example
 * ```ts
 * field('', [required({ message: 'Enter your name' })]);
 * ```
 *
 * @param options Optional custom validation message. Omitting `message` uses the default.
 */
export function required(options: RequiredOptions): Validator<unknown>;
/**
 * Validates required presence when passed directly in a validators array.
 *
 * The validator rejects `null`, `undefined`, `''`, `false`, and `NaN`. Empty arrays, sets, maps,
 * and objects are considered present. A failure produces `{ kind: 'required', message }` using
 * the default message.
 *
 * @example
 * ```ts
 * field('', [required]);
 * ```
 *
 * @param context Reactive field context supplied by the validation pipeline.
 */
export function required(context: FieldContext<unknown>): ValidationResult;
export function required(
  contextOrOptions: FieldContext<unknown> | RequiredOptions,
): Validator<unknown> | ValidationResult {
  if (isFieldContext(contextOrOptions)) {
    return validateRequired(contextOrOptions);
  }
  return markValidatorMetadata(
    context => validateRequired(context, contextOrOptions.message),
    REQUIRED_METADATA,
    true,
  );
}

markValidatorMetadata(required as Validator<unknown>, REQUIRED_METADATA, true);
