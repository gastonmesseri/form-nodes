import { createWatch, type Watch } from '@angular/core/primitives/signals';
import { DestroyRef, Injector, assertInInjectionContext, inject } from '@angular/core';

export type ReactiveWatchTarget = {
  run(): void;
  cleanup(): void;
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
    watch.destroy();
  });
  watch.run();
  return watch;
};
