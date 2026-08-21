import { describe, expect, it } from 'vitest';

import { maxLength } from './max-length';

describe('maxLength', () => {
  it('validates maximum length or size', () => {
    expect(maxLength(2)('abc')).toEqual({
      maxLength: { maxLength: 2, actualLength: 3 },
    });
    expect(maxLength(3)('abc')).toBeNull();
    expect(maxLength(3)(null)).toBeNull();
  });
});
