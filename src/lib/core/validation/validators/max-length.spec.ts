import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { maxLength } from './max-length';

const context = <TValue>(value: TValue) => ({ value: signal(value).asReadonly() });

describe('maxLength', () => {
  it('validates maximum length or size', () => {
    expect(maxLength(2)(context('abc'))).toEqual({
      kind: 'maxLength',
      maxLength: 2,
      message: 'Please provide no more than 2 characters or items.',
    });
    expect(maxLength(2, { message: 'Too long' })(context('abc'))).toMatchObject({ message: 'Too long' });
    expect(maxLength(3)(context('abc'))).toBeNull();
    expect(maxLength(3)(context(null))).toBeNull();
    expect(maxLength(() => undefined)(context('abc'))).toBeNull();
    expect(maxLength(1)(context(new Set(['first', 'second'])))).toMatchObject({ kind: 'maxLength', maxLength: 1 });
  });
});
