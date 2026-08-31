import { createMetadataKey } from '../metadata/metadata';

export type ConstraintSource<TValue> = TValue | (() => TValue | undefined);

const resolveConstraint = <TValue>(source: ConstraintSource<TValue>): TValue | undefined =>
  typeof source === 'function' ? (source as () => TValue | undefined)() : source;

const isInvalidLimit = (value: number | Date): boolean =>
  Number.isNaN(value instanceof Date ? value.getTime() : value);

const createMinimumMetadata = <TValue extends number | Date>() =>
  createMetadataKey<ConstraintSource<TValue>, TValue | undefined>({
    getInitial: () => undefined,
    reduce: (current, source) => {
      const next = resolveConstraint(source);
      if (next === undefined || isInvalidLimit(next)) return current;
      return current === undefined || next > current ? next : current;
    },
  });

const createMaximumMetadata = <TValue extends number | Date>() =>
  createMetadataKey<ConstraintSource<TValue>, TValue | undefined>({
    getInitial: () => undefined,
    reduce: (current, source) => {
      const next = resolveConstraint(source);
      if (next === undefined || isInvalidLimit(next)) return current;
      return current === undefined || next < current ? next : current;
    },
  });

export const MIN_METADATA = createMinimumMetadata<number>();
export const MAX_METADATA = createMaximumMetadata<number>();
export const MIN_DATE_METADATA = createMinimumMetadata<Date>();
export const MAX_DATE_METADATA = createMaximumMetadata<Date>();
export const MIN_LENGTH_METADATA = createMinimumMetadata<number>();
export const MAX_LENGTH_METADATA = createMaximumMetadata<number>();
export const PATTERN_METADATA = createMetadataKey<ConstraintSource<RegExp>, readonly RegExp[]>({
  getInitial: () => [],
  reduce: (current, source) => {
    const next = resolveConstraint(source);
    return next === undefined || current.includes(next) ? current : [...current, next];
  },
});
