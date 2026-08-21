import { isEmpty } from './is-empty';
import { isFieldContext } from '../../utils/field-context-marker';
import type { FieldContext, ValidationErrors, Validator } from '../validation.type';

export type RequiredOptions = {
  readonly message: string;
};

const validateRequired = (
  context: FieldContext<unknown>,
  message?: string,
): ValidationErrors | null => {
  if (!isEmpty(context.value())) return null;
  return message === undefined ? { required: true } : { required: { message } };
};

/** Creates a required validator with custom options. */
export function required(options: RequiredOptions): Validator<unknown>;
/** Validates a value when the function is passed directly in a validators array. */
export function required(context: FieldContext<unknown>): ValidationErrors | null;
export function required(
  contextOrOptions: FieldContext<unknown> | RequiredOptions,
): Validator<unknown> | ValidationErrors | null {
  if (isFieldContext(contextOrOptions)) {
    return validateRequired(contextOrOptions);
  }
  return (context) => validateRequired(context, contextOrOptions.message);
}
