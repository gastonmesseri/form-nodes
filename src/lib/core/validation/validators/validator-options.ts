/** Common options supported by built-in validators. */
export type ValidatorOptions = {
  /**
   * Human-readable message returned with the validation error.
   *
   * A function is evaluated reactively while the validator is failing. Signals read by it trigger
   * revalidation and update the exposed error. Returning `undefined` uses the built-in default.
   */
  readonly message?: string | (() => string | undefined);
};
