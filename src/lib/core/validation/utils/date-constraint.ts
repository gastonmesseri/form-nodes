const ISO_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type DateShortcut = 'today';
export type DateString = DateShortcut | (string & {});
export type DateConstraintSource = Date | DateString | (() => Date | DateString | undefined);

const isDateShortcut = (value: string): value is DateShortcut => {
  return value === 'today';
};

const resolveDateShortcut = (parseAs: 'utc' | 'local'): Date => {
  const now = new Date();
  const date = new Date(0);

  if (parseAs === 'utc') {
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return date;
  }

  date.setHours(0, 0, 0, 0);
  date.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
  return date;
};

export const parseDateConstraint = (value: Date | string, parseAs: 'utc' | 'local'): Date => {
  if (value instanceof Date) return value;
  if (isDateShortcut(value)) return resolveDateShortcut(parseAs);

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

export const normalizeDateConstraintSource = (
  source: DateConstraintSource,
  parseAs: 'utc' | 'local',
): Date | (() => Date | undefined) => {
  if (typeof source === 'function') {
    return () => {
      const value = source();
      return value === undefined ? undefined : parseDateConstraint(value, parseAs);
    };
  }
  return typeof source === 'string' && isDateShortcut(source)
    ? () => parseDateConstraint(source, parseAs)
    : parseDateConstraint(source, parseAs);
};
