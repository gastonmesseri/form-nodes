import { isObservableLike } from '../utils/is-observable-like';
import { isSubscriptionLike } from '../utils/is-subscription-like';
import type { AsyncValidationResult, ValidationResult } from './validation.type';
import type { ObservableLike, SubscriptionLike } from '../types/observable-like.type';

type ObservableEvent =
  | { readonly type: 'next'; readonly value: ValidationResult }
  | { readonly type: 'error'; readonly error: unknown }
  | { readonly type: 'complete' };

const resolveObservable = (
  observable: ObservableLike<ValidationResult>,
  abortSignal: AbortSignal,
): Promise<ValidationResult> => new Promise((resolve, reject) => {
  let settled = false;
  let subscribing = true;
  let subscription: SubscriptionLike | undefined;
  let synchronousEvent: ObservableEvent | undefined;
  const settle = (event: ObservableEvent) => {
    if (settled) return;
    if (subscribing) {
      synchronousEvent ??= event;
      return;
    }
    settled = true;
    if (event.type === 'error') reject(event.error);
    else resolve(event.type === 'next' ? event.value : undefined);
    subscription?.unsubscribe();
  };
  let subscriptionCandidate: unknown;
  try {
    subscriptionCandidate = observable.subscribe({
      next: (value) => settle({ type: 'next', value }),
      error: (error) => settle({ type: 'error', error }),
      complete: () => settle({ type: 'complete' }),
    });
  } catch (error) {
    subscribing = false;
    settle({ type: 'error', error });
    return;
  }
  subscribing = false;
  if (!isSubscriptionLike(subscriptionCandidate)) {
    settle({ type: 'error', error: new TypeError('ObservableLike.subscribe() must return a SubscriptionLike') });
    return;
  }
  subscription = subscriptionCandidate;
  if (synchronousEvent) settle(synchronousEvent);
  abortSignal.addEventListener('abort', () => {
    settle({ type: 'complete' });
  }, { once: true });
});

export const resolveAsyncValidationResult = (
  result: AsyncValidationResult,
  abortSignal: AbortSignal,
): PromiseLike<ValidationResult> => isObservableLike<ValidationResult>(result)
  ? resolveObservable(result, abortSignal)
  : result;
