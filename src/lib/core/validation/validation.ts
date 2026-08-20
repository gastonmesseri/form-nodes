export type ValidationErrors = Record<string, any>;
export type Validator<TValue> = (value: TValue) => ValidationErrors | null;
export type Validators<TValue> = readonly Validator<TValue>[];

export const runValidators = <TValue>(
  value: TValue,
  validators: Validators<TValue>,
): ValidationErrors | null => {
  const errors: ValidationErrors = {};
  validators.forEach((validator) => Object.assign(errors, validator(value) ?? {}));
  return Object.keys(errors).length ? errors : null;
};
