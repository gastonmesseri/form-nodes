import { computed, type ValueEqualityFn } from '@angular/core';

export type ComputedFunctionOptions<TArgs extends readonly unknown[], TResult> = {
  /** Determines whether two argument lists address the same cached computation. */
  readonly argsEqual?: (left: TArgs, right: TArgs) => boolean;
  /** Suppresses downstream propagation when recomputation produces an equal result. */
  readonly equal?: ValueEqualityFn<TResult>;
  /** Maximum cached argument combinations. Values below one disable caching. */
  readonly max?: number;
};

type ComputedFunctionEntry<TArgs extends readonly unknown[], TResult> = {
  readonly args: TArgs;
  readonly signal: () => TResult;
  lastUsed: number;
};

const defaultArgsEqual = <TArgs extends readonly unknown[]>(left: TArgs, right: TArgs): boolean =>
  left.length === right.length && left.every((value, index) => Object.is(value, right[index]));

/** Creates one memoized computed signal for each distinct argument combination. */
export const computedFunction = <TArgs extends readonly unknown[], TResult>(
  computation: (...args: TArgs) => TResult,
  options?: ComputedFunctionOptions<TArgs, TResult>,
): ((...args: TArgs) => TResult) => {
  const entries: ComputedFunctionEntry<TArgs, TResult>[] = [];
  const argsEqual = options?.argsEqual ?? defaultArgsEqual;
  const maximumEntries = options?.max === undefined ? Number.POSITIVE_INFINITY : Math.floor(options.max);
  let usage = 0;

  return (...args: TArgs): TResult => {
    if (maximumEntries < 1) return computation(...args);

    let entry = entries.find(candidate => argsEqual(candidate.args, args));
    if (entry === undefined) {
      if (entries.length >= maximumEntries) {
        let leastRecentlyUsedIndex = 0;
        for (let index = 1; index < entries.length; index++) {
          if (entries[index]!.lastUsed < entries[leastRecentlyUsedIndex]!.lastUsed) {
            leastRecentlyUsedIndex = index;
          }
        }
        entries.splice(leastRecentlyUsedIndex, 1);
      }
      const cachedArgs = [...args] as unknown as TArgs;
      entry = {
        args: cachedArgs,
        signal: options?.equal === undefined
          ? computed(() => computation(...cachedArgs))
          : computed(() => computation(...cachedArgs), { equal: options.equal }),
        lastUsed: 0,
      };
      entries.push(entry);
    }
    entry.lastUsed = ++usage;
    return entry.signal();
  };
};
