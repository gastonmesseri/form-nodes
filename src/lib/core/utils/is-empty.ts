export const isEmpty = (value: unknown): boolean => {
  if (typeof value === 'number') return Number.isNaN(value);
  return value === '' || value === false || value === null || value === undefined;
};
