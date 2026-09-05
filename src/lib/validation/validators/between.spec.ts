import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { field } from '../../primitives/field';
import { between } from './between';

describe('between', () => {
  it('accepts inclusive boundaries and reports values outside the range', () => {
    const value = field(17, [between(18, 65)]);

    expect(value.getError('between')).toMatchObject({
      min: 18,
      max: 65,
      actual: 17,
      message: 'Please enter a value between 18 and 65.',
    });
    value.set(18);
    expect(value.errors()).toEqual([]);
    value.set(65);
    expect(value.errors()).toEqual([]);
    value.set(66);
    expect(value.getError('between')?.actual).toBe(66);
  });

  it('passes for null and NaN', () => {
    const value = field<number>(null, [between(1, 10)]);

    expect(value.errors()).toEqual([]);
    value.set(Number.NaN);
    expect(value.errors()).toEqual([]);
  });

  it('tracks both bounds and disables the range when either is absent', () => {
    const minimum = signal<number | undefined>(1);
    const maximum = signal<number | undefined>(10);
    const value = field(5, [between(() => minimum(), () => maximum())]);

    expect(value.errors()).toEqual([]);
    minimum.set(6);
    expect(value.getError('between')).toMatchObject({ min: 6, max: 10, actual: 5 });
    maximum.set(undefined);
    expect(value.errors()).toEqual([]);
    expect(value.min()).toBeNull();
    expect(value.max()).toBeNull();
  });

  it('contributes both native constraint metadata values', () => {
    const value = field(5, [between(1, 10)]);

    expect(value.min()).toBe(1);
    expect(value.max()).toBe(10);
  });
});
