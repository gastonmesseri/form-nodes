import { describe, expect, it } from 'vitest';

import { minLength } from './min-length';

describe('minLength', () => {
  it('validates minimum length or size', () => {
    expect(minLength(3)('ab')).toEqual({
      minLength: { minLength: 3, actualLength: 2 },
    });
    expect(minLength(3)('abc')).toBeNull();
    expect(minLength(1)(new Set())).toEqual({
      minLength: { minLength: 1, actualLength: 0 },
    });
    expect(minLength(3)('')).toBeNull();
  });
});
