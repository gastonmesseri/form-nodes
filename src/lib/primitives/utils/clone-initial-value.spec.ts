import { describe, expect, it } from 'vitest';

import { cloneInitialValue } from './clone-initial-value';

describe('initial value snapshots', () => {
  it('preserves collection cycles and custom data properties', () => {
    const map = new Map<unknown, unknown>();
    const set = new Set<unknown>();
    map.set(map, set);
    set.add(map);
    Object.defineProperty(map, 'metadata', { value: { label: 'original' }, enumerable: false });
    const copied = cloneInitialValue(map);
    expect(copied).not.toBe(map);
    expect(copied.get(copied)).toEqual(new Set([copied]));
    const metadata = Object.getOwnPropertyDescriptor(copied, 'metadata')!;
    expect(metadata.enumerable).toBe(false);
    expect(metadata.value).toEqual({ label: 'original' });
    expect(metadata.value).not.toBe(Object.getOwnPropertyDescriptor(map, 'metadata')!.value);
  });

  it('preserves sparse arrays, data descriptors and own __proto__ properties safely', () => {
    const array = new Array(3);
    array[2] = { id: 1 };
    Object.defineProperty(array, '__proto__', { value: { safe: true }, enumerable: true });
    const copy = cloneInitialValue(array);
    expect(copy.length).toBe(3);
    expect(0 in copy).toBe(false);
    expect(copy[2]).toEqual({ id: 1 });
    expect(copy[2]).not.toBe(array[2]);
    expect(Object.getPrototypeOf(copy)).toBe(Array.prototype);
    expect(Object.getOwnPropertyDescriptor(copy, '__proto__')!.value).toEqual({ safe: true });
  });

  it('retains subclasses, functions, and typed buffers as opaque references', () => {
    class CustomDate extends Date {}
    class CustomMap extends Map {}
    class CustomSet extends Set {}
    class CustomArray extends Array {}
    const functionValue = () => 'value';
    const values = [new CustomDate(), new CustomMap(), new CustomSet(), new CustomArray(), new Uint8Array([1]), functionValue];
    const copied = cloneInitialValue(values);
    values.forEach((value, index) => expect(copied[index]).toBe(value));
  });
});
