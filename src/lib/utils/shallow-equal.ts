import { isPlainObject } from './is-plain-object';

export const shallowEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') return false;
  if (!Array.isArray(left) && !isPlainObject(left)) return false;
  if (!Array.isArray(right) && !isPlainObject(right)) return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const leftKeys = Reflect.ownKeys(left);
  const rightKeys = Reflect.ownKeys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => {
    return Object.prototype.hasOwnProperty.call(right, key)
      && Object.is(Reflect.get(left, key), Reflect.get(right, key));
  });
};
