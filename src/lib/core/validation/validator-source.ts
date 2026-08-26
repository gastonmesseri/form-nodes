import type { ComposableValidator, ValidatorSource, Validators } from './validation.type';

export const isValidatorSource = <TValue>(value: unknown): value is ValidatorSource<TValue> =>
  typeof value === 'function' || Array.isArray(value);

export const normalizeValidatorSource = <TValue>(source: ValidatorSource<TValue>): Validators<TValue> =>
  Array.isArray(source) ? source as Validators<TValue> : [source as ComposableValidator<TValue>];
