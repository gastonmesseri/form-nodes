declare const metadataKeyType: unique symbol;

export type MetadataReducer<TWrite, TAccumulator> = {
  getInitial(): TAccumulator;
  reduce(accumulator: TAccumulator, value: TWrite): TAccumulator;
};

export type MetadataKey<TWrite, TAccumulator = TWrite | undefined> = {
  readonly [metadataKeyType]: {
    readonly write: TWrite;
    readonly accumulator: TAccumulator;
  };
};

type UntypedMetadataKey = MetadataKey<unknown, unknown>;
const metadataReducers = new WeakMap<object, MetadataReducer<unknown, unknown>>();

export type MetadataContributions = ReadonlyMap<UntypedMetadataKey, readonly unknown[]>;

export function createMetadataKey<TWrite>(): MetadataKey<TWrite>;
export function createMetadataKey<TWrite, TAccumulator>(reducer: MetadataReducer<TWrite, TAccumulator>): MetadataKey<TWrite, TAccumulator>;
export function createMetadataKey<TWrite, TAccumulator>(
  reducer?: MetadataReducer<TWrite, TAccumulator>,
): MetadataKey<TWrite, TAccumulator | TWrite | undefined> {
  const key = {} as MetadataKey<TWrite, TAccumulator | TWrite | undefined>;
  metadataReducers.set(key, (reducer ?? {
    getInitial: () => undefined,
    reduce: (_accumulator, value) => value,
  }) as MetadataReducer<unknown, unknown>);
  return key;
}

export const appendMetadataContributions = (
  target: Map<UntypedMetadataKey, unknown[]>,
  source: MetadataContributions,
): void => source.forEach((values, key) => {
  const existing = target.get(key) ?? [];
  existing.push(...values);
  target.set(key, existing);
});

export const readMetadata = <TWrite, TAccumulator>(
  contributions: MetadataContributions,
  key: MetadataKey<TWrite, TAccumulator>,
): TAccumulator => {
  const values = (contributions.get(key as UntypedMetadataKey) ?? []) as readonly TWrite[];
  const reducer = metadataReducers.get(key) as MetadataReducer<TWrite, TAccumulator>;
  return values.reduce<TAccumulator>(reducer.reduce, reducer.getInitial());
};
