import { describe, expect, it, vi } from 'vitest';
import { Injector, computed, runInInjectionContext, signal } from '@angular/core';

import { createReactiveWatch, createTrackedRunner } from './create-reactive-watch';

const settle = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('createReactiveWatch', () => {
  it('flushes initial setup once without flushing later notifications or rerunning its stale startup task', async () => {
    const value = signal(0);
    const run = vi.fn((deferCallbacks?: boolean) => ({ value: value(), deferCallbacks }));
    const cleanup = vi.fn();
    const watch = createReactiveWatch({ run, cleanup }, null, true);
    expect(run).not.toHaveBeenCalled();
    watch.flushInitial();
    expect(run).toHaveLastReturnedWith({ value: 0, deferCallbacks: true });
    value.set(1);
    watch.flushInitial();
    expect(run).toHaveBeenCalledTimes(1);
    await settle();
    expect(run).toHaveBeenCalledTimes(2);
    expect(run).toHaveLastReturnedWith({ value: 1, deferCallbacks: false });
    expect(cleanup).toHaveBeenCalledTimes(1);
    watch.destroy();
  });

  it('does not start a deferred watch after its owner is destroyed', async () => {
    const injector = Injector.create({ providers: [] });
    const run = vi.fn();
    const destroy = vi.fn();
    const watch = createReactiveWatch({ run, cleanup: () => {}, destroy }, injector, true);
    injector.destroy();
    watch.flushInitial();
    await settle();
    expect(run).not.toHaveBeenCalled();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('tracks reactive reads, coalesces notifications, and runs cleanup before rerunning', async () => {
    const value = signal(0);
    const events: string[] = [];
    const watch = createReactiveWatch({
      run: () => { events.push(`run:${value()}`); },
      cleanup: () => { events.push('cleanup'); },
    });

    value.set(1);
    value.set(2);
    await settle();

    expect(events).toEqual(['run:0', 'cleanup', 'run:2']);
    watch.destroy();
  });

  it('uses the current injection context DestroyRef and destroys its target', () => {
    const injector = Injector.create({ providers: [] });
    const destroy = vi.fn();
    const cleanup = vi.fn();

    runInInjectionContext(injector, () => createReactiveWatch({ run: () => {}, cleanup, destroy }));
    injector.destroy();

    expect(destroy).toHaveBeenCalledOnce();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('accepts an explicit owning injector', () => {
    const injector = Injector.create({ providers: [] });
    const destroy = vi.fn();
    createReactiveWatch({ run: () => {}, cleanup: () => {}, destroy }, injector);

    injector.destroy();
    expect(destroy).toHaveBeenCalledOnce();
  });

  it('transfers ownership without letting a previous injector destroy the watch', () => {
    const firstInjector = Injector.create({ providers: [] });
    const secondInjector = Injector.create({ providers: [] });
    const destroy = vi.fn();
    const watch = createReactiveWatch({ run: () => {}, cleanup: () => {}, destroy }, null);

    watch.setInjector(firstInjector);
    watch.setInjector(secondInjector);
    firstInjector.destroy();

    expect(destroy).not.toHaveBeenCalled();

    secondInjector.destroy();
    expect(destroy).toHaveBeenCalledOnce();
  });
});

describe('createTrackedRunner', () => {
  it('filters unchanged computed dependencies without losing later notifications', () => {
    const source = signal('Marco');
    const selected = computed(source, { equal: (a, b) => a.toLowerCase() === b.toLowerCase() });
    const target = { callback: null as (() => unknown) | null, notify: vi.fn() };
    const runner = createTrackedRunner(target);
    const read = vi.fn(() => selected());
    expect(runner.run(read)).toBe('Marco');
    source.set('MARCO');
    expect(target.notify).toHaveBeenCalledOnce();
    expect(runner.hasChanges()).toBe(false);
    expect(read).toHaveBeenCalledOnce();
    source.set('Lia');
    expect(target.notify).toHaveBeenCalledTimes(2);
    expect(runner.hasChanges()).toBe(true);
    expect(runner.run(read)).toBe('Lia');
    expect(read).toHaveBeenCalledTimes(2);
    runner.destroy();
  });

  it('tracks callback dependencies and notifies its owner', () => {
    const value = signal(1);
    const target = { callback: null as (() => unknown) | null, notify: vi.fn() };
    const runner = createTrackedRunner(target);

    expect(runner.run(() => value() * 2)).toBe(2);
    value.set(2);
    expect(target.notify).toHaveBeenCalledOnce();

    runner.destroy();
  });
});
