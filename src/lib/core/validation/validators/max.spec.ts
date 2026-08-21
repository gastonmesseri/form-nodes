import { describe, expect, it } from 'vitest';

import { max } from './max';

describe('max', () => {
  it('validates maximum numbers', () => {
    expect(max(3)(4)).toEqual({ max: { max: 3, actual: 4 } });
    expect(max(3)(3)).toBeNull();
    expect(max(3)(Number.NaN)).toBeNull();
  });
});
