import { computed, signal, type DestroyRef, type Signal, type WritableSignal } from '@angular/core';

import type { InternalNode } from '../../types/node.type';
import type { ControlStateAdapter } from '../control-state-adapter';
import { getFormNodeName } from '../../form-node/utils/form-node-name';
import type { FormNodeBinding } from '../../types/form-node-binding.type';

type FormNodeEntry = {
  binding: FormNodeBinding | null;
  consumers: Set<WritableSignal<FormNodeBinding | null>>;
};

const entries = new WeakMap<HTMLElement, FormNodeEntry>();

const getEntry = (element: HTMLElement): FormNodeEntry => {
  let entry = entries.get(element);
  if (!entry) {
    entry = { binding: null, consumers: new Set() };
    entries.set(element, entry);
  }
  return entry;
};

export const injectFormNodeControlStateAdapter = <TValue>(element: HTMLElement, destroyRef: DestroyRef, appId: string): ControlStateAdapter<TValue> => {
  const entry = getEntry(element);
  const binding = signal<FormNodeBinding | null>(entry.binding);
  entry.consumers.add(binding);
  destroyRef.onDestroy(() => {
    binding.set(null);
    entry.consumers.delete(binding);
  });
  const node = () => binding()!.node();
  const field = () => {
    return node() as ReturnType<typeof node> & {
      max?: Signal<number | Date | undefined>;
      maxLength?: Signal<number | undefined>;
      min?: Signal<number | Date | undefined>;
      minLength?: Signal<number | undefined>;
      pattern?: Signal<readonly RegExp[]>;
    };
  };
  return {
    source: 'formNode',
    connected: computed(() => binding() !== null),
    value: computed(() => (node() as InternalNode).$api._value() as TValue),
    disabled: computed(() => node().$api.disabled()),
    disabledReasons: computed(() => node().$api.disabledReasons().map(({ message }) => message === undefined ? {} : { message })),
    dirty: computed(() => node().$api.dirty()),
    errors: computed(() => binding()!.errors().map(error => ({ ...error, kind: error.kind }))),
    hidden: computed(() => node().$api.hidden()),
    invalid: computed(() => node().$api.invalid()),
    max: computed(() => field().max?.() ?? undefined),
    maxLength: computed(() => field().maxLength?.() ?? undefined),
    min: computed(() => field().min?.() ?? undefined),
    minLength: computed(() => field().minLength?.() ?? undefined),
    name: computed(() => getFormNodeName(node(), appId)),
    pattern: computed(() => {
      const pattern = field().pattern;
      /* v8 ignore next -- V8 reports the exercised Signal call as an uncovered branch. */
      return pattern === undefined ? [] : pattern();
    }),
    pending: computed(() => node().$api.pending()),
    readonly: computed(() => node().$api.readonly()),
    required: computed(() => node().$api.required()),
    touched: computed(() => node().$api.touched()),
    markAsTouched() {
      node().$api.markAsTouched();
    },
  };
};

export const registerControlStateBinding = (element: HTMLElement, binding: FormNodeBinding): (() => void) => {
  const entry = getEntry(element);
  entry.binding = binding;
  entry.consumers.forEach(consumer => consumer.set(binding));
  return () => {
    if (entry.binding !== binding) return;
    entry.binding = null;
    entry.consumers.forEach(consumer => consumer.set(null));
  };
};

export const hasControlStateConsumer = (element: HTMLElement): boolean => {
  return (entries.get(element)?.consumers.size ?? 0) > 0;
};
