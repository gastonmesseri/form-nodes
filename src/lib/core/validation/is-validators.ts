import type { Validators } from './validation.type';

export const isValidators = <TValue>(value: unknown): value is Validators<TValue> =>
  Array.isArray(value);
