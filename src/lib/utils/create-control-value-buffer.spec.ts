import { computed, signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import type { ControlDebounce } from '../types/node.type';
import { createControlValueBuffer } from './create-control-value-buffer';

const deferred = () => {
  let resolve!: () => void;
  let reject!: () => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

describe('createControlValueBuffer', () => {
  it('commits immediately for non-positive strategies and synchronous functions', () => {
    const value = signal('initial');
    const strategy = signal<ControlDebounce>(0);
    const markDirty = vi.fn();
    const buffer = createControlValueBuffer(value, strategy, value.set, markDirty);

    buffer.set('zero');
    expect(value()).toBe('zero');

    strategy.set(() => {});
    buffer.set('function');
    expect(value()).toBe('function');
    expect(buffer.debouncing()).toBe(false);
    expect(markDirty).toHaveBeenCalledTimes(2);
  });

  it('aborts replaced asynchronous work and commits only the latest resolution', async () => {
    const value = signal('initial');
    const first = deferred();
    const second = deferred();
    const completions = [first, second];
    const signals: AbortSignal[] = [];
    const strategy = signal<ControlDebounce>((abortSignal) => {
      signals.push(abortSignal);
      return completions.shift()!.promise;
    });
    const buffer = createControlValueBuffer(value, strategy, value.set, () => {});

    buffer.set('first');
    buffer.set('second');

    expect(signals[0]!.aborted).toBe(true);
    expect(signals[1]!.aborted).toBe(false);

    first.resolve();
    await first.promise;
    expect(value()).toBe('initial');

    second.resolve();
    await second.promise;
    expect(value()).toBe('second');
    expect(buffer.debouncing()).toBe(false);
  });

  it('discards rejected asynchronous work', async () => {
    const value = signal('initial');
    const completion = deferred();
    const strategy = computed<ControlDebounce>(() => () => completion.promise);
    const buffer = createControlValueBuffer(value, strategy, value.set, () => {});

    buffer.set('rejected');
    completion.reject();
    await expect(completion.promise).rejects.toBeUndefined();
    await Promise.resolve();

    expect(value()).toBe('initial');
    expect(buffer.controlValue()).toBe('initial');
    expect(buffer.debouncing()).toBe(false);
  });

  it('cancels and rethrows synchronous strategy failures', () => {
    const value = signal('initial');
    const failure = new Error('debounce failed');
    const strategy = computed<ControlDebounce>(() => () => { throw failure; });
    const buffer = createControlValueBuffer(value, strategy, value.set, () => {});

    expect(() => buffer.set('pending')).toThrow(failure);
    expect(value()).toBe('initial');
    expect(buffer.debouncing()).toBe(false);
  });
});
