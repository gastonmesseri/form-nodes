import type { ParamMap } from '@angular/router';
import { computed, signal } from '@angular/core';

import type { QueryParamsSync } from './sync-query-params.type';

export const createQueryParamState = <K extends string>(keys: K[], initial: ParamMap) => {
  const snapshot = (source: ParamMap) => new Map(keys.map(key => [key, source.get(key)]));
  const activeWrites = new Set<string>();
  const current = signal(snapshot(initial));
  const pending = signal(false);
  const closed = signal(keys.length === 0);
  const params = Object.freeze(Object.fromEntries(keys.map(key => [key, computed(() => current().get(key) ?? null)]))) as QueryParamsSync<K>['params'];

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
        pending: pending.asReadonly(),
        closed: closed.asReadonly(),
        unsubscribe,
      });
    },
  };
};
