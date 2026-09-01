/** Common options supported by built-in validators. */
export type ValidatorOptions = {
  /**
   * Human-readable message returned with the validation error.
   *
   * A function is evaluated reactively while the validator is failing. Signals read by it trigger
   * revalidation and update the exposed error. Returning `undefined` continues through the form,
   * provider, global, and built-in fallback messages.
   */
  message?: string | (() => string | undefined);
};
