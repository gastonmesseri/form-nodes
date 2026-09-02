import { describe, expect, it } from 'vitest';

import { shallowEqual } from './shallow-equal';

describe('shallowEqual', () => {
  it('compares primitives with Object.is', () => {
    expect(shallowEqual('David', 'David')).toBe(true);
    expect(shallowEqual('David', 'Daniel')).toBe(false);
    expect(shallowEqual(Number.NaN, Number.NaN)).toBe(true);
    expect(shallowEqual(null, {})).toBe(false);
    expect(shallowEqual({}, null)).toBe(false);
  });

  it('compares own object and array entries one level deep', () => {
    const address = { country: 'CH' };

    expect(shallowEqual({ address, name: 'David' }, { address, name: 'David' })).toBe(true);
    expect(shallowEqual({ address: { country: 'CH' } }, { address: { country: 'CH' } })).toBe(false);
    expect(shallowEqual(['David', address], ['David', address])).toBe(true);
    expect(shallowEqual([], {})).toBe(false);
    expect(shallowEqual({ name: 'David' }, { name: 'David', age: 42 })).toBe(false);
    expect(shallowEqual({ name: 'David' }, { age: 'David' })).toBe(false);

    const key = Symbol('key');
    expect(shallowEqual({ [key]: 'value' }, { [key]: 'value' })).toBe(true);
    expect(shallowEqual(Object.assign(Object.create(null), { name: 'David' }), { name: 'David' })).toBe(true);
  });

  it('only compares non-plain objects by identity', () => {
    expect(shallowEqual(new Date(0), new Date(0))).toBe(false);
    expect(shallowEqual({}, new Date(0))).toBe(false);
  });
});
