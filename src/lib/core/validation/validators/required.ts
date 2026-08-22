import { isEmpty } from '../../utils/is-empty';
import { createMetadataKey } from '../../metadata/metadata';
import { markValidatorMetadata } from '../validator-metadata';
import { isFieldContext } from '../../utils/field-context-marker';
import type { FieldContext, ValidationError, ValidationResult, Validator } from '../validation.type';

export const REQUIRED_METADATA = createMetadataKey<boolean, boolean>({
  getInitial: () => false,
  reduce: (current, contribution) => current || contribution,
});

export type RequiredOptions = {
  readonly message: string;
};

const validateRequired = (
  context: FieldContext<unknown>,
  message?: string,
): ValidationError | null => {
  if (!isEmpty(context.value())) return null;
  return message === undefined ? { kind: 'required' } : { kind: 'required', message };
};

/** Creates a required validator with custom options. */
export function required(options: RequiredOptions): Validator<unknown>;
/** Validates a value when the function is passed directly in a validators array. */
export function required(context: FieldContext<unknown>): ValidationResult;
export function required(
  contextOrOptions: FieldContext<unknown> | RequiredOptions,
): Validator<unknown> | ValidationResult {
  if (isFieldContext(contextOrOptions)) {
    return validateRequired(contextOrOptions);
  }
  return markValidatorMetadata(
    (context) => validateRequired(context, contextOrOptions.message),
    REQUIRED_METADATA,
    true,
  );
}

markValidatorMetadata(required as Validator<unknown>, REQUIRED_METADATA, true);
