/** Returns whether a value is either `null` or `undefined`. */
export const isNil = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

/** Returns whether a value is neither `null` nor `undefined`. */
export const isNotNil = <TValue>(value: TValue | null | undefined): value is TValue => {
  return !isNil(value);
};
