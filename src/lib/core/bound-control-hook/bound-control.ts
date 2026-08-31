import { APP_ID, DestroyRef, ElementRef, computed, inject, type Signal } from '@angular/core';

import { injectFormNodeBoundControl } from './adapters/form-node';
import { injectFormControlBoundControl } from './adapters/form-control';
import type { DisabledReason } from '../types/node.type';

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
 * implementation supplies state from `[formNode]` and `[formControl]`; the source-neutral contract
 * is designed to support Angular's other form-binding APIs without changing custom controls.
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
 * returned signals expose neutral values. Future `formField`, `formControlName`, and `ngModel`
 * adapters can supply the same interface.
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
  const adapters = [
    injectFormNodeBoundControl<TValue>(element, destroyRef, appId),
    injectFormControlBoundControl<TValue>(),
  ];
  const active = computed(() => adapters.find(adapter => adapter.connected()) ?? null);

  return {
    connected: computed(() => active() !== null),
    source: computed(() => active()?.source ?? null),
    value: computed(() => active()?.value()),
    disabled: computed(() => active()?.disabled() ?? false),
    disabledReasons: computed(() => active()?.disabledReasons() ?? []),
    dirty: computed(() => active()?.dirty() ?? false),
    errors: computed(() => active()?.errors() ?? []),
    hidden: computed(() => active()?.hidden() ?? false),
    invalid: computed(() => active()?.invalid() ?? false),
    max: computed(() => active()?.max()),
    maxLength: computed(() => active()?.maxLength()),
    min: computed(() => active()?.min()),
    minLength: computed(() => active()?.minLength()),
    name: computed(() => active()?.name()),
    pattern: computed(() => active()?.pattern() ?? []),
    pending: computed(() => active()?.pending() ?? false),
    readonly: computed(() => active()?.readonly() ?? false),
    required: computed(() => active()?.required() ?? false),
    touched: computed(() => active()?.touched() ?? false),
  };
};
