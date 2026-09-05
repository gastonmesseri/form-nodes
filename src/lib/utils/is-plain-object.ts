export const isPlainObject = (value: object): value is Record<PropertyKey, unknown> => {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};
