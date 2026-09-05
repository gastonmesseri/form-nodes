import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { minLength } from './min-length';

const context = <TValue>(value: TValue) => ({ value: signal(value).asReadonly() });

describe('minLength', () => {
  it('validates minimum length or size', () => {
    expect(minLength(3)(context('ab'))).toEqual({
      kind: 'minLength',
      minLength: 3,
      actual: 2,
      message: 'Please provide at least 3 characters or items.',
    });
    expect(minLength(3, { message: 'Too short' })(context('ab'))).toMatchObject({ message: 'Too short' });
    expect(minLength(3)(context('abc'))).toBeNull();
    expect(minLength(1)(context(new Set()))).toMatchObject({ kind: 'minLength', minLength: 1 });
    expect(minLength(3)(context(''))).toBeNull();
    expect(minLength(() => undefined)(context('ab'))).toBeNull();
  });
});
