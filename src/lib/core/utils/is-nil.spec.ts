import { describe, expect, expectTypeOf, it } from 'vitest';

import { isNil, isNotNil } from './is-nil';

describe('isNil', () => {
  it('recognizes nullish values', () => {
    expect(isNil(null)).toBe(true);
    expect(isNil(undefined)).toBe(true);
    expect(isNil(false)).toBe(false);
    expect(isNil(0)).toBe(false);
    expect(isNil('')).toBe(false);
  });

  it('narrows null and undefined', () => {
    const value = null as string | null | undefined;
    if (!isNil(value)) expectTypeOf(value).toEqualTypeOf<string>();
  });

  it('recognizes and narrows non-nullish values', () => {
    expect(isNotNil(null)).toBe(false);
    expect(isNotNil(undefined)).toBe(false);
    expect(isNotNil(false)).toBe(true);
    expect(isNotNil(0)).toBe(true);
    expect(isNotNil('')).toBe(true);

    const values = ['one', null, 'two', undefined].filter(isNotNil);
    expect(values).toEqual(['one', 'two']);
    expectTypeOf(values).toEqualTypeOf<string[]>();
  });
});
