/** Handle returned by an observable-like source so the current validation run can release it. */
export type SubscriptionLike = {
  /**
   * Stops the source and releases resources associated with its subscription.
   *
   * ```ts
   * const rule = asyncValidator(() => ({
   *   subscribe(observer: ObserverLike<null>) {
   *     const timer = setTimeout(() => {
   *       observer.next(null);
   *     }, 300);
   *     return {
   *       unsubscribe() {
   *         clearTimeout(timer);
   *       },
   *     };
   *   },
   * }));
   * field('Ada', [rule]);
   * ```
   */
  unsubscribe(): void;
};

/** Minimal observer contract accepted from an asynchronous validation source. */
export type ObserverLike<TValue> = {
  /**
   * Emits the validation result for the current run. Only the first emission is used.
   *
   * ```ts
   * const rule = asyncValidator(() => ({
   *   subscribe(observer: ObserverLike<null>) {
   *     observer.next(null);
   *     observer.complete();
   *     return { unsubscribe() {} };
   *   },
   * }));
   * const profile = form({
   *   name: field('Ada', [rule]),
   * });
   * ```
   */
  next(value: TValue): void;
  /**
   * Reports a source failure to the validator's configured `onError` handler.
   *
   * ```ts
   * const rule = asyncValidator(() => ({
   *   subscribe(observer: ObserverLike<null>) {
   *     observer.error(new Error('Unavailable'));
   *     return { unsubscribe() {} };
   *   },
   * }), {
   *   onError: () => ({ kind: 'unavailable' }),
   * });
   * field('Ada', [rule]);
   * ```
   */
  error(error: unknown): void;
  /**
   * Completes the source. Completing before an emission is treated as successful validation.
   *
   * ```ts
   * const rule = asyncValidator(() => ({
   *   subscribe(observer: ObserverLike<null>) {
   *     observer.complete();
   *     return { unsubscribe() {} };
   *   },
   * }));
   * field('Ada', [rule]);
   * ```
   */
  complete(): void;
};

/**
 * Framework-neutral subset of an Observable accepted from asynchronous validators.
 *
 * The first emitted result settles the validation run and unsubscribes from the source. A source
 * that completes without emitting settles successfully. RxJS `Observable` satisfies this shape,
 * but importing RxJS is not required.
 *
 * ```ts
 * const rule = asyncValidator(() => ({
 *   subscribe(observer: ObserverLike<null>) {
 *     observer.next(null);
 *     observer.complete();
 *     return { unsubscribe() {} };
 *   },
 * }));
 * const profile = form({
 *   name: field('Ada', [rule]),
 * });
 * ```
 */
export type ObservableLike<TValue> = {
  /**
   * Subscribes the validation observer and returns a handle used for cancellation and cleanup.
   *
   * ```ts
   * const rule = asyncValidator(() => ({
   *   subscribe(observer: ObserverLike<null>) {
   *     observer.next(null);
   *     observer.complete();
   *     return { unsubscribe() {} };
   *   },
   * }));
   * const profile = form({
   *   name: field('Ada', [rule]),
   * });
   * ```
   */
  subscribe(observer: ObserverLike<TValue>): SubscriptionLike;
};
