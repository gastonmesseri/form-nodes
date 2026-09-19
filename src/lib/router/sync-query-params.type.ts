import type { ParamMap } from '@angular/router';
import type { FieldApi } from '@ngblocks/form-nodes';
import type { Injector, Signal } from '@angular/core';

import type { QueryParamCodec } from './query-param-codec';

/**
 * Options for one field in a query parameter map.
 *
 * ```ts
 * const binding: QueryParamBinding<string> = {
 *   field: field.strict(''),
 *   clearOnDefault: true,
 * };
 * ```
 */
export type QueryParamBinding<T> = {
  /**
   * Existing field to synchronize. Signals and aggregate nodes are not accepted.
   *
   * ```ts
   * function connect() {
   *   return syncQueryParams({
   *     q: { field: field('') },
   *   });
   * }
   * ```
   */
  field: Signal<T> & { $api: Pick<FieldApi<T>, 'nodeType' | 'set'> };
  /**
   * A built-in codec name or a custom conversion contract compatible with the field.
   *
   * **Default:** Infer string, number, or boolean from the fallback value.
   *
   * **Accepted values:**
   *
   * - `string`: One string, preserving empty text.
   * - `number`: One finite decimal number.
   * - `integer`: One safe integer.
   * - `boolean`: The literal true or false.
   * - `array`: A string array encoded as repeated query keys, preserving order.
   * - `json`: A complete JSON value encoded in one query parameter, without schema validation.
   * - **Codec objects**: A QueryParamCodec with custom parse and serialize methods.
   *
   * Names use the same conversions as queryParam factories. Arrays require an explicit
   * codec; array supports mutable and readonly string arrays. An empty array removes
   * the key with array, while json encodes it as []. Other array element types can use
   * json or a custom codec. JSON parsing checks syntax only; the field type is trusted.
   *
   * ```ts
   * function connect() {
   *   return syncQueryParams({
   *     page: {
   *       field: field(1),
   *       codec: 'integer',
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
   *       field: filters.tags,
   *       codec: 'array',
   *     },
   *   });
   * }
   * ```
   *
   * ```ts
   * function connect() {
   *   return syncQueryParams({
   *     page: {
   *       field: field(1),
   *       codec: queryParam.integer(),
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
   *       field: filters.state,
   *       codec: 'json',
   *     },
   *   });
   * }
   * ```
   */
  codec?: QueryParamCodec<NoInfer<T>> | 'json'
    | ([NonNullable<NoInfer<T>>] extends [string] ? string extends NoInfer<T> ? 'string' : never : never)
    | ([NonNullable<NoInfer<T>>] extends [number] ? number extends NoInfer<T> ? 'number' | 'integer' : never : never)
    | ([NonNullable<NoInfer<T>>] extends [boolean] ? boolean extends NoInfer<T> ? 'boolean' : never : never)
    | ([NonNullable<NoInfer<T>>] extends [readonly string[]] ? string[] extends NoInfer<T> ? 'array' : never : never);
  /**
   * Value used for missing or malformed parameters. Default: committed value captured at registration.
   *
   * ```ts
   * function connect() {
   *   return syncQueryParams({
   *     q: {
   *       field: field(''),
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
   *       field: field(''),
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
   *       field: field(1),
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
   *     q: { field: field(''), injector },
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

/** Shared options for a synchronized query parameter map. */
export type SyncQueryParamsOptions = {
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
   * Readonly signals for the configured keys, before codec parsing.
   * Values are URL-decoded strings, or null when absent. Repeated keys return
   * their first value; use paramMap for all values. Snapshots update on accepted
   * navigation and freeze when the connection closes.
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
   * Snapshot of all URL query keys, including unbound and repeated parameters.
   * Arrays returned by keys and getAll are copies; mutating them does not change
   * synchronization. Initialized from the activation URL, then updated only on
   * accepted navigation. The last snapshot remains readable after cleanup.
   *
   * ```ts
   * function connect() {
   *   const sync = syncQueryParams({
   *     q: field(''),
   *   });
   *   return sync.paramMap().getAll('tag');
   * }
   * ```
   */
  readonly paramMap: Signal<ParamMap>;
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
   * An empty map is already closed and retains only its initial URL snapshot.
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
