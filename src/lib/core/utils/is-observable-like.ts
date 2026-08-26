import type { ObservableLike } from '../types/observable-like.type';

export const isObservableLike = <TValue>(value: unknown): value is ObservableLike<TValue> =>
  typeof value === 'object' && value !== null && typeof (value as ObservableLike<TValue>).subscribe === 'function';
