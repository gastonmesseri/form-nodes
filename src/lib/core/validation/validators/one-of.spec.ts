import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { field } from '../../primitives/field';
import { oneOf } from './one-of';

describe('oneOf', () => {
  it('accepts allowed and empty values and reports rejected values', () => {
    const status = field<'draft' | 'published' | 'archived' | null>('archived', [
      oneOf(['draft', 'published']),
    ]);

    expect(status.errors()).toMatchObject([{
      kind: 'oneOf',
      options: ['draft', 'published'],
      actual: 'archived',
      message: 'Please enter one of the allowed values.',
    }]);

    status.set('draft');
    expect(status.errors()).toEqual([]);
    status.set(null);
    expect(status.errors()).toEqual([]);
  });

  it('supports custom messages and reactive allowed values', () => {
    const allowedValues = signal<readonly number[] | undefined>([1, 2]);
    const value = field(3, [oneOf(allowedValues, { message: 'Choose an available number' })]);

    expect(value.errors()).toMatchObject([{
      kind: 'oneOf',
      options: [1, 2],
      actual: 3,
      message: 'Choose an available number',
    }]);

    allowedValues.set([1, 2, 3]);
    expect(value.errors()).toEqual([]);
    allowedValues.set(undefined);
    expect(value.errors()).toEqual([]);
  });

  it('uses includes equality for special and reference values', () => {
    const allowedObject = { id: 1 };

    expect(field(Number.NaN, [oneOf([Number.NaN])]).errors()).toEqual([]);
    expect(field(allowedObject, [oneOf([allowedObject])]).errors()).toEqual([]);
    expect(field({ id: 1 }, [oneOf([allowedObject])]).errors()).toMatchObject([{ kind: 'oneOf' }]);
  });
});
