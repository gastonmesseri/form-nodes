import { APP_ID, DestroyRef, ElementRef, computed, inject, signal, type Signal, type WritableSignal } from '@angular/core';

import { getFormNodeName } from './utils/form-node-name';
import type { FormNodeBinding } from '../../types/form-node-binding.type';
import type { DisabledReason } from '../../types/node.type';

type BoundControlEntry = {
  binding: FormNodeBinding | null;
  consumers: Set<WritableSignal<FormNodeBinding | null>>;
};

const boundControls = new WeakMap<HTMLElement, BoundControlEntry>();

const getBoundControlEntry = (element: HTMLElement): BoundControlEntry => {
  let entry = boundControls.get(element);
  if (!entry) {
    entry = { binding: null, consumers: new Set() };
    boundControls.set(element, entry);
  }
  return entry;
};

/** @internal Connects a concrete form-node binding to hooks registered on the same host. */
export const _registerBoundControlBinding = (element: HTMLElement, binding: FormNodeBinding): (() => void) => {
  const entry = getBoundControlEntry(element);
  entry.binding = binding;
  entry.consumers.forEach(consumer => consumer.set(binding));
  return () => {
    if (entry.binding !== binding) return;
    entry.binding = null;
    entry.consumers.forEach(consumer => consumer.set(null));
  };
};

/** @internal Whether a component on this host consumes state through `injectBoundControl()`. */
export const _hasBoundControlConsumer = (element: HTMLElement): boolean => {
  return (boundControls.get(element)?.consumers.size ?? 0) > 0;
};

/** Binding APIs that can supply a universal {@link BoundControl} state facade. */
export type BoundControlSource = 'formNode' | 'formField' | 'formControl' | 'formControlName' | 'ngModel';

/** A validation error normalized across supported Angular form-binding APIs. */
export type BoundControlError = {
  readonly kind: string;
  readonly [property: string]: unknown;
};

/**
 * Read-only state of the form binding attached to a custom-control component.
 *
 * Every member is a signal and remains safe to read when the component is not bound. The current
 * implementation supplies state from `[formNode]`; the source-neutral contract is designed to
 * support Angular's other form-binding APIs without changing custom controls.
 */
export type BoundControl<TValue = unknown> = {
  /** Whether a supported form binding is attached to the component host. */
  readonly connected: Signal<boolean>;
  /** API currently supplying the state, or `null` when the component is not bound. */
  readonly source: Signal<BoundControlSource | null>;
  /** Current committed bound value, or `undefined` when disconnected. */
  readonly value: Signal<TValue | undefined>;
  /** Whether the bound control is disabled. */
  readonly disabled: Signal<boolean>;
  /** Reasons currently disabling the bound control. */
  readonly disabledReasons: Signal<readonly DisabledReason[]>;
  /** Whether the user has changed the bound control. */
  readonly dirty: Signal<boolean>;
  /** Validation errors normalized to objects containing a `kind`. */
  readonly errors: Signal<readonly BoundControlError[]>;
  /** Whether the bound control is hidden by form state. */
  readonly hidden: Signal<boolean>;
  /** Whether the bound control is invalid. */
  readonly invalid: Signal<boolean>;
  /** Effective maximum numeric or date constraint. */
  readonly max: Signal<number | Date | undefined>;
  /** Effective maximum-length constraint. */
  readonly maxLength: Signal<number | undefined>;
  /** Effective minimum numeric or date constraint. */
  readonly min: Signal<number | Date | undefined>;
  /** Effective minimum-length constraint. */
  readonly minLength: Signal<number | undefined>;
  /** Generated name associated with the binding, or `undefined` when disconnected. */
  readonly name: Signal<string | undefined>;
  /** Effective regular-expression patterns. */
  readonly pattern: Signal<readonly RegExp[]>;
  /** Whether validation is currently pending. */
  readonly pending: Signal<boolean>;
  /** Whether the bound control is readonly. */
  readonly readonly: Signal<boolean>;
  /** Whether the bound control requires a non-empty value. */
  readonly required: Signal<boolean>;
  /** Whether the user has interacted with and left the bound control. */
  readonly touched: Signal<boolean>;
};

/**
 * Injects a source-neutral, read-only view of the form state bound to a custom-control component.
 *
 * Call this in a component injection context. When no supported binding exists on the host, the
 * returned signals expose neutral values. Currently `[formNode]` is the only supported source;
 * future `formField`, `formControl`, `formControlName`, and `ngModel` adapters can supply the same
 * interface.
 *
 * ```ts
 * export class DatePicker {
 *   value = model<string | null>(null);
 *   boundControl = injectBoundControl<string | null>();
 * }
 * ```
 */
export const injectBoundControl = <TValue = unknown>(): BoundControl<TValue> => {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const destroyRef = inject(DestroyRef);
  const appId = inject(APP_ID);
  const entry = getBoundControlEntry(element);
  const binding = signal<FormNodeBinding | null>(entry.binding);
  entry.consumers.add(binding);
  destroyRef.onDestroy(() => {
    binding.set(null);
    entry.consumers.delete(binding);
  });
  const node = () => binding()?.node();
  const field = () => node() as ReturnType<typeof node> & {
    max?: Signal<number | Date | undefined>;
    maxLength?: Signal<number | undefined>;
    min?: Signal<number | Date | undefined>;
    minLength?: Signal<number | undefined>;
    pattern?: Signal<readonly RegExp[]>;
  };

  return {
    connected: computed(() => binding() !== null),
    source: computed(() => binding() ? 'formNode' : null),
    value: computed(() => node()?.() as TValue | undefined),
    disabled: computed(() => node()?.$api.disabled() ?? false),
    disabledReasons: computed(() => node()?.$api.disabledReasons() ?? []),
    dirty: computed(() => node()?.$api.dirty() ?? false),
    errors: computed(() => binding()?.errors().map(error => ({ ...error, kind: error.kind })) ?? []),
    hidden: computed(() => node()?.$api.hidden() ?? false),
    invalid: computed(() => node()?.$api.invalid() ?? false),
    max: computed(() => field()?.max?.()),
    maxLength: computed(() => field()?.maxLength?.()),
    min: computed(() => field()?.min?.()),
    minLength: computed(() => field()?.minLength?.()),
    name: computed(() => binding() ? getFormNodeName(binding()!.node(), appId) : undefined),
    pattern: computed(() => field()?.pattern?.() ?? []),
    pending: computed(() => node()?.$api.pending() ?? false),
    readonly: computed(() => node()?.$api.readonly() ?? false),
    required: computed(() => node()?.$api.required() ?? false),
    touched: computed(() => node()?.$api.touched() ?? false),
  };
};
