import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, ErrorHandler, Injector, PLATFORM_ID, inject, untracked, type Signal } from '@angular/core';

import { createQueryParamState } from './query-param-state';
import { resolveSerializer } from './query-param-serializer';
import { createQueryParamSource } from './query-param-source';
import { createQueryParamNotification } from './query-param-notification';
import { getCoordinator, sameValues, type QueryEntry } from './query-param-coordinator';
import type { QueryParamsSync, QueryParamBinding, QueryParamSyncError, SyncQueryParamsOptions } from './sync-query-params.type';

/**
 * Synchronizes query keys with form nodes and writable signals through Angular Router.
 * Accepts a source directly or an object with source and per-key options. Returns raw
 * URL signals, synchronization state, and an idempotent unsubscribe method.
 * An explicit injector or the current injection context owns the whole connection;
 * entry injectors and node owners may end individual entries.
 * URL values initialize nodes through set without resetting interaction state or initial values.
 * Forms, groups, and arrays retain their normal set semantics and need explicit serializers.
 * Signals use set and their own equality; readonly signals are not supported.
 * Committed edits are batched across helpers; default history mode is replace.
 *
 * ```ts
 * import { Component } from '@angular/core';
 *
 * @Component({
 *   imports: [FormNodeDirective],
 *   template: `
 *     <input [formNode]="form.search" />
 *     <p>{{ querySync.params.q() }}</p>
 *   `,
 * })
 * export class SearchPage {
 *   form = form({
 *     search: field(''),
 *     page: field(1),
 *   });
 *
 *   querySync = syncQueryParams({
 *     q: {
 *       source: this.form.search,
 *       clearOnDefault: true,
 *     },
 *     page: this.form.page,
 *   });
 * }
 * ```
 *
 * ```ts
 * import { signal } from '@angular/core';
 * import { Component } from '@angular/core';
 *
 * @Component({
 *   template: `
 *     <p>{{ querySync.params.page() }}</p>
 *   `,
 * })
 * export class StatePage {
 *   form = form({
 *     search: field(''),
 *   });
 *
 *   page = signal<number | null>(null);
 *
 *   querySync = syncQueryParams({
 *     state: {
 *       source: this.form,
 *       serializer: 'json',
 *     },
 *     page: {
 *       source: this.page,
 *       serializer: 'integer',
 *     },
 *   });
 * }
 * ```
 *
 * Configure Router in the application providers. Component field initializers run
 * in an injection context, and component destruction cleans up the connection.
 *
 * @param bindings Query keys mapped to nodes, writable signals, or configured source bindings.
 * @param options Shared injector, history policy, URL synchronization hooks, and error handler.
 */
export function syncQueryParams<T extends Record<string, Signal<any>> = Record<never, never>>(
  bindings: { [K in keyof T]: (T[K] & QueryParamBinding<ReturnType<T[K]>>['source']) | (QueryParamBinding<ReturnType<T[K]>> & { source: T[K] }) },
  options: SyncQueryParamsOptions<NoInfer<{ [K in keyof T]: ReturnType<T[K]> }>> = {},
): QueryParamsSync<Extract<keyof T, string>> {
  return untracked(() => {
    const injector = options.injector ?? inject(Injector);
    const router = injector.get(Router);
    const report = (error: QueryParamSyncError) => {
      if (options.onError) options.onError(error);
      else injector.get(ErrorHandler).handleError(error);
    };
    // Resolve all configuration before changing any source or reserving URL keys.
    const definitions = Object.entries(bindings).map(([key, input]) => {
      const config = (typeof input === 'function' ? { source: input } : input) as QueryParamBinding<any>;
      const source = createQueryParamSource(config?.source, key);
      const fallback = Object.hasOwn(config, 'defaultValue') ? config.defaultValue : source.read();
      const serializer = resolveSerializer(config.serializer, fallback);
      const serialize = (value: unknown): readonly string[] => {
        const result = (value === null || value === undefined) ? null : serializer.serialize(value);
        if (result !== null && (!Array.isArray(result) || result.some(item => typeof item !== 'string'))) {
          throw new Error(`The serializer for "${key}" must serialize to strings or null.`);
        }
        return result ?? [];
      };
      const defaultValues = serialize(fallback);
      const owner = config.injector ?? injector;
      if (owner.get(Router) !== router) throw new Error('All query parameter owners must use the same Router.');
      return { key, config, source, fallback, serializer, serialize, defaultValues, owner };
    });
    const initialNavigation = router.currentNavigation();
    const initialUrl = initialNavigation?.finalUrl ?? router.parseUrl(router.url);
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
    const prepareNotification = createQueryParamNotification(
      () => Object.fromEntries(definitions.map(({ key, source }) => [key, source.read()])) as { [K in keyof T]: ReturnType<T[K]> },
      () => stopped,
      options,
      injector,
    );
    const prepareNavigationNotification = () => prepareNotification('navigation');
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
        const { key, config, source, serializer, fallback, serialize, defaultValues, owner } = definition;
        const cleanup: (() => void)[] = [];
        const entry: QueryEntry = {
          key,
          active: true,
          history: config.history ?? options.history ?? 'replace',
          report,
          accept: state.accept,
          prepareNotification: prepareNavigationNotification,
          setPending: pending => state.setPending(key, pending),
          read() {
            const values = serialize(source.read());
            return config.clearOnDefault && sameValues(values, defaultValues) ? [] : values;
          },
          acknowledgesInitial(values, navigationId) {
            // Activation already hydrated this entry; preserve edits made by its initial hooks.
            return navigationId === initialNavigation?.id && sameValues(values, initialUrl.queryParamMap.getAll(key));
          },
          restore(values) {
            let value = fallback;
            if (values.length) {
              try {
                value = serializer.parse(values);
              } catch (cause) {
                report({ key, phase: 'parse', cause });
              }
            }
            source.write(value);
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
          cleanup.push(source.watch(() => coordinator.enqueue(entry), { injector: owner, onDestroy: entry.stop }));
        });
      }
      for (const start of initialize) {
        if (stopped) break;
        start();
      }
      if (!stopped) prepareNotification('initial')?.();
    } catch (error) {
      stop();
      throw error;
    }
    return state.result(() => untracked(stop));
  });
}
