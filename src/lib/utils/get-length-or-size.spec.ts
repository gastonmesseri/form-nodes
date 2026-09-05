import { describe, expect, it } from 'vitest';

import { getLengthOrSize } from './get-length-or-size';

describe('getLengthOrSize', () => {
  it('reads the length of strings, arrays, and array-like objects', () => {
    expect(getLengthOrSize('')).toBe(0);
    expect(getLengthOrSize('hello')).toBe(5);
    expect(getLengthOrSize('🎉')).toBe(2);
    expect(getLengthOrSize([])).toBe(0);
    expect(getLengthOrSize([1, 2, 3])).toBe(3);
    expect(getLengthOrSize({ length: 4 })).toBe(4);
  });

  it('reads the size of sets, maps, and size-bearing objects', () => {
    expect(getLengthOrSize(new Set())).toBe(0);
    expect(getLengthOrSize(new Set(['one', 'two']))).toBe(2);
    expect(getLengthOrSize(new Map([['one', 1]]))).toBe(1);
    expect(getLengthOrSize({ size: 5 })).toBe(5);
  });

  it('prefers a numeric length, including zero, and otherwise uses size', () => {
    const sizedValue = { length: 'ignored', size: 7 };

    expect(getLengthOrSize({ length: 3, size: 7 })).toBe(3);
    expect(getLengthOrSize({ length: 0, size: 7 })).toBe(0);
    expect(getLengthOrSize(sizedValue)).toBe(7);
  });
});
