import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { deepEqual } from './deep-equal';

describe('deepEqual', () => {
  it.each<{ left: unknown; right: unknown; equal: boolean }>([
    { left: NaN, right: NaN, equal: true },
    { left: 0, right: -0, equal: true },
    { left: null, right: {}, equal: false },
    { left: undefined, right: null, equal: false },
    { left: 1, right: '1', equal: false },
    { left: 1, right: Object(1), equal: true },
    { left: false, right: Object(false), equal: true },
    { left: 'a', right: Object('a'), equal: true },
    { left: Symbol.for('a'), right: Object(Symbol.for('a')), equal: true },
    { left: Symbol('a'), right: Symbol('a'), equal: false },
    { left: Object(1n), right: Object(1n), equal: false },
    { left: new Date(12), right: new Date(12), equal: true },
    { left: new Date(NaN), right: new Date(NaN), equal: true },
    { left: new Date(12), right: new Date(13), equal: false },
    { left: /a/gi, right: /a/gi, equal: true },
    { left: /a/g, right: /a/i, equal: false },
    { left: new Error('a'), right: new Error('a'), equal: true },
    { left: new Error('a'), right: new Error('b'), equal: false },
    { left: new TypeError('a'), right: new Error('a'), equal: false },
    { left: [], right: {}, equal: false },
    { left: [1, 2], right: [2, 1], equal: false },
    { left: [1], right: [1, 2], equal: false },
    { left: Array(1), right: [undefined], equal: true },
    { left: Object.assign([1], { extra: 1 }), right: [1], equal: true },
    { left: { a: { b: 1 } }, right: { a: { b: 1 } }, equal: true },
    { left: { a: 1 }, right: { b: 1 }, equal: false },
    { left: { a: 1 }, right: { a: 1, b: 2 }, equal: false },
    { left: Object.create({ inherited: 1 }), right: {}, equal: true },
    { left: Object.create(null), right: {}, equal: true },
    { left: Object.defineProperty({}, 'hidden', { value: 1 }), right: {}, equal: true },
    { left: { [Symbol.for('a')]: 1 }, right: { [Symbol.for('a')]: 1 }, equal: true },
    { left: { [Symbol('a')]: 1 }, right: { [Symbol('a')]: 1 }, equal: false },
    { left: { constructor: 1 }, right: { constructor: 1 }, equal: true },
    { left: new Set([1, 2]), right: new Set([2, 1]), equal: true },
    { left: new Set([1]), right: new Set([1, 2]), equal: false },
    { left: new Set([{ a: 1 }, { a: 1 }]), right: new Set([{ a: 1 }, { a: 2 }]), equal: false },
    { left: new Set([[1, 2]]), right: new Set([[2, 1]]), equal: true },
    { left: new Map([[{ id: 1 }, { a: 2 }]]), right: new Map([[{ id: 1 }, { a: 2 }]]), equal: true },
    { left: new Map([['a', 'b']]), right: new Map([['b', 'a']]), equal: true },
    { left: new Uint8Array([1, 2]), right: new Uint8Array([1, 2]), equal: true },
    { left: new Float64Array([NaN]), right: new Float64Array([NaN]), equal: true },
    { left: new Uint8Array([1]), right: new Uint16Array([1]), equal: false },
    { left: new Uint8Array([1]).buffer, right: new Uint8Array([2]).buffer, equal: false },
    { left: new ArrayBuffer(2), right: new ArrayBuffer(2), equal: true },
    { left: new DataView(new ArrayBuffer(2)), right: new DataView(new ArrayBuffer(2)), equal: true },
    { left: new DataView(new ArrayBuffer(3), 1), right: new DataView(new ArrayBuffer(2)), equal: false },
    { left: new DataView(new ArrayBuffer(3)), right: new DataView(new ArrayBuffer(2)), equal: false },
    { left: Buffer.from([1]), right: Buffer.from([1]), equal: true },
    { left: Buffer.from([1]), right: new Uint8Array([1]), equal: false },
    { left: Promise.resolve(1), right: Promise.resolve(1), equal: false },
    { left: () => 1, right: () => 1, equal: false },
    { left: new WeakMap(), right: new WeakMap(), equal: false },
  ])('compares $left and $right as $equal', ({ left, right, equal }) => {
    expect(deepEqual(left, right)).toBe(equal);
  });

  it('compares class instances by constructor and enumerable properties', () => {
    class Person { name = 'Marco'; }
    class OtherPerson { name = 'Marco'; }
    expect(deepEqual(new Person(), new Person())).toBe(true);
    expect(deepEqual(new Person(), new OtherPerson())).toBe(false);
    expect(deepEqual(new Person(), { name: 'Marco' })).toBe(false);
  });

  it('handles circular objects, arrays, maps, and sets without requiring shared references', () => {
    const left: any = { name: 'Marco' };
    const right: any = { name: 'Marco' };
    left.self = left;
    right.self = right;
    expect(deepEqual(left, right)).toBe(true);
    expect(deepEqual(left, { name: 'Marco', self: {} })).toBe(false);
    const leftArray: unknown[] = [];
    const rightArray: unknown[] = [];
    leftArray.push(leftArray);
    rightArray.push(rightArray);
    expect(deepEqual(leftArray, rightArray)).toBe(true);
    const leftMap = new Map();
    const rightMap = new Map();
    leftMap.set('self', leftMap);
    rightMap.set('self', rightMap);
    expect(deepEqual(leftMap, rightMap)).toBe(true);
    const leftSet = new Set();
    const rightSet = new Set();
    leftSet.add(leftSet);
    rightSet.add(rightSet);
    expect(deepEqual(leftSet, rightSet)).toBe(true);
    const shared = { id: 1 };
    expect(deepEqual({ a: shared, b: shared }, { a: { id: 1 }, b: { id: 1 } })).toBe(true);
  });

  it('compares independent copies of generated JSON values', () => {
    fc.assert(fc.property(fc.jsonValue(), (value) => {
      expect(deepEqual(value, JSON.parse(JSON.stringify(value)))).toBe(true);
    }), { numRuns: 300 });
  });
});
