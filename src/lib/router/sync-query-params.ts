import { Router } from '@angular/router';
import { isFormNode } from '@ngblocks/form-nodes';
import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, ErrorHandler, Injector, PLATFORM_ID, inject, untracked } from '@angular/core';

import { resolveCodec } from './query-param-codec';
import { createQueryParamState } from './query-param-state';
import { getCoordinator, sameValues, type QueryEntry } from './query-param-coordinator';
import type { QueryParamsSync, QueryParamBinding, QueryParamSyncError, SyncQueryParamsOptions } from './sync-query-params.type';

type FieldBridge = {
  _value(): unknown;
  _watchCommittedValue(callback: (value: unknown) => void, options: { injector: Injector; onDestroy: () => void }): () => void;
};

/**
 * Synchronizes a map of query keys with existing fields through Angular Router.
 * Accepts a field directly or an object with field and per-key options. Returns raw
 * URL signals, synchronization state, and an idempotent unsubscribe method.
 * An explicit injector or the current injection context owns the whole connection;
 * entry injectors and node owners may end individual entries.
 * URL values initialize fields without resetting interaction state or redefining initial values.
 * Committed edits are batched across helpers; default history mode is replace.
 *
 * ```ts
 * function connectFilters() {
 *   const filters = form({
 *     search: field(''),
 *     page: field(1),
 *   });
 *   return syncQueryParams({
 *     q: {
 *       field: filters.search,
 *       clearOnDefault: true,
 *     },
 *     page: filters.page,
 *   });
 * }
 * ```
 *
 * Call connectFilters from an Angular injection context that provides Router.
 *
 * @param bindings Query keys mapped to fields or configured field bindings.
 * @param options Shared injector, history policy, and error handler.
 */
export function syncQueryParams<T extends Record<string, unknown> = Record<never, never>>(
  bindings: { [K in keyof T]: QueryParamBinding<T[K]>['field'] | QueryParamBinding<T[K]> },
  options: SyncQueryParamsOptions = {},
): QueryParamsSync<Extract<keyof T, string>> {
  return untracked(() => {
    const injector = options.injector ?? inject(Injector);
    const router = injector.get(Router);
    const report = (error: QueryParamSyncError) => {
      if (options.onError) options.onError(error);
      else injector.get(ErrorHandler).handleError(error);
    };
    // Resolve all configuration before changing any field or reserving URL keys.
    const definitions = Object.entries(bindings).map(([key, input]) => {
      const config = (typeof input === 'function' ? { field: input } : input) as QueryParamBinding<any>;
      if (!config || !isFormNode(config.field) || config.field.$api.nodeType() !== 'field') {
        throw new Error(`Query parameter "${key}" requires a field node.`);
      }
      const bridge = config.field.$api as unknown as FieldBridge;
      const fallback = Object.hasOwn(config, 'defaultValue') ? config.defaultValue : bridge._value();
      const codec = resolveCodec(config.codec, fallback);
      const serialize = (value: unknown): readonly string[] => {
        const result = (value === null || value === undefined) ? null : codec.serialize(value);
        if (result !== null && (!Array.isArray(result) || result.some(item => typeof item !== 'string'))) {
          throw new Error(`The codec for "${key}" must serialize to strings or null.`);
        }
        return result ?? [];
      };
      const defaultValues = serialize(fallback);
      const owner = config.injector ?? injector;
      if (owner.get(Router) !== router) throw new Error('All query parameter owners must use the same Router.');
      return { key, config, bridge, fallback, codec, serialize, defaultValues, owner };
    });
    const initialUrl = router.currentNavigation()?.finalUrl ?? router.parseUrl(router.url);
    const state = createQueryParamState(Object.keys(bindings) as Extract<keyof T, string>[], initialUrl.queryParamMap);
    if (!definitions.length) return state.result(() => {});
    const coordinator = getCoordinator(router, isPlatformBrowser(injector.get(PLATFORM_ID)));
    for (const { key } of definitions) {
      if (coordinator.entries.has(key)) throw new Error(`Query parameter "${key}" already has an active binding.`);
    }
    const entries: QueryEntry[] = [];
    const initialize: (() => void)[] = [];
    let ownerCleanup: (() => void) | undefined;
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      state.closed.set(true);
      for (const entry of entries) entry.stop();
      ownerCleanup?.();
      ownerCleanup = undefined;
      entries.length = 0;
    };
    try {
      ownerCleanup = injector.get(DestroyRef).onDestroy(stop);
      for (const definition of definitions) {
        const { key, config, bridge, codec, fallback, serialize, defaultValues, owner } = definition;
        let previous = bridge._value();
        const cleanup: (() => void)[] = [];
        const entry: QueryEntry = {
          key,
          active: true,
          history: config.history ?? options.history ?? 'replace',
          report,
          accept: state.accept,
          setPending: pending => state.setPending(key, pending),
          read() {
            const values = serialize(bridge._value());
            return config.clearOnDefault && sameValues(values, defaultValues) ? [] : values;
          },
          restore(values) {
            let value = fallback;
            if (values.length) {
              try {
                value = codec.parse(values);
              } catch (cause) {
                report({ key, phase: 'parse', cause });
              }
            }
            previous = value;
            config.field.$api.set(value);
          },
          stop() {
            if (!entry.active) return;
            coordinator.remove(entry);
            for (const dispose of cleanup) dispose();
            if (entries.every(item => !item.active)) stop();
          },
        };
        entries.push(entry);
        coordinator.entries.set(key, entry);
        initialize.push(() => {
          entry.restore(initialUrl.queryParamMap.getAll(key));
          if (!entry.active) return;
          previous = bridge._value();
          cleanup.push(bridge._watchCommittedValue((value) => {
            if (Object.is(value, previous)) return;
            previous = value;
            coordinator.enqueue(entry);
          }, { injector: owner, onDestroy: entry.stop }));
        });
      }
      for (const start of initialize) {
        if (stopped) break;
        start();
      }
    } catch (error) {
      stop();
      throw error;
    }
    return state.result(() => untracked(stop));
  });
}
