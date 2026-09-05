import { describe, expect, it } from 'vitest';

import { isObservableLike } from './is-observable-like';

describe('isObservableLike', () => {
  it('accepts an object with a subscribe method', () => {
    expect(isObservableLike({ subscribe: () => ({ unsubscribe: () => undefined }) })).toBe(true);
  });

  it('rejects values without a subscribe method', () => {
    expect(isObservableLike(null)).toBe(false);
    expect(isObservableLike({})).toBe(false);
    expect(isObservableLike({ subscribe: true })).toBe(false);
  });
});
