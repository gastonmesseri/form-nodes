import { describe, expect, it, vi } from 'vitest';

import type { ObservableLike, ObserverLike } from '../types/observable-like.type';
import { resolveAsyncValidationResult } from './resolve-async-validation-result';
import type { ValidationResult } from './validation.type';

const controller = (): AbortController => new AbortController();

describe('resolveAsyncValidationResult', () => {
  it('returns Promise-like results unchanged', () => {
    const result = Promise.resolve<ValidationResult>({ kind: 'promise' });

    expect(resolveAsyncValidationResult(result, controller().signal)).toBe(result);
  });

  it('accepts the first synchronous Observable value and unsubscribes', async () => {
    const unsubscribe = vi.fn();
    const result: ObservableLike<ValidationResult> = {
      subscribe(observer) {
        observer.next({ kind: 'first' });
        observer.next({ kind: 'ignored' });
        return { unsubscribe };
      },
    };

    await expect(resolveAsyncValidationResult(result, controller().signal))
      .resolves.toEqual({ kind: 'first' });
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('resolves undefined when an Observable completes synchronously without a value', async () => {
    const unsubscribe = vi.fn();
    const result: ObservableLike<ValidationResult> = {
      subscribe(observer) {
        observer.complete();
        return { unsubscribe };
      },
    };

    await expect(resolveAsyncValidationResult(result, controller().signal)).resolves.toBeUndefined();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('rejects a synchronous Observable error and unsubscribes', async () => {
    const unsubscribe = vi.fn();
    const failure = new Error('validation failed');
    const result: ObservableLike<ValidationResult> = {
      subscribe(observer) {
        observer.error(failure);
        return { unsubscribe };
      },
    };

    await expect(resolveAsyncValidationResult(result, controller().signal)).rejects.toBe(failure);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('handles asynchronous values and ignores events after settlement', async () => {
    const unsubscribe = vi.fn();
    let observer!: ObserverLike<ValidationResult>;
    const result: ObservableLike<ValidationResult> = {
      subscribe(nextObserver) {
        observer = nextObserver;
        return { unsubscribe };
      },
    };
    const resolved = resolveAsyncValidationResult(result, controller().signal);

    observer.next({ kind: 'async' });
    observer.complete();

    await expect(resolved).resolves.toEqual({ kind: 'async' });
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('rejects when subscribe throws', async () => {
    const failure = new Error('subscribe failed');
    const result: ObservableLike<ValidationResult> = {
      subscribe() {
        throw failure;
      },
    };

    await expect(resolveAsyncValidationResult(result, controller().signal)).rejects.toBe(failure);
  });

  it('rejects a subscription that does not provide unsubscribe', async () => {
    const result = {
      subscribe: () => ({}),
    } as unknown as ObservableLike<ValidationResult>;

    await expect(resolveAsyncValidationResult(result, controller().signal))
      .rejects.toThrow('ObservableLike.subscribe() must return a SubscriptionLike');
  });

  it('completes and unsubscribes when aborted', async () => {
    const abortController = controller();
    const unsubscribe = vi.fn();
    const result: ObservableLike<ValidationResult> = {
      subscribe: () => ({ unsubscribe }),
    };
    const resolved = resolveAsyncValidationResult(result, abortController.signal);

    abortController.abort();

    await expect(resolved).resolves.toBeUndefined();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
