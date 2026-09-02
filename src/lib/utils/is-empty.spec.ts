import { describe, expect, it } from 'vitest';

import { isEmpty } from './is-empty';

describe('isEmpty', () => {
  it.each([null, undefined, '', false, Number.NaN])('recognizes an empty validation value: %s', (value) => {
    expect(isEmpty(value)).toBe(true);
  });

  it.each([0, -0, 1, Infinity, -Infinity, true, ' ', 'value'])('preserves a non-empty scalar: %s', (value) => {
    expect(isEmpty(value)).toBe(false);
  });

  it('does not treat objects or empty collections as empty validation values', () => {
    for (const value of [{}, [], new Set(), new Map(), { length: 0 }]) {
      expect(isEmpty(value)).toBe(false);
    }
  });
});
