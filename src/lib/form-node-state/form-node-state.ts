import { APP_ID, DestroyRef, ElementRef, computed, inject, type Signal } from '@angular/core';

import { injectNgModelControlStateAdapter } from './adapters/ng-model';
import { injectFormNodeControlStateAdapter } from './adapters/form-node';
import { injectFormFieldControlStateAdapter } from './adapters/form-field';
import { injectFormControlStateAdapter } from './adapters/form-control';
import { injectFormControlNameStateAdapter } from './adapters/form-control-name';

/** Binding APIs that can supply a universal {@link ControlState} state facade. */
export type ControlStateSource = 'formNode' | 'formField' | 'formControl' | 'formControlName' | 'ngModel';

/** A validation error normalized across supported Angular form-binding APIs. */
export type ControlStateError = {
  readonly kind: string;
  readonly [property: string]: unknown;
};

/** A source-neutral explanation for why the bound control is disabled. */
export type ControlStateDisabledReason = {
  readonly message?: string;
};

/**
 * Read-only state of the form binding attached to a custom-control component.
 *
 * Every member is a signal and remains safe to read when the component is not bound. The current
 * implementation supplies state from every supported Angular forms binding through one stable
 * custom-control API.
 */
export type ControlState<TValue = unknown> = {
  /** Whether a supported form binding is attached to the component host. */
  readonly connected: Signal<boolean>;
  /** API currently supplying the state, or `null` when the component is not bound. */
  readonly source: Signal<ControlStateSource | null>;
  /** Current committed bound value, independent of Form Nodes node equality and pending input, or `undefined` when disconnected. */
  readonly value: Signal<TValue | undefined>;
  /** Whether the bound control is disabled. */
  readonly disabled: Signal<boolean>;
  /** Reasons currently disabling the bound control. */
  readonly disabledReasons: Signal<readonly ControlStateDisabledReason[]>;
  /** Whether the user has changed the bound control. */
  readonly dirty: Signal<boolean>;
  /** Validation errors normalized to objects containing a `kind`. */
  readonly errors: Signal<readonly ControlStateError[]>;
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
  /** Marks the bound control touched. Does nothing when no supported binding is connected. */
  markAsTouched(): void;
};

/**
 * Returns a source-neutral, read-only view of the form state bound to a custom Angular component.
 *
 * **Works with `[formNode]`, `[formField]`, `[formControl]`, `[formControlName]`, and `[(ngModel)]`.**
 * **Implement your custom control's state UI once, regardless of which supported binding its caller uses.**
 * The hook automatically selects the host binding and exposes the same signal-based interface for
 * disabled, touched, dirty, pending, errors, and other state. `markAsTouched()` also targets that binding.
 * No manual adapter selection is needed, and Angular forms do not need to use Form Nodes primitives.
 *
 * This is a state integration utility; retain the value contract required by the chosen forms API,
 * such as a value model or ControlValueAccessor. Metadata unavailable from a source uses neutral
 * defaults; Reactive Forms and ngModel do not expose required or constraint metadata through this hook.
 *
 * This hook must be called while constructing a custom Angular component and from an Angular
 * injection context. It reads the forms binding attached to that component's host element. Do not
 * call it from ordinary application functions, services, directives, or outside dependency
 * injection. When no supported binding exists on the component host, the returned signals expose
 * safe neutral values.
 *
 * ```ts
 * export class DatePicker {
 *   value = model<string | null>(null);
 *
 *   formNodeState = useFormNodeState();
 *
 *   shouldDisplayRequiredAsterisk = computed(() => this.formNodeState.required());
 *
 *   isDisabled = computed(() => this.formNodeState.disabled());
 *
 *   visibleErrors = computed(() => {
 *     return this.formNodeState.touched() ? this.formNodeState.errors() : [];
 *   });
 * }
 * ```
 *
 * @throws When called outside an Angular injection context.
 */
export const useFormNodeState = <TValue = unknown>(): ControlState<TValue> => {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const destroyRef = inject(DestroyRef);
  const appId = inject(APP_ID);
  const adapters = [
    injectFormNodeControlStateAdapter<TValue>(element, destroyRef, appId),
    injectFormFieldControlStateAdapter<TValue>(),
    injectFormControlStateAdapter<TValue>(),
    injectFormControlNameStateAdapter<TValue>(),
    injectNgModelControlStateAdapter<TValue>(),
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
    markAsTouched() {
      active()?.markAsTouched();
    },
  };
};
