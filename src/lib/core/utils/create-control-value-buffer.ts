import { computed, signal, type Signal } from '@angular/core';

import type { ControlDebounce } from '../types/node.type';

export type ControlValueBuffer<TValue, TControlValue = TValue> = {
  readonly controlValue: Signal<TValue>;
  readonly debouncing: Signal<boolean>;
  cancel(): void;
  flush(): void;
  set(value: TControlValue): void;
};

export const createControlValueBuffer = <TValue, TControlValue = TValue>(
  value: Signal<TValue>,
  debounce: Signal<ControlDebounce | undefined>,
  commitValue: (value: TControlValue) => void,
  markDirty: () => void,
): ControlValueBuffer<TValue, TControlValue> => {
  const pendingValue = signal(value() as unknown as TControlValue);
  const pending = signal(false);
  let baseline = value();
  const state = {
    timer: null as ReturnType<typeof setTimeout> | null,
    controller: null as AbortController | null,
    cancel: () => {
      if (state.timer !== null) clearTimeout(state.timer);
      state.controller?.abort();
      state.timer = null;
      state.controller = null;
      pending.set(false);
    },
    commit: () => {
      if (!pending() || !Object.is(value(), baseline)) {
        state.cancel();
        return;
      }
      const next = pendingValue();
      state.cancel();
      commitValue(next);
    },
    resolve: (controller: AbortController) => {
      if (state.controller === controller && !controller.signal.aborted) state.commit();
    },
    reject: (controller: AbortController) => {
      if (state.controller === controller) state.cancel();
    },
  };
  const stateRef = new WeakRef(state);
  const isCurrent = computed(() => pending() && Object.is(value(), baseline));
  const set = (next: TControlValue) => {
    state.cancel();
    baseline = value();
    pendingValue.set(next);
    markDirty();
    const strategy = debounce() ?? 0;
    if (Object.is(next, baseline) || (typeof strategy === 'number' && (!Number.isFinite(strategy) || strategy <= 0))) {
      commitValue(next);
      return;
    }
    pending.set(true);
    if (strategy === 'blur') return;
    if (typeof strategy === 'function') {
      const controller = new AbortController();
      state.controller = controller;
      let completion: void | PromiseLike<void>;
      try {
        completion = strategy(controller.signal);
      } catch (error) {
        state.cancel();
        throw error;
      }
      if (completion === undefined) {
        state.commit();
        return;
      }
      Promise.resolve(completion).then(
        () => stateRef.deref()?.resolve(controller),
        () => stateRef.deref()?.reject(controller),
      );
      return;
    }
    state.timer = setTimeout(() => stateRef.deref()?.commit(), strategy);
  };
  return {
    controlValue: computed(() => isCurrent() ? pendingValue() as unknown as TValue : value()),
    debouncing: isCurrent,
    cancel: state.cancel,
    flush: state.commit,
    set,
  };
};
