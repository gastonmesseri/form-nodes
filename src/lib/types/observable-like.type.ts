/** Handle returned by an observable-like source so the current validation run can release it. */
export type SubscriptionLike = {
  /** Stops the source and releases resources associated with its subscription. */
  unsubscribe(): void;
};

/** Minimal observer contract accepted from an asynchronous validation source. */
export type ObserverLike<TValue> = {
  /** Emits the validation result for the current run. Only the first emission is used. */
  next(value: TValue): void;
  /** Reports a source failure to the validator's configured `onError` handler. */
  error(error: unknown): void;
  /** Completes the source. Completing before an emission is treated as successful validation. */
  complete(): void;
};

/**
 * Framework-neutral subset of an Observable accepted from asynchronous validators.
 *
 * The first emitted result settles the validation run and unsubscribes from the source. A source
 * that completes without emitting settles successfully. RxJS `Observable` satisfies this shape,
 * but importing RxJS is not required.
 */
export type ObservableLike<TValue> = {
  /** Subscribes the validation observer and returns a handle used for cancellation and cleanup. */
  subscribe(observer: ObserverLike<TValue>): SubscriptionLike;
};
