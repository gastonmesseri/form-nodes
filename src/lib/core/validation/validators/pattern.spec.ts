import { describe, expect, it } from 'vitest';

import { pattern } from './pattern';

describe('pattern', () => {
  it('validates regular expression patterns', () => {
    expect(pattern(/^[a-z]+$/)('abc')).toBeNull();
    expect(pattern(/^[a-z]+$/)('123')).toEqual({
      pattern: { pattern: /^[a-z]+$/, actual: '123' },
    });
    expect(pattern(/^[a-z]+$/)('')).toBeNull();
    expect(pattern(/^[a-z]+$/)(null)).toBeNull();
  });
});
