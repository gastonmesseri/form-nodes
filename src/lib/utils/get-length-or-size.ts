export type ValueWithLengthOrSize = { readonly length: number } | { readonly size: number };

export const getLengthOrSize = (value: ValueWithLengthOrSize): number => {
  const resolvedValue = value as { readonly length?: number; readonly size: number };
  return typeof resolvedValue.length === 'number' ? resolvedValue.length : resolvedValue.size;
};
