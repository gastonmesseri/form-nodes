import { describe, expect, expectTypeOf, it } from 'vitest';

import { isNil } from './is-nil';

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
});
