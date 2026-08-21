import type { Validator } from '../validation.type';

/** Requires a number less than or equal to a static or reactive maximum. */
export const max = (maximum: number | (() => number | undefined)): Validator<number | null> =>
  ({ value }) => {
    const currentValue = value();
    if (currentValue === null || Number.isNaN(currentValue)) return null;
    const resolvedMaximum = typeof maximum === 'function' ? maximum() : maximum;
    if (resolvedMaximum === undefined || Number.isNaN(resolvedMaximum)) return null;
    return currentValue > resolvedMaximum
      ? { kind: 'max', max: resolvedMaximum }
      : null;
  };
