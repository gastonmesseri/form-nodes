const ISO_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const parseDateConstraint = (value: Date | string, parseAs: 'utc' | 'local'): Date => {
  if (value instanceof Date) return value;

  const match = ISO_CALENDAR_DATE.exec(value);
  if (match === null) return new Date(Number.NaN);

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(0);

  if (parseAs === 'utc') {
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month, day);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day
      ? date
      : new Date(Number.NaN);
  }

  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date
    : new Date(Number.NaN);
};
