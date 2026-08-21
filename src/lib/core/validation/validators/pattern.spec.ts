import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { pattern } from './pattern';

const context = <TValue>(value: TValue) => ({ value: signal(value).asReadonly() });

describe('pattern', () => {
  it('validates regular expression patterns', () => {
    expect(pattern(/^[a-z]+$/)(context('abc'))).toBeNull();
    expect(pattern(/^[a-z]+$/)(context('123'))).toEqual({
      pattern: { pattern: /^[a-z]+$/, actual: '123' },
    });
    expect(pattern(/^[a-z]+$/)(context(''))).toBeNull();
    expect(pattern(/^[a-z]+$/)(context(null))).toBeNull();
  });
});
