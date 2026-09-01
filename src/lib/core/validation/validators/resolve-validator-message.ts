import type { BuiltInValidationErrorMap } from '../validation.type';
import { resolveConfiguredValidatorMessage, type ValidatorMessageParameters } from '../validator-messages';

export const resolveValidatorMessage = <TKind extends keyof BuiltInValidationErrorMap>(
  kind: TKind,
  parameters: ValidatorMessageParameters<TKind>,
  message: string | (() => string | undefined) | undefined,
  getDefaultMessage: () => string,
): string => {
  const resolvedMessage = typeof message === 'function' ? message() : message;
  return resolvedMessage
    ?? resolveConfiguredValidatorMessage(kind, parameters)
    ?? getDefaultMessage();
};
