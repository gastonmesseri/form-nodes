export type SubscriptionLike = {
  unsubscribe(): void;
};

export type ObserverLike<TValue> = {
  next(value: TValue): void;
  error(error: unknown): void;
  complete(): void;
};

export type ObservableLike<TValue> = {
  subscribe(observer: ObserverLike<TValue>): SubscriptionLike;
};
