import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { integer } from './integer';
import { field } from '../../primitives/field';

const context = <TValue>(value: TValue) => {
  return { value: signal(value).asReadonly() };
};

describe('integer', () => {
  it('accepts safe integers and null', () => {
    expect(integer({})(context(0))).toBeNull();
    expect(integer({})(context(-42))).toBeNull();
    expect(integer({})(context(Number.MAX_SAFE_INTEGER))).toBeNull();
    expect(integer({})(context(Number.MIN_SAFE_INTEGER))).toBeNull();
    expect(integer({})(context(null))).toBeNull();
  });

  it('rejects decimals, non-finite numbers, and unsafe integers', () => {
    for (const actual of [1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
      expect(integer({})(context(actual))).toEqual({
        kind: 'integer',
        actual,
        message: 'Please enter a safe integer.',
      });
    }
  });

  it('supports direct use and custom messages', () => {
    expect(field(1, [integer]).errors()).toEqual([]);
    expect(integer({ message: 'Enter a whole number' })(context(1.5))).toEqual({
      kind: 'integer',
      actual: 1.5,
      message: 'Enter a whole number',
    });
  });
});
