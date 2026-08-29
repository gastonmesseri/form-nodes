import { describe, expect, expectTypeOf, it } from 'vitest';

import { arrayToObject } from './array-to-object';

describe('arrayToObject', () => {
  it('maps array items to object keys and values', () => {
    const people = [
      { id: 'marco' as const, name: 'Marco' },
      { id: 'lia' as const, name: 'Lia' },
    ];

    const result = arrayToObject(people, person => [person.id, person]);

    expect(result).toEqual({ marco: people[0], lia: people[1] });
    expectTypeOf(result).toEqualTypeOf<Record<'marco' | 'lia', typeof people[number]>>();
  });

  it('passes the index and source array to the mapper', () => {
    const values = ['first', 'second'] as const;
    const result = arrayToObject(values, (value, index, source) => [index, `${value}/${source.length}`]);

    expect(result).toEqual({ 0: 'first/2', 1: 'second/2' });
  });

  it('supports symbol keys and lets the last duplicate key win', () => {
    const key = Symbol('key');
    const result = arrayToObject([1, 2], value => [key, value]);

    expect(result[key]).toBe(2);
  });
});
