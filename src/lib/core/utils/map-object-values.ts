import { arrayToObject } from './array-to-object';

/** Maps an object's own enumerable string-keyed values while preserving its keys. */
export const mapObjectValues = <TObject extends object, TValue>(
  object: TObject,
  mapper: (value: TObject[keyof TObject], key: Extract<keyof TObject, string>) => TValue,
): { [TKey in keyof TObject]: TValue } => {
  const keys = Object.keys(object) as Extract<keyof TObject, string>[];
  return arrayToObject(keys, key => [key, mapper(object[key], key)]) as { [TKey in keyof TObject]: TValue };
};
