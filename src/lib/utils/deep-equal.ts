const sameValue = (left: unknown, right: unknown): boolean => {
  return left === right || (Number.isNaN(left) && Number.isNaN(right));
};

const enumerableKeys = (value: object): PropertyKey[] => {
  return Reflect.ownKeys(value).filter(key => Object.prototype.propertyIsEnumerable.call(value, key));
};

/**
 * Compares values structurally using lodash.isEqual-style value semantics, without a dependency.
 * Own enumerable object properties include symbols; arrays compare indexed elements. Collection
 * comparisons are unordered, including nested arrays, as in lodash. Ancestor pairs detect cycles
 * without requiring otherwise equivalent values to share the same reference graph.
 */
export const deepEqual = (left: unknown, right: unknown): boolean => {
  const ancestors = new Map<object, object>();

  const compareSequence = (a: ArrayLike<unknown>, b: ArrayLike<unknown>, unordered: boolean): boolean => {
    if (a.length !== b.length) return false;
    const used = new Set<number>();
    for (let index = 0; index < a.length; index++) {
      if (!unordered) {
        if (!compare(a[index], b[index], false)) return false;
        continue;
      }
      let match = -1;
      for (let candidate = 0; candidate < b.length; candidate++) {
        if (!used.has(candidate) && compare(a[index], b[candidate], true)) {
          match = candidate;
          break;
        }
      }
      if (match === -1) return false;
      used.add(match);
    }
    return true;
  };

  const compareObjects = (a: Record<PropertyKey, any>, b: Record<PropertyKey, any>, unordered: boolean): boolean => {
    const keys = enumerableKeys(a);
    if (keys.length !== enumerableKeys(b).length) return false;
    if (!keys.every(key => Object.prototype.hasOwnProperty.call(b, key) && compare(a[key], b[key], unordered))) return false;
    if (keys.includes('constructor') || !('constructor' in a) || !('constructor' in b)) return true;
    const leftConstructor = a.constructor;
    const rightConstructor = b.constructor;
    return leftConstructor === rightConstructor
      || (typeof leftConstructor === 'function' && leftConstructor instanceof leftConstructor
        && typeof rightConstructor === 'function' && rightConstructor instanceof rightConstructor);
  };

  const compare = (a: any, b: any, unordered = false): boolean => {
    if (sameValue(a, b)) return true;
    if (a === null || a === undefined || b === null || b === undefined) return false;
    const leftTag = Object.prototype.toString.call(a).replace('[object Arguments]', '[object Object]');
    const rightTag = Object.prototype.toString.call(b).replace('[object Arguments]', '[object Object]');
    if (leftTag !== rightTag) return false;

    switch (leftTag) {
      case '[object Boolean]':
      case '[object Number]':
      case '[object Date]':
        return sameValue(Number(a), Number(b));
      case '[object String]':
      case '[object RegExp]':
        return String(a) === String(b);
      case '[object Symbol]':
        return Symbol.prototype.valueOf.call(a) === Symbol.prototype.valueOf.call(b);
      case '[object Error]':
        return a.name === b.name && a.message === b.message;
      case '[object DataView]':
        return a.byteOffset === b.byteOffset && a.byteLength === b.byteLength && compare(a.buffer, b.buffer);
      case '[object ArrayBuffer]':
        return compareSequence(new Uint8Array(a), new Uint8Array(b), false);
    }

    const sequence = Array.isArray(a) || ArrayBuffer.isView(a);
    const collection = leftTag === '[object Map]' || leftTag === '[object Set]';
    if (!sequence && !collection && leftTag !== '[object Object]') return false;
    const buffer = (globalThis as { Buffer?: { isBuffer(value: unknown): boolean } }).Buffer;
    if (buffer?.isBuffer(a) && !buffer.isBuffer(b)) return false;
    if (ancestors.has(a) || ancestors.has(b)) return ancestors.get(a) === b && ancestors.get(b) === a;
    ancestors.set(a, b);
    ancestors.set(b, a);
    try {
      if (sequence) return compareSequence(a as unknown as ArrayLike<unknown>, b, unordered);
      if (collection) {
        if (a.size !== b.size) return false;
        return compareSequence(Array.from(a), Array.from(b), true);
      }
      return compareObjects(a, b, unordered);
    } finally {
      ancestors.delete(a);
      ancestors.delete(b);
    }
  };

  return compare(left, right);
};
