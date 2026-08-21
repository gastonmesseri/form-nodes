import { isObservable, type Observable } from 'rxjs';

import type { AsyncValidationResult, ValidationResult } from './validation.type';

const resolveObservable = (
  observable: Observable<ValidationResult>,
  abortSignal: AbortSignal,
): Promise<ValidationResult> => new Promise((resolve, reject) => {
  let settled = false;
  let subscription: ReturnType<Observable<ValidationResult>['subscribe']> | undefined;
  const settle = (result: ValidationResult) => {
    if (settled) return;
    settled = true;
    resolve(result);
    subscription?.unsubscribe();
  };
  subscription = observable.subscribe({
    next: settle,
    error: reject,
    complete: () => settle(undefined),
  });
  if (settled) subscription.unsubscribe();
  abortSignal.addEventListener('abort', () => {
    subscription?.unsubscribe();
    settle(undefined);
  }, { once: true });
});

export const resolveAsyncValidationResult = (
  result: AsyncValidationResult,
  abortSignal: AbortSignal,
): PromiseLike<ValidationResult> => isObservable(result)
  ? resolveObservable(result, abortSignal)
  : result;
