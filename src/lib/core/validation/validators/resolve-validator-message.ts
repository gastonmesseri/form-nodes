export const resolveValidatorMessage = (
  message: string | (() => string | undefined) | undefined,
  getDefaultMessage: () => string,
): string => {
  const resolvedMessage = typeof message === 'function' ? message() : message;
  return resolvedMessage ?? getDefaultMessage();
};
