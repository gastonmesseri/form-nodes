import type { ParamMap } from '@angular/router';
import { computed, signal } from '@angular/core';

import type { QueryParamsSync } from './sync-query-params.type';

const snapshot = (source: ParamMap): ParamMap => {
  const values = new Map(source.keys.map(key => [key, [...source.getAll(key)]]));
  return Object.freeze({
    get keys() { return [...values.keys()]; },
    has: (key: string) => values.has(key),
    get: (key: string) => values.get(key)?.[0] ?? null,
    getAll: (key: string) => [...(values.get(key) ?? [])],
  });
};

export const createQueryParamState = <K extends string>(keys: K[], initial: ParamMap) => {
  const activeWrites = new Set<string>();
  const current = signal(snapshot(initial));
  const pending = signal(false);
  const closed = signal(keys.length === 0);
  const params = Object.freeze(Object.fromEntries(keys.map(key => [key, computed(() => current().get(key))]))) as QueryParamsSync<K>['params'];

  return {
    closed,
    accept: (value: ParamMap) => current.set(snapshot(value)),
    setPending(key: string, value: boolean) {
      if (value) activeWrites.add(key);
      else activeWrites.delete(key);
      pending.set(activeWrites.size > 0);
    },
    result(unsubscribe: () => void): QueryParamsSync<K> {
      return Object.freeze({
        params,
        paramMap: current.asReadonly(),
        pending: pending.asReadonly(),
        closed: closed.asReadonly(),
        unsubscribe,
      });
    },
  };
};
