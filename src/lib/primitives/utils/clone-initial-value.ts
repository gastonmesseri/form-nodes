import { isPlainObject } from '../../utils/is-plain-object';

/** Copies supported data containers without invoking accessors or cloning opaque instances. */
export const cloneInitialValue = <TValue>(value: TValue): TValue => {
  const copies = new Map<object, unknown>();
  const copy = (source: unknown): unknown => {
    if (source === null || typeof source !== 'object') return source;
    if (copies.has(source)) return copies.get(source);
    const prototype = Object.getPrototypeOf(source);
    let target: object;
    if (source instanceof Date && prototype === Date.prototype) target = new Date(source.getTime());
    else if (source instanceof Map && prototype === Map.prototype) target = new Map();
    else if (source instanceof Set && prototype === Set.prototype) target = new Set();
    else if (Array.isArray(source) && prototype === Array.prototype) target = [];
    else if (isPlainObject(source)) target = Object.create(prototype);
    else return source;
    copies.set(source, target);
    if (source instanceof Map) source.forEach((entry, key) => (target as Map<unknown, unknown>).set(copy(key), copy(entry)));
    else if (source instanceof Set) source.forEach(entry => (target as Set<unknown>).add(copy(entry)));
    for (const key of Reflect.ownKeys(source)) {
      const descriptor = Object.getOwnPropertyDescriptor(source, key)!;
      if ('value' in descriptor) descriptor.value = copy(descriptor.value);
      Object.defineProperty(target, key, descriptor);
    }
    return target;
  };
  return copy(value) as TValue;
};
