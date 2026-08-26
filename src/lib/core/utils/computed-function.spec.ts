import { computed, signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { computedFunction } from './computed-function';

describe('computedFunction', () => {
  it('memoizes a computed independently for each argument combination', () => {
    const source = signal(2);
    const calculate = vi.fn((multiplier: number) => source() * multiplier);
    const select = computedFunction(calculate);

    expect(select(2)).toBe(4);
    expect(select(2)).toBe(4);
    expect(select(3)).toBe(6);
    expect(calculate).toHaveBeenCalledTimes(2);

    source.set(4);
    expect(select(2)).toBe(8);
    expect(select(3)).toBe(12);
    expect(calculate).toHaveBeenCalledTimes(4);
  });

  it('uses result equality to avoid propagating unchanged selections', () => {
    const source = signal({ selected: 1, unrelated: 1 });
    const select = computedFunction(() => ({ selected: source().selected }), {
      equal: (left, right) => left.selected === right.selected,
    });
    let downstreamRuns = 0;
    const downstream = computed(() => {
      downstreamRuns++;
      return select().selected;
    });

    expect(downstream()).toBe(1);
    source.set({ selected: 1, unrelated: 2 });
    expect(downstream()).toBe(1);
    expect(downstreamRuns).toBe(1);

    source.set({ selected: 2, unrelated: 2 });
    expect(downstream()).toBe(2);
    expect(downstreamRuns).toBe(2);
  });

  it('evicts the least recently used argument combination at the configured limit', () => {
    const calculate = vi.fn((value: string) => value);
    const select = computedFunction(calculate, { max: 2 });

    select('first');
    select('second');
    select('first');
    select('third');
    select('second');

    expect(calculate).toHaveBeenCalledTimes(4);
  });

  it('supports custom argument equality and disabling the cache', () => {
    const cachedCalculation = vi.fn((value: { id: number }) => value.id);
    const cached = computedFunction(cachedCalculation, {
      argsEqual: ([left], [right]) => left.id === right.id,
    });
    const uncachedCalculation = vi.fn((value: number) => value);
    const uncached = computedFunction(uncachedCalculation, { max: 0 });

    expect(cached({ id: 1 })).toBe(1);
    expect(cached({ id: 1 })).toBe(1);
    expect(cachedCalculation).toHaveBeenCalledOnce();
    uncached(1);
    uncached(1);
    expect(uncachedCalculation).toHaveBeenCalledTimes(2);
  });
});
