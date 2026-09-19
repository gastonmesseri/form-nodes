import { isFormNode } from '@ngblocks/form-nodes';
import { createWatch } from '@angular/core/primitives/signals';
import { DestroyRef, isSignal, untracked, type Injector, type WritableSignal } from '@angular/core';

type WatchOptions = { injector: Injector; onDestroy: () => void };

type NodeBridge = {
  _value(): unknown;
  set(value: unknown): void;
  _watchCommittedValue(callback: (value: unknown) => void, options: WatchOptions): () => void;
};

export const createQueryParamSource = (source: unknown, key: string) => {
  const invalid = () => new Error(`Query parameter "${key}" requires a form node or writable signal.`);
  if (isFormNode(source)) {
    const api = source.$api as unknown as NodeBridge;
    let previous = api._value();
    return {
      read: () => api._value(),
      write(value: unknown) {
        api.set(value);
        previous = api._value();
      },
      watch(callback: () => void, options: WatchOptions) {
        previous = api._value();
        return api._watchCommittedValue((value) => {
          if (Object.is(value, previous)) return;
          previous = value;
          callback();
        }, options);
      },
    };
  }
  if (!isSignal(source) || typeof (source as WritableSignal<unknown>).set !== 'function') throw invalid();
  const signal = source as WritableSignal<unknown>;
  let acknowledge: (() => void) | undefined;
  return {
    read: () => signal(),
    write(value: unknown) {
      signal.set(value);
      // Consume this URL write without echoing it, including custom signal equality.
      acknowledge?.();
    },
    watch(callback: () => void, options: WatchOptions) {
      let initial = true;
      let importing = false;
      let closed = false;
      let releaseOwner: (() => void) | undefined;
      const watch = createWatch(() => {
        signal();
        if (!initial && !importing) untracked(callback);
        initial = false;
      }, () => {
        queueMicrotask(() => {
          if (!closed) watch.run();
        });
      }, true);
      const stop = () => {
        if (closed) return;
        closed = true;
        acknowledge = undefined;
        watch.destroy();
        releaseOwner?.();
        options.onDestroy();
      };
      try {
        releaseOwner = options.injector.get(DestroyRef).onDestroy(stop);
        watch.run();
        acknowledge = () => {
          importing = true;
          try { watch.run(); } finally { importing = false; }
        };
      } catch (error) {
        stop();
        throw error;
      }
      return stop;
    },
  };
};
