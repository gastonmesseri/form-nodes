import { createWatch, type Watch } from '@angular/core/primitives/signals';
import { DestroyRef, Injector, assertInInjectionContext, inject } from '@angular/core';

export type ReactiveWatchTarget = {
  run(): void;
  cleanup(): void;
  destroy?(): void;
};

export type TrackedRunner = {
  run<T>(callback: () => T): T;
  destroy(): void;
};

type TrackedRunnerTarget = {
  callback: (() => unknown) | null;
  notify(): void;
};

const finalizationRegistry = new FinalizationRegistry<Watch>((watch) => watch.destroy());

const getDestroyRef = (injector?: Injector): DestroyRef | null => {
  if (injector) return injector.get(DestroyRef);
  try {
    assertInInjectionContext(createReactiveWatch);
  } catch {
    return null;
  }
  return inject(DestroyRef);
};

export const createReactiveWatch = (
  target: ReactiveWatchTarget,
  injector?: Injector,
): Watch => {
  const targetRef = new WeakRef(target);
  let scheduled = false;
  const watch = createWatch(
    (onCleanup) => {
      const currentTarget = targetRef.deref();
      if (!currentTarget) return;
      onCleanup(() => targetRef.deref()?.cleanup());
      currentTarget.run();
    },
    (currentWatch) => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        currentWatch.run();
      });
    },
    true,
  );
  finalizationRegistry.register(target, watch, watch);
  getDestroyRef(injector)?.onDestroy(() => {
    finalizationRegistry.unregister(watch);
    targetRef.deref()?.destroy?.();
    watch.destroy();
  });
  watch.run();
  return watch;
};

export const createTrackedRunner = (target: TrackedRunnerTarget): TrackedRunner => {
  const targetRef = new WeakRef(target);
  const watch = createWatch(
    () => targetRef.deref()?.callback?.(),
    () => targetRef.deref()?.notify(),
    true,
  );
  finalizationRegistry.register(target, watch, watch);
  return {
    run: <T>(callback: () => T): T => {
      const currentTarget = targetRef.deref();
      if (!currentTarget) return callback();
      let result!: T;
      currentTarget.callback = () => { result = callback(); };
      watch.run();
      currentTarget.callback = null;
      return result;
    },
    destroy: () => {
      finalizationRegistry.unregister(watch);
      watch.destroy();
    },
  };
};
