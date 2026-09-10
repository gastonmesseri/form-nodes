/**
 * Runs the operation once and returns the fallback only if it throws synchronously.
 * Successful values, including null, undefined, and promises, are returned unchanged.
 * The operation retains the caller's active reactive and injection contexts.
 */
export function attempt<TValue, TFallback>(operation: () => TValue, fallback: TFallback): TValue | TFallback {
  try {
    return operation();
  } catch {
    return fallback;
  }
}
