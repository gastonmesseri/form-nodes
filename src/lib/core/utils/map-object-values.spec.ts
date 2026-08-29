import { describe, expect, expectTypeOf, it } from 'vitest';

import { mapObjectValues } from './map-object-values';

describe('mapObjectValues', () => {
  it('maps values while preserving the original keys', () => {
    const source = { name: 'Marco', age: 42 };
    const result = mapObjectValues(source, (value, key) => `${key}:${value}`);

    expect(result).toEqual({ name: 'name:Marco', age: 'age:42' });
    expectTypeOf(result).toEqualTypeOf<{ name: string; age: string }>();
  });

  it('maps only own enumerable string-keyed properties', () => {
    const inherited = { inherited: 1 };
    const source = Object.assign(Object.create(inherited) as { own: number; inherited?: number }, { own: 2 });
    const result = mapObjectValues(source, value => value);

    expect(result).toEqual({ own: 2 });
    expect(result).not.toHaveProperty('inherited');
  });
});
