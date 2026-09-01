import { isEmpty } from '../../utils/is-empty';
import { isFieldContext } from '../../utils/field-context-marker';
import type { FieldContext, ValidationResult, Validator } from '../validation.type';
import { defaultValidatorMessages } from './default-validator-messages';
import type { ValidatorOptions } from './validator-options';

const emailPattern = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const validateEmail = ({ value }: FieldContext<string | null>, message?: string): ValidationResult => {
  const currentValue = value();
  if (isEmpty(currentValue)) return null;
  return emailPattern.test(currentValue!)
    ? null
    : { kind: 'email', message: message ?? defaultValidatorMessages.email() };
};

/** Creates an email validator with custom options. */
export function email(options: ValidatorOptions): Validator<string | null>;
/** Validates a value when the function is passed directly in a validators array. */
export function email(context: FieldContext<string | null>): ValidationResult;
export function email(
  contextOrOptions: FieldContext<string | null> | ValidatorOptions,
): Validator<string | null> | ValidationResult {
  if (isFieldContext(contextOrOptions)) {
    return validateEmail(contextOrOptions);
  }
  return context => validateEmail(context, contextOrOptions.message);
}
