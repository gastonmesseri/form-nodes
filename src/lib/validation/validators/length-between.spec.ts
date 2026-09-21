import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { maxLength } from './max-length';
import { minLength } from './min-length';
import { field } from '../../primitives/field';
import { lengthBetween } from './length-between';
import type { ValueWithLengthOrSize } from '../../utils/get-length-or-size';

describe('lengthBetween', () => {
  it.each<ValueWithLengthOrSize | null | undefined>([
    null, undefined, '', 'a', 'abc', 'abcdef', '😀', '   ', [], [1, 2, 3],
    new Set(), new Set([1, 2, 3]), new Map([[1, 'a']]), { length: 3 }, { size: 6 }, { length: 2, size: 99 },
  ])('matches separate length constraints for %j', (initial) => {
    const combined = field<ValueWithLengthOrSize | undefined>(initial, [lengthBetween(2, 4)]);
    const separate = field<ValueWithLengthOrSize>(initial ?? null, [minLength(2), maxLength(4)]);
    expect(combined.errors().map(({ kind, message }) => ({ kind, message })))
      .toEqual(separate.errors().map(({ kind, message }) => ({ kind, message })));
    expect(combined.minLength()).toBe(2);
    expect(combined.maxLength()).toBe(4);
    expect(combined.required()).toBe(false);
  });

  it('preserves both failures for reversed bounds and maxLength empty-text semantics', () => {
    const node = field('abc', [lengthBetween(5, 1)]);
    expect(node.errors()).toMatchObject([
      { kind: 'minLength', minLength: 5, actual: 3 },
      { kind: 'maxLength', maxLength: 1, actual: 3 },
    ]);
    expect(field('', [lengthBetween(0, -1)]).valid()).toBe(true);
    expect(field([], [lengthBetween(0, -1)]).hasError('maxLength')).toBe(true);
    expect(field('a', [lengthBetween(1.5, 2.5)]).hasError('minLength')).toBe(true);
    expect(field('ab', [lengthBetween(2, 2)]).valid()).toBe(true);
    expect(field('', [lengthBetween(0, Infinity)]).valid()).toBe(true);
    const suppressed = field('abc', [lengthBetween(5, 1, { error: [] })]);
    expect(suppressed.valid()).toBe(true);
    expect(suppressed.minLength()).toBe(5);
    expect(suppressed.maxLength()).toBe(1);
  });

  it('disables unavailable bounds independently and combines metadata with other validators', () => {
    const minimum = signal<number | undefined>(5);
    const maximum = signal<number | undefined>(1);
    const node = field('abc', [lengthBetween(minimum, maximum)]);
    expect(node.errors()).toHaveLength(2);
    minimum.set(undefined);
    expect(node.errors()).toMatchObject([{ kind: 'maxLength', actual: 3 }]);
    expect(node.minLength()).toBeNull();
    expect(node.maxLength()).toBe(1);
    maximum.set(undefined);
    expect(node.valid()).toBe(true);
    expect(node.maxLength()).toBeNull();
    minimum.set(5);
    expect(node.errors()).toMatchObject([{ kind: 'minLength', actual: 3 }]);
    minimum.set(NaN);
    maximum.set(NaN);
    expect(node.valid()).toBe(true);
    expect(node.minLength()).toBeNull();
    expect(node.maxLength()).toBeNull();
    node.setValidators([lengthBetween(1, 10), minLength(2), maxLength(5)]);
    expect(node.minLength()).toBe(2);
    expect(node.maxLength()).toBe(5);
  });

  it('uses existing message fallbacks and reactive overrides for either failure', () => {
    const message = signal<string | undefined>('Choose a supported length');
    const node = field('a', [lengthBetween(2, 4, { message })]);
    expect(node.getError('minLength')?.message).toBe(message());
    node.set('abcde');
    expect(node.getError('maxLength')?.message).toBe(message());
    message.set(undefined);
    expect(node.getError('maxLength')?.message).toBe(field('abcde', [maxLength(4)]).getError('maxLength')?.message);
    node.set('a');
    expect(node.getError('minLength')?.message).toBe(field('a', [minLength(2)]).getError('minLength')?.message);
    expect(field('a', [lengthBetween(2, 4, 'Too short')]).getError('minLength')?.message).toBe('Too short');
  });

  it('evaluates a replacement error once for a failure and stops while inactive or valid', () => {
    const active = signal(true);
    const message = signal('Unsupported length');
    const error = vi.fn(() => ({ kind: 'length', message: message() }));
    const node = field.nullable('abc', [lengthBetween(5, 1, { when: active, error })]);
    expect(node.errors()).toMatchObject([{ kind: 'length', message: 'Unsupported length' }]);
    expect(error).toHaveBeenCalledTimes(1);
    message.set('Choose another length');
    expect(node.getError('length')?.message).toBe('Choose another length');
    expect(error).toHaveBeenCalledTimes(2);
    active.set(false);
    expect(node.valid()).toBe(true);
    expect(node.minLength()).toBeNull();
    expect(node.maxLength()).toBeNull();
    message.set('Inactive');
    expect(node.errors()).toEqual([]);
    expect(error).toHaveBeenCalledTimes(2);
    active.set(true);
    node.set(null);
    expect(node.valid()).toBe(true);
    expect(error).toHaveBeenCalledTimes(2);
  });
});
