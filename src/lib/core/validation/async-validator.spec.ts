import { Injector, signal } from '@angular/core';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { asyncValidator } from './async-validator';
import { required } from './validators/required';
import type { ObservableLike } from './validation.type';

const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('asyncValidator', () => {
  it('exposes unknown validity while validation is pending', async () => {
    const name = field('David', [asyncValidator(async () => null)]);

    expect(name.pending()).toBe(true);
    expect(name.validationStatus()).toBe('unknown');
    expect(name.valid()).toBe(false);
    expect(name.invalid()).toBe(false);

    await settle();

    expect(name.pending()).toBe(false);
    expect(name.validationStatus()).toBe('valid');
  });

  it('adds the target node to asynchronous errors', async () => {
    const name = field('David', [asyncValidator(async () => ({ kind: 'taken' }))]);

    await settle();

    expect(name.errors()).toEqual([{ kind: 'taken', targetNode: name }]);
    expect(name.invalid()).toBe(true);
  });

  it('accepts the first result emitted by an Observable validator', async () => {
    const result: ObservableLike<{ kind: string }> = {
      subscribe: (observer) => {
        observer.next({ kind: 'observableError' });
        return { unsubscribe: () => undefined };
      },
    };
    const name = field('David', [asyncValidator(() => result)]);

    await settle();

    expect(name.errors()).toEqual([{ kind: 'observableError', targetNode: name }]);
    expect(name.pending()).toBe(false);
  });

  it('unsubscribes an Observable validator when validation becomes stale', async () => {
    const unsubscribe = vi.fn();
    const validate = vi.fn(({ value }) => {
      value();
      return {
        subscribe: () => ({ unsubscribe }),
      } satisfies ObservableLike<never>;
    });
    const name = field('first', [asyncValidator(validate)]);

    await Promise.resolve();
    name.set('second');
    await Promise.resolve();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('routes an invalid ObservableLike subscription through onError', async () => {
    const invalidObservable = { subscribe: () => ({}) } as unknown as ObservableLike<never>;
    const name = field('David', [
      asyncValidator(() => invalidObservable, {
        onError: () => ({ kind: 'invalidObservable' }),
      }),
    ]);

    await settle();

    expect(name.errors()).toMatchObject([{ kind: 'invalidObservable' }]);
  });

  it('does not run asynchronous validators while synchronous validation fails', async () => {
    const validate = vi.fn(async () => null);
    const name = field('', [required, asyncValidator(validate)]);

    await settle();

    expect(validate).not.toHaveBeenCalled();
    expect(name.pending()).toBe(false);
    expect(name.invalid()).toBe(true);
  });

  it('aborts stale validation and ignores its result', async () => {
    const signals: AbortSignal[] = [];
    const name = field('first', [asyncValidator(({ value, abortSignal }) => {
      signals.push(abortSignal);
      const current = value();
      return new Promise((resolve) => setTimeout(() => resolve(current === 'first' ? { kind: 'stale' } : null), 1));
    })]);

    await Promise.resolve();
    name.set('second');
    await new Promise((resolve) => setTimeout(resolve, 5));

    expect(signals[0]?.aborted).toBe(true);
    expect(name.errors()).toEqual([]);
    expect(name.valid()).toBe(true);
  });

  it('propagates pending state to its form', async () => {
    const name = field('David', [asyncValidator(async () => null)]);
    const profile = form({ name });

    expect(profile.api.pending()).toBe(true);
    expect(profile.api.validationStatus()).toBe('unknown');

    await settle();

    expect(profile.api.pending()).toBe(false);
    expect(profile.api.valid()).toBe(true);
  });

  it('provides a typed value and abort signal', () => {
    asyncValidator<string>(async ({ value, abortSignal }) => {
      expectTypeOf(value()).toEqualTypeOf<string>();
      expectTypeOf(abortSignal).toEqualTypeOf<AbortSignal>();
      return null;
    });
  });

  it('reacts to signals read by a validator outside an injection context', async () => {
    const dependency = signal('available');
    const validate = vi.fn(async () => dependency() === 'available' ? null : { kind: 'unavailable' });
    const name = field('David', [asyncValidator(validate)]);

    await settle();
    expect(name.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledOnce();

    dependency.set('unavailable');
    await settle();

    expect(validate).toHaveBeenCalledTimes(2);
    expect(name.errors()).toEqual([{ kind: 'unavailable', targetNode: name }]);
  });

  it('discovers dependencies immediately but debounces subsequent node value validation', async () => {
    vi.useFakeTimers();
    const validate = vi.fn(async ({ value }) => value() === 'final' ? { kind: 'taken' } : null);
    const name = field('initial', [asyncValidator(validate, { debounce: 100 })]);

    name.set('intermediate');
    await Promise.resolve();
    name.set('final');
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(name.pending()).toBe(true);
    expect(name.errors()).toEqual([]);

    await vi.advanceTimersByTimeAsync(100);

    expect(validate).toHaveBeenCalledTimes(2);
    expect(name.errors()).toEqual([{ kind: 'taken', targetNode: name }]);
    vi.useRealTimers();
  });

  it('tracks external signals during the initial call and debounces their changes', async () => {
    vi.useFakeTimers();
    const dependency = signal('available');
    const validate = vi.fn(async () => dependency() === 'available' ? null : { kind: 'unavailable' });
    const name = field('David', [asyncValidator(validate, { debounce: 100 })]);

    expect(validate).toHaveBeenCalledOnce();

    dependency.set('unavailable');
    await Promise.resolve();
    expect(name.errors()).toEqual([]);
    await vi.advanceTimersByTimeAsync(100);

    expect(validate).toHaveBeenCalledTimes(2);
    expect(name.errors()).toEqual([{ kind: 'unavailable', targetNode: name }]);
    vi.useRealTimers();
  });

  it('stops reactive validation when its explicit injector is destroyed', async () => {
    const dependency = signal('available');
    const validate = vi.fn(async () => dependency() === 'available' ? null : { kind: 'unavailable' });
    const injector = Injector.create({ providers: [] });
    const name = field('David', [asyncValidator(validate)], { injector });

    await settle();
    expect(name.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledOnce();

    dependency.set('unavailable');
    await settle();

    expect(validate).toHaveBeenCalledTimes(2);
    expect(name.errors()).toEqual([{ kind: 'unavailable', targetNode: name }]);

    injector.destroy();
    dependency.set('available');
    await settle();

    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('clears a debounce timer when its explicit injector is destroyed', async () => {
    vi.useFakeTimers();
    const validate = vi.fn(async () => null);
    const injector = Injector.create({ providers: [] });
    field('David', [asyncValidator(validate, { debounce: 100 })], { injector });

    expect(vi.getTimerCount()).toBe(1);
    injector.destroy();

    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(100);
    expect(validate).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
