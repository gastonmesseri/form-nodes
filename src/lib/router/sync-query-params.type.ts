import type { NodeApi } from '@ngblocks/form-nodes';
import type { Injector, Signal, WritableSignal } from '@angular/core';

import type { QueryParamSerializer } from './query-param-serializer';

/**
 * Options for one form node or writable signal in a query parameter map.
 *
 * ```ts
 * const binding: QueryParamBinding<string> = {
 *   source: field.strict(''),
 *   clearOnDefault: true,
 * };
 * ```
 */
export type QueryParamBinding<T> = {
  /**
   * Existing field, form, group, array, or writable Angular signal to synchronize.
   * Nodes keep committed-value observation, validation, and node ownership. Signals
   * respect their own equality and use the entry injector. Readonly signals are rejected.
   * Objects and arrays need an explicit serializer. Aggregate imports use the node set operation.
   *
   * ```ts
   * function connect() {
   *   return syncQueryParams({
   *     q: { source: field('') },
   *   });
   * }
   * ```
   */
  source: Signal<T> & ({ $api: Pick<NodeApi, 'nodeType' | 'set'> } | (Pick<WritableSignal<NoInfer<T>>, 'set'> & { $api?: never }));
  /**
   * A built-in serializer name or a custom conversion contract compatible with the source.
   *
   * **Default:** Infer string, number, or boolean
   * from the fallback value.
   *
   * **Accepted values:**
   *
   * - `string`: One string, preserving empty text.
   * - `number`: One finite decimal number.
   * - `integer`: One safe integer.
   * - `boolean`: The literal true or false.
   * - `array`: A string array encoded as repeated query keys, preserving order.
   * - `json`: A complete JSON value encoded in one query parameter, without schema validation.
   * - **Serializer objects**: A QueryParamSerializer with custom parse and serialize methods.
   *
   * Names use the same conversions as queryParam factories. Arrays require an explicit
   * serializer; array supports mutable and readonly string arrays. An empty array removes
   * the key with array, while json encodes it as []. Other array element types can use
   * json or a custom serializer. JSON parsing checks syntax only; the source type is trusted.
   *
   * ```ts
   * function connect() {
   *   return syncQueryParams({
   *     page: {
   *       source: field(1),
   *       serializer: 'integer',
   *     },
   *   });
   * }
   * ```
   *
   * ```ts
   * function connectTags() {
   *   const filters = form({
   *     tags: field.strict<string[]>([]),
   *   });
   *   return syncQueryParams({
   *     tag: {
   *       source: filters.tags,
   *       serializer: 'array',
   *     },
   *   });
   * }
   * ```
   *
   * ```ts
   * function connect() {
   *   return syncQueryParams({
   *     page: {
   *       source: field(1),
   *       serializer: queryParam.integer(),
   *     },
   *   });
   * }
   * ```
   *
   * ```ts
   * function connectState() {
   *   const filters = form({
   *     state: field({ category: 'all' }),
   *   });
   *   return syncQueryParams({
   *     state: {
   *       source: filters.state,
   *       serializer: 'json',
   *     },
   *   });
   * }
   * ```
   */
  serializer?: QueryParamSerializer<NoInfer<T>> | 'json'
    | ([NonNullable<NoInfer<T>>] extends [string] ? string extends NoInfer<T> ? 'string' : never : never)
    | ([NonNullable<NoInfer<T>>] extends [number] ? number extends NoInfer<T> ? 'number' | 'integer' : never : never)
    | ([NonNullable<NoInfer<T>>] extends [boolean] ? boolean extends NoInfer<T> ? 'boolean' : never : never)
    | ([NonNullable<NoInfer<T>>] extends [readonly string[]] ? string[] extends NoInfer<T> ? 'array' : never : never);
  /**
   * Value used for missing or malformed parameters. Default: source value captured at registration.
   * Nodes capture their committed value; signals use their current value.
   *
   * ```ts
   * function connect() {
   *   return syncQueryParams({
   *     q: {
   *       source: field(''),
   *       defaultValue: '',
   *     },
   *   });
   * }
   * ```
   */
  defaultValue?: NoInfer<T>;
  /**
   * Remove values whose serialized representation matches the default. Default: false.
   *
   * ```ts
   * function connect() {
   *   return syncQueryParams({
   *     q: {
   *       source: field(''),
   *       clearOnDefault: true,
   *     },
   *   });
   * }
   * ```
   */
  clearOnDefault?: boolean;
  /**
   * History behavior for this key. Default: inherit the helper option, otherwise replace.
   *
   * ```ts
   * function connect() {
   *   return syncQueryParams({
   *     page: {
   *       source: field(1),
   *       history: 'push',
   *     },
   *   });
   * }
   * ```
   */
  history?: 'replace' | 'push';
  /**
   * Additional lifetime owner for this entry.
   *
   * **Default:** The helper's injector.
   *
   * ```ts
   * import { Injector } from '@angular/core';
   *
   * function connect(injector: Injector) {
   *   return syncQueryParams({
   *     q: { source: field(''), injector },
   *   }, { injector });
   * }
   * ```
   */
  injector?: Injector;
};

/** A URL conversion or navigation failure, independent of form validation. */
export type QueryParamSyncError = {
  /** Query key for a conversion failure; null for a shared navigation failure. */
  key: string | null;
  /** Operation that failed. */
  phase: 'parse' | 'serialize' | 'navigation';
  /** Original thrown error or a rejected-navigation error. */
  cause: unknown;
};

/** Values captured after importing a complete query parameter synchronization. */
export type QueryParamUrlSyncEvent<TValues extends Record<string, unknown> = Record<string, unknown>> = {
  /** Initial hydration or a later accepted URL restoration. */
  readonly reason: 'initial' | 'navigation';
  /**
   * Current committed source values, indexed by configured query names.
   * The map is a shallow readonly snapshot; object and array values are not cloned.
   */
  readonly values: Readonly<TValues>;
};

/** Shared options for a synchronized query parameter map. */
export type SyncQueryParamsOptions<TValues extends Record<string, unknown> = Record<string, unknown>> = {
  /**
   * Router and lifetime owner.
   *
   * **Default:** The current Angular injection context.
   *
   * ```ts
   * import { Injector } from '@angular/core';
   *
   * function connect(injector: Injector) {
   *   return syncQueryParams({
   *     q: field(''),
   *   }, { injector });
   * }
   * ```
   */
  injector?: Injector;
  /**
   * Default history mode. Any changed push entry makes a batch push.
   *
   * **Default:** replace.
   *
   * ```ts
   * function connect() {
   *   return syncQueryParams({
   *     page: field(1),
   *   }, { history: 'push' });
   * }
   * ```
   */
  history?: 'replace' | 'push';
  /**
   * Runs once after all initial URL values and fallbacks have been applied.
   * Runs synchronously before onUrlSync and before the connection is returned.
   * Read event.values or the sources; the receiving connection is not assigned yet.
   * Empty or already disposed connections do not notify. Does not await validation.
   *
   * **Default:** No initial callback.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({ template: '' })
   * export class SearchPage {
   *   filters = form({ q: field('') });
   *   query = syncQueryParams({
   *     q: this.filters.q,
   *   }, {
   *     onInitialUrlSync: ({ values }) => {
   *       console.log(values.q);
   *     },
   *   });
   * }
   * ```
   */
  onInitialUrlSync?(event: QueryParamUrlSyncEvent<TValues> & { readonly reason: 'initial' }): void;
  /**
   * Runs once per complete URL-to-source synchronization, including initialization.
   * reason is initial for hydration and navigation for later accepted restorations.
   * Own write acknowledgments, unrelated query changes, and rejected navigations
   * do not notify. Redirects notify when their final URL imports source values.
   * Callbacks run untracked, do not await validation or returned promises, and
   * report thrown errors or rejected promises through Angular ErrorHandler.
   *
   * **Default:** No synchronization callback.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({ template: '' })
   * export class SearchPage {
   *   filters = form({ q: field('') });
   *   query = syncQueryParams({
   *     q: this.filters.q,
   *   }, {
   *     onUrlSync: ({ reason, values }) => {
   *       console.log(reason, values.q);
   *     },
   *   });
   * }
   * ```
   */
  onUrlSync?(event: QueryParamUrlSyncEvent<TValues>): void;
  /**
   * Receives conversion and navigation failures separately from validation.
   *
   * **Default:** Report through Angular ErrorHandler.
   *
   * ```ts
   * function connect() {
   *   return syncQueryParams({
   *     q: field(''),
   *   }, {
   *     onError: error => {
   *       console.error(error.phase);
   *     },
   *   });
   * }
   * ```
   */
  onError?(error: QueryParamSyncError): void;
};

/** A live query connection with raw URL signals and explicit lifecycle control. */
export type QueryParamsSync<K extends string = string> = {
  /**
   * Readonly signals for the configured keys, before serializer parsing.
   * Values are URL-decoded strings, or null when absent. Repeated keys return
   * their first value. Read an array-serializer source for all parsed values.
   * Snapshots update on accepted navigation and freeze when the connection closes.
   *
   * ```ts
   * function connect() {
   *   const sync = syncQueryParams({
   *     page: field(1),
   *   });
   *   const raw = sync.params.page();
   *   return raw; // string | null
   * }
   * ```
   */
  readonly params: { readonly [P in K]: Signal<string | null> };
  /**
   * Whether this connection has queued or in-flight URL writes.
   * Starts when a committed edit is observed in a microtask; excludes control
   * debounce, validation, external navigation, and other connections' work.
   * Becomes false after settlement or cleanup.
   *
   * ```ts
   * function connect() {
   *   const sync = syncQueryParams({
   *     q: field(''),
   *   });
   *   return sync.pending(); // false
   * }
   * ```
   */
  readonly pending: Signal<boolean>;
  /**
   * Whether all bindings have ended through unsubscribe or injector cleanup.
   * An empty map is already closed and has no parameter signals.
   *
   * ```ts
   * function connect() {
   *   const sync = syncQueryParams({
   *     q: field(''),
   *   });
   *   sync.unsubscribe();
   *   return sync.closed(); // true
   * }
   * ```
   */
  readonly closed: Signal<boolean>;
  /**
   * Idempotently release this connection and its pending writes.
   * Fields retain their values. URL signals retain their last snapshot.
   * Injector destruction also performs this cleanup automatically.
   *
   * ```ts
   * function connect() {
   *   const sync = syncQueryParams({
   *     q: field(''),
   *   });
   *   sync.unsubscribe();
   * }
   * ```
   */
  unsubscribe(): void;
};
