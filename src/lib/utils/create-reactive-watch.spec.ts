import { describe, expect, it, vi } from 'vitest';
import { Injector, runInInjectionContext, signal } from '@angular/core';

import { createReactiveWatch, createTrackedRunner } from './create-reactive-watch';

const settle = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('createReactiveWatch', () => {
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
