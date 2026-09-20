import { ErrorHandler, untracked, type Injector } from '@angular/core';

import type { QueryParamUrlSyncEvent, SyncQueryParamsOptions } from './sync-query-params.type';

export const createQueryParamNotification = <TValues extends Record<string, unknown>>(
  read: () => TValues,
  closed: () => boolean,
  options: SyncQueryParamsOptions<TValues>,
  injector: Injector,
) => {
  let revision = 0;
  return (reason: 'initial' | 'navigation') => {
    const current = ++revision;
    if (closed()) return;
    if (!options.onUrlSync && (reason !== 'initial' || !options.onInitialUrlSync)) return;
    const event = Object.freeze({ reason, values: Object.freeze(read()) });
    const errorHandler = injector.get(ErrorHandler);
    const report = (error: unknown) => errorHandler.handleError(error);
    const invoke = (callback: () => unknown) => {
      try {
        const result = callback();
        if (result !== undefined) void Promise.resolve(result).catch(report);
      } catch (error) {
        report(error);
      }
    };
    return () => {
      return untracked(() => {
        if (closed() || current !== revision) return;
        if (reason === 'initial' && options.onInitialUrlSync) {
          invoke(() => options.onInitialUrlSync!(event as QueryParamUrlSyncEvent<TValues> & { readonly reason: 'initial' }));
        }
        if (!closed() && current === revision && options.onUrlSync) invoke(() => options.onUrlSync!(event));
      });
    };
  };
};
