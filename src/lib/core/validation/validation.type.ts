export type ValidationErrors = Record<string, any>;
export type Validator<TValue> = (value: TValue) => ValidationErrors | null;
export type Validators<TValue> = readonly Validator<TValue>[];
