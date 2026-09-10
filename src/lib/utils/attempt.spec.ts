import { computed, signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { attempt } from './attempt';

describe('attempt', () => {
  it.each([null, undefined, false, 0, '', { value: 1 }])('preserves a successful result: %s', (value) => {
    const operation = vi.fn(() => value);
    expect(attempt(operation, 'Fallback')).toBe(value);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('returns the fallback itself without invoking it when the operation throws', () => {
    const fallback = vi.fn();
    const operation = vi.fn(() => { throw 'Failed'; });
    expect(attempt(operation, fallback)).toBe(fallback);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('preserves signal tracking and recovers reactively after an exception', () => {
    const readable = signal(false);
    const value = signal('First');
    const operation = vi.fn(() => {
      if (!readable()) throw new Error('Unavailable');
      return value();
    });
    const result = computed(() => attempt(operation, 'Fallback'));
    expect(result()).toBe('Fallback');
    expect(operation).toHaveBeenCalledTimes(1);
    readable.set(true);
    expect(result()).toBe('First');
    value.set('Updated');
    expect(result()).toBe('Updated');
    readable.set(false);
    expect(result()).toBe('Fallback');
    expect(operation).toHaveBeenCalledTimes(4);
    value.set('Unread');
    expect(result()).toBe('Fallback');
    expect(operation).toHaveBeenCalledTimes(4);
  });

  it('returns a promise unchanged and does not catch its rejection', async () => {
    const error = new Error('Async failure');
    const promise = Promise.reject(error);
    const result = attempt(() => promise, 'Fallback');
    expect(result).toBe(promise);
    await expect(result).rejects.toBe(error);
  });
});
