import type { Validator } from '../validation.type';

/** Requires a number greater than or equal to a static or reactive minimum. */
export const min = (minimum: number | (() => number | undefined)): Validator<number | null> =>
  ({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue)) return null;
    const resolvedMinimum = typeof minimum === 'function' ? minimum() : minimum;
    if (resolvedMinimum === undefined || Number.isNaN(resolvedMinimum)) return null;
    return currentValue < resolvedMinimum
      ? { kind: 'min', min: resolvedMinimum }
      : null;
  };
