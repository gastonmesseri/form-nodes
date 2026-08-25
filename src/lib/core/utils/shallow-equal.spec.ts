import { describe, expect, it } from 'vitest';

import { shallowEqual } from './shallow-equal';

describe('shallowEqual', () => {
  it('compares primitives with Object.is', () => {
    expect(shallowEqual('David', 'David')).toBe(true);
    expect(shallowEqual('David', 'Daniel')).toBe(false);
    expect(shallowEqual(Number.NaN, Number.NaN)).toBe(true);
  });

  it('compares own object and array entries one level deep', () => {
    const address = { country: 'CH' };

    expect(shallowEqual({ address, name: 'David' }, { address, name: 'David' })).toBe(true);
    expect(shallowEqual({ address: { country: 'CH' } }, { address: { country: 'CH' } })).toBe(false);
    expect(shallowEqual(['David', address], ['David', address])).toBe(true);
  });

  it('only compares non-plain objects by identity', () => {
    expect(shallowEqual(new Date(0), new Date(0))).toBe(false);
  });
});
