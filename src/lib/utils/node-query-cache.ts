/**
 * Limits apply separately to each query function on each node or control-state facade.
 * Entries are allocated only when distinct arguments are queried, never preallocated.
 * Twenty error kinds leave room for generic controls querying absent errors.
 */
export const ERROR_QUERY_CACHE_SIZE = 20;

/** Allows sixteen validator references queried with both resolve modes without eviction. */
export const VALIDATOR_QUERY_CACHE_SIZE = 32;
