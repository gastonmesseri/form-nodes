import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { pattern } from './pattern';

const context = <TValue>(value: TValue) => ({ value: signal(value).asReadonly() });

describe('pattern', () => {
  it('validates regular expression patterns', () => {
    expect(pattern(/^[a-z]+$/)(context('abc'))).toBeNull();
    expect(pattern(/^[a-z]+$/)(context('123'))).toEqual({
      kind: 'pattern',
      pattern: /^[a-z]+$/,
      message: 'Please enter a value that matches /^[a-z]+$/.',
    });
    expect(pattern(/^[a-z]+$/, { message: 'Letters only' })(context('123'))).toMatchObject({ message: 'Letters only' });
    expect(pattern(/^[a-z]+$/)(context(''))).toBeNull();
    expect(pattern(/^[a-z]+$/)(context(null))).toBeNull();
    expect(pattern(() => undefined)(context('abc'))).toBeNull();

    const globalExpression = /a/g;
    globalExpression.lastIndex = 1;
    expect(pattern(globalExpression)(context('a'))).toBeNull();
    expect(globalExpression.lastIndex).toBe(1);
  });
});
