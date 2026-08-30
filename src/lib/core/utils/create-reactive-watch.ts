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

export type ReactiveWatchRef = {
  destroy(): void;
  setInjector(injector: Injector | undefined): void;
};

type TrackedRunnerTarget = {
  callback: (() => unknown) | null;
  notify(): void;
};

const finalizationRegistry = new FinalizationRegistry<Watch>(watch => watch.destroy());

const getCurrentInjector = (): Injector | undefined => {
  try {
    assertInInjectionContext(createReactiveWatch);
  } catch {
    return undefined;
  }
  return inject(Injector);
};

export const createReactiveWatch = (
  target: ReactiveWatchTarget,
  injector?: Injector | null,
): ReactiveWatchRef => {
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
  let destroyed = false;
  let owner: Injector | undefined;
  let ownerVersion = 0;
  finalizationRegistry.register(target, watch, watch);
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    ownerVersion++;
    finalizationRegistry.unregister(watch);
    targetRef.deref()?.destroy?.();
    watch.destroy();
  };
  const setInjector = (nextInjector: Injector | undefined) => {
    if (destroyed || nextInjector === owner) return;
    owner = nextInjector;
    const version = ++ownerVersion;
    nextInjector?.get(DestroyRef).onDestroy(() => {
      if (ownerVersion === version) destroy();
    });
  };
  setInjector(injector === null ? undefined : injector ?? getCurrentInjector());
  watch.run();
  return { destroy, setInjector };
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
