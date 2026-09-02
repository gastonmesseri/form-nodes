import { describe, expect, it } from 'vitest';

import { isPlainObject } from './is-plain-object';

describe('isPlainObject', () => {
  it('accepts object literals and dictionaries without a prototype', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ name: 'Marco' })).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
    expect(isPlainObject(Object.freeze({ name: 'Marco' }))).toBe(true);
  });

  it('uses the prototype independently of an own constructor property', () => {
    expect(isPlainObject({ constructor: Date })).toBe(true);
    expect(isPlainObject(Object.assign(Object.create(null), { constructor: null }))).toBe(true);
  });

  it('rejects class instances, built-in collections, and custom prototypes', () => {
    class Profile {}

    for (const value of [new Profile(), new Date(), [], new Map(), new Set(), /pattern/, Object.create({ inherited: true })]) {
      expect(isPlainObject(value)).toBe(false);
    }
  });
});
