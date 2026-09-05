/**
 * Transforms an array into an object by mapping every item to a property key and value.
 *
 * Duplicate keys follow `Object.fromEntries()` semantics: the last mapped value wins.
 */
export const arrayToObject = <TItem, TKey extends PropertyKey, TValue>(
  items: readonly TItem[],
  mapper: (item: TItem, index: number, items: readonly TItem[]) => readonly [TKey, TValue],
): Record<TKey, TValue> => {
  return Object.fromEntries(items.map(mapper)) as Record<TKey, TValue>;
};
