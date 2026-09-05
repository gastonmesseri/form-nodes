import { Injector, signal } from '@angular/core';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import type { Node } from '../types/node.type';
import { required } from './validators/required';
import { asyncValidator } from './async-validator';
import { form, type FormApi } from '../primitives/form';
import { field, type FieldApi } from '../primitives/field';
import type { ObservableLike, ObserverLike } from '../types/observable-like.type';
import type { AsyncValidatorApi, FieldContext } from './validation.type';

const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
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

  it('ignores emissions made by an Observable after its validation becomes stale', async () => {
    const observers: ObserverLike<{ kind: string }>[] = [];
    const validate = ({ value }: FieldContext<string | null>) => {
      value();
      return {
        subscribe: (observer: ObserverLike<{ kind: string }>) => {
          observers.push(observer);
          return { unsubscribe: () => undefined };
        },
      } satisfies ObservableLike<{ kind: string }>;
    };
    const name = field('first', [asyncValidator(validate)]);

    await Promise.resolve();
    name.set('second');
    await settle();
    expect(observers).toHaveLength(2);

    observers[0]!.next({ kind: 'staleObservableError' });
    await settle();
    expect(name.errors()).toEqual([]);
    expect(name.pending()).toBe(true);

    observers[1]!.complete();
    await settle();
    expect(name.errors()).toEqual([]);
    expect(name.pending()).toBe(false);
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

  it('does not publish an onError fallback after it destroys the owning injector', async () => {
    let rejectValidation!: (error: unknown) => void;
    const injector = Injector.create({ providers: [] });
    const name = field('David', [asyncValidator(
      () => new Promise<never>((_, reject) => { rejectValidation = reject; }),
      {
        onError: () => {
          injector.destroy();
          return { kind: 'fallback' };
        },
      },
    )], { injector });

    await Promise.resolve();
    rejectValidation(new Error('service failed'));
    await settle();

    expect(name.pending()).toBe(false);
    expect(name.errors()).toEqual([]);
  });

  it('does not run asynchronous validators while synchronous validation fails', async () => {
    const validate = vi.fn(async () => null);
    const name = field('', [required, asyncValidator(validate)]);

    await settle();

    expect(validate).not.toHaveBeenCalled();
    expect(name.pending()).toBe(false);
    expect(name.invalid()).toBe(true);
  });

  it('only runs while its reactive when condition is true', async () => {
    const enabled = signal(false);
    const validate = vi.fn(async () => ({ kind: 'taken' }));
    const name = field('David', [asyncValidator(validate, {
      when: () => enabled(),
    })]);

    expect(validate).not.toHaveBeenCalled();
    expect(name.pending()).toBe(false);
    expect(name.errors()).toEqual([]);

    enabled.set(true);
    await settle();

    expect(validate).toHaveBeenCalledOnce();
    expect(name.errors()).toEqual([{ kind: 'taken', targetNode: name }]);

    enabled.set(false);
    await settle();

    expect(validate).toHaveBeenCalledOnce();
    expect(name.pending()).toBe(false);
    expect(name.errors()).toEqual([]);
  });

  it('aborts in-flight validation when its when condition becomes false', async () => {
    const enabled = signal(true);
    const signals: AbortSignal[] = [];
    const validate = vi.fn(({ abortSignal }) => {
      signals.push(abortSignal);
      return new Promise<null>(() => undefined);
    });
    const name = field('David', [asyncValidator(validate, {
      when: () => enabled(),
    })]);

    expect(name.pending()).toBe(true);
    enabled.set(false);
    await settle();

    expect(signals[0]?.aborted).toBe(true);
    expect(name.pending()).toBe(false);
    expect(name.errors()).toEqual([]);
  });

  it('does not evaluate params or finish debounce while when is false', async () => {
    vi.useFakeTimers();
    const enabled = signal(false);
    const params = vi.fn(({ value }) => ({ username: value() }));
    const validate = vi.fn(async () => null);
    const name = field('David', [asyncValidator({
      debounce: 100,
      params,
      validate,
      when: () => enabled(),
    })]);

    expect(params).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
    expect(name.pending()).toBe(false);

    enabled.set(true);
    await settle();
    expect(params).toHaveBeenCalledOnce();
    expect(name.pending()).toBe(true);

    enabled.set(false);
    await settle();
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(100);

    expect(validate).not.toHaveBeenCalled();
    expect(name.pending()).toBe(false);
    vi.useRealTimers();
  });

  it('aborts stale validation and ignores its result', async () => {
    const signals: AbortSignal[] = [];
    const name = field('first', [asyncValidator(({ value, abortSignal }) => {
      signals.push(abortSignal);
      const current = value();
      return new Promise(resolve => setTimeout(() => resolve(current === 'first' ? { kind: 'stale' } : null), 1));
    })]);

    await Promise.resolve();
    name.set('second');
    await settle();
    await new Promise(resolve => setTimeout(resolve, 5));

    expect(signals[0]?.aborted).toBe(true);
    expect(name.errors()).toEqual([]);
    expect(name.valid()).toBe(true);
  });

  it('publishes completed validators in declaration order and remains pending until all finish', async () => {
    let resolveFirst!: (result: { kind: string }) => void;
    let resolveSecond!: (result: { kind: string }) => void;
    const name = field('David', [
      asyncValidator(() => new Promise<{ kind: string }>((resolve) => { resolveFirst = resolve; })),
      asyncValidator(() => new Promise<{ kind: string }>((resolve) => { resolveSecond = resolve; })),
    ]);

    await Promise.resolve();
    resolveSecond({ kind: 'second' });
    await settle();

    expect(name.errors()).toMatchObject([{ kind: 'second' }]);
    expect(name.pending()).toBe(true);
    expect(name.validationStatus()).toBe('invalid');

    resolveFirst({ kind: 'first' });
    await settle();

    expect(name.errors()).toMatchObject([{ kind: 'first' }, { kind: 'second' }]);
    expect(name.pending()).toBe(false);
  });

  it('aborts pending work and ignores its late result after setValidators', async () => {
    let resolveValidation!: (result: { kind: string }) => void;
    let abortSignal!: AbortSignal;
    const name = field('David', [asyncValidator(({ abortSignal: currentSignal }) => {
      abortSignal = currentSignal;
      return new Promise((resolve) => { resolveValidation = resolve; });
    })]);

    await Promise.resolve();
    name.setValidators([]);
    await settle();

    expect(abortSignal.aborted).toBe(true);
    expect(name.pending()).toBe(false);
    resolveValidation({ kind: 'lateError' });
    await settle();
    expect(name.errors()).toEqual([]);
  });

  it('coalesces simultaneous value, params, and when changes into one latest validation', async () => {
    const enabled = signal(true);
    const country = signal('CH');
    const validate = vi.fn(async () => null);
    const name = field('David', [asyncValidator({
      params: ({ value }) => ({ country: country(), username: value() }),
      validate,
      when: () => enabled(),
    })]);

    await settle();
    expect(validate).toHaveBeenCalledOnce();

    name.set('Daniel');
    country.set('DE');
    enabled.set(false);
    enabled.set(true);
    await settle();

    expect(validate).toHaveBeenCalledTimes(2);
    expect(validate).toHaveBeenLastCalledWith(expect.objectContaining({
      params: { country: 'DE', username: 'Daniel' },
    }));
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

  it('provides flat readonly state, the field, its API, and an abort signal by default', () => {
    asyncValidator<number | null>(async ({ api, field: fieldNode, value, path, disabled, readonly, touched, abortSignal }) => {
      expectTypeOf(api).toEqualTypeOf<AsyncValidatorApi<number | null>>();
      expectTypeOf(fieldNode).toEqualTypeOf<Node>();
      expectTypeOf(api.value()).toEqualTypeOf<number | null>();
      expectTypeOf(api.path()).toEqualTypeOf<readonly string[]>();
      expectTypeOf(api.set).toBeCallableWith(42);
      expectTypeOf(api.set).toBeCallableWith(null);
      expectTypeOf(value()).toEqualTypeOf<number | null>();
      expectTypeOf(path()).toEqualTypeOf<readonly string[]>();
      expectTypeOf(disabled()).toEqualTypeOf<boolean>();
      expectTypeOf(readonly()).toEqualTypeOf<boolean>();
      expectTypeOf(touched()).toEqualTypeOf<boolean>();
      expectTypeOf(abortSignal).toEqualTypeOf<AbortSignal>();
      return null;
    });
  });

  it('provides the validated node path through its API', async () => {
    let path: readonly string[] = [];
    let receivedForm: unknown;
    let receivedRoot: unknown;
    let receivedField: unknown;
    const rootForm = form({ profile: { age: field(23, [asyncValidator(async ({ field: fieldNode, form, root, path: fieldPath }) => {
      path = fieldPath();
      receivedForm = form();
      receivedRoot = root();
      receivedField = fieldNode;
      return null;
    })]) } });

    await settle();

    expect(path).toEqual(['profile', 'age']);
    expect(receivedForm).toBe(rootForm);
    expect(receivedRoot).toBe(rootForm);
    expect(receivedField).toBe(rootForm.profile.age);
  });

  it('accepts an explicit exact field API type', async () => {
    let receivedApi: FieldApi<string | null> | undefined;
    const name = field('David', [asyncValidator<string | null, FieldApi<string | null>>(async ({ api }) => {
      expectTypeOf(api).toEqualTypeOf<FieldApi<string | null>>();
      receivedApi = api;
      return null;
    })]);

    await settle();

    expect(receivedApi).toBe(name.api);
  });

  it('accepts an explicit exact form API type', async () => {
    const country = field('CH');
    type CountryFormApi = FormApi<{ country: typeof country }>;
    let receivedApi: CountryFormApi | undefined;
    const profile = form({ country }, [asyncValidator<{ country: string | null }, CountryFormApi>(async ({ api }) => {
      expectTypeOf(api).toEqualTypeOf<CountryFormApi>();
      receivedApi = api;
      return null;
    })]);

    await settle();

    expect(receivedApi).toBe(profile.api);
  });

  it('provides typed explicit params to a parameterized validator', () => {
    asyncValidator({
      params: ({ value }: FieldContext<string>) => ({ country: 'CH', username: value() }),
      validate: async ({ abortSignal, params, api, value }) => {
        expectTypeOf(value()).toEqualTypeOf<string>();
        expectTypeOf(params).toEqualTypeOf<{ country: string; username: string }>();
        expectTypeOf(api.dirty()).toEqualTypeOf<boolean>();
        expectTypeOf(abortSignal).toEqualTypeOf<AbortSignal>();
        return null;
      },
    });
  });

  it('reacts to interaction state read by an automatic validator', async () => {
    const validate = vi.fn(async ({ api }) => api.touched() ? { kind: 'alreadyTouched' } : null);
    const name = field('David', [asyncValidator(validate)]);

    await settle();
    expect(validate).toHaveBeenCalledOnce();
    expect(name.errors()).toEqual([]);

    name.markAsTouched();
    await settle();

    expect(validate).toHaveBeenCalledTimes(2);
    expect(name.errors()).toEqual([{ kind: 'alreadyTouched', targetNode: name }]);
  });

  it('allows explicit params to derive from asynchronous validator state', async () => {
    const validate = vi.fn(async ({ params }) => params.dirty ? { kind: 'changed' } : null);
    const name = field('David', [asyncValidator({
      params: ({ api }) => ({ dirty: api.dirty() }),
      validate,
    })]);

    await settle();
    expect(name.errors()).toEqual([]);

    name.markAsDirty();
    await settle();

    expect(validate).toHaveBeenCalledTimes(2);
    expect(name.errors()).toEqual([{ kind: 'changed', targetNode: name }]);
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

    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();

    dependency.set('unavailable');
    await Promise.resolve();
    expect(name.errors()).toEqual([]);
    await vi.advanceTimersByTimeAsync(100);

    expect(validate).toHaveBeenCalledTimes(2);
    expect(name.errors()).toEqual([{ kind: 'unavailable', targetNode: name }]);
    vi.useRealTimers();
  });

  it('tracks explicit params and debounces the initial service call', async () => {
    vi.useFakeTimers();
    const country = signal('CH');
    const validate = vi.fn(async ({ params }: { params: { country: string; username: string | null } }) =>
      params.country === 'US' ? { kind: 'unavailable' } : null,
    );
    const name = field('David', [asyncValidator({
      debounce: 100,
      params: ({ value }) => ({ country: country(), username: value() }),
      validate,
    })]);

    expect(validate).not.toHaveBeenCalled();
    expect(name.pending()).toBe(true);

    country.set('US');
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(99);
    expect(validate).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(validate).toHaveBeenCalledOnce();
    expect(validate).toHaveBeenCalledWith(expect.objectContaining({
      params: { country: 'US', username: 'David' },
    }));
    expect(name.errors()).toEqual([{ kind: 'unavailable', targetNode: name }]);
    vi.useRealTimers();
  });

  it('does not restart debounce when explicit params remain shallowly equal', async () => {
    vi.useFakeTimers();
    const person = signal({ firstName: 'David', lastName: 'Smith' });
    const validate = vi.fn(async () => null);
    field('profile', [asyncValidator({
      debounce: 100,
      params: () => ({ username: person().firstName }),
      validate,
    })]);

    await vi.advanceTimersByTimeAsync(50);
    person.set({ firstName: 'David', lastName: 'Jones' });
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(50);

    expect(validate).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('does not track signals read only by a parameterized validate callback', async () => {
    const incidental = signal('first');
    const validate = vi.fn(async () => {
      incidental();
      return null;
    });
    field('David', [asyncValidator({
      params: ({ value }) => ({ username: value() }),
      validate,
    })]);

    await settle();
    expect(validate).toHaveBeenCalledOnce();

    incidental.set('second');
    await settle();

    expect(validate).toHaveBeenCalledOnce();
  });

  it('stops tracking dependencies after an asynchronous validator is removed', async () => {
    const dependency = signal('available');
    const validate = vi.fn(async () => dependency() === 'available' ? null : { kind: 'unavailable' });
    const name = field('David', [asyncValidator(validate)]);

    await settle();
    expect(validate).toHaveBeenCalledOnce();

    name.setValidators([]);
    expect(name.errors()).toEqual([]);
    dependency.set('unavailable');
    await settle();

    expect(validate).toHaveBeenCalledOnce();
    expect(name.pending()).toBe(false);
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
    expect(validate).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
