import { Observable, of } from 'rxjs';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { asyncValidator } from './async-validator';
import { required } from './validators/required';

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
    const name = field('David', [asyncValidator(() => of({ kind: 'observableError' }))]);

    await settle();

    expect(name.errors()).toEqual([{ kind: 'observableError', targetNode: name }]);
    expect(name.pending()).toBe(false);
  });

  it('unsubscribes an Observable validator when validation becomes stale', async () => {
    const unsubscribe = vi.fn();
    const validate = vi.fn(() => new Observable<never>(() => unsubscribe));
    const name = field('first', [asyncValidator(validate)]);

    await Promise.resolve();
    name.set('second');

    expect(unsubscribe).toHaveBeenCalledOnce();
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
});
