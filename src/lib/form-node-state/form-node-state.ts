import { Validators } from '@angular/forms';
import { APP_ID, DestroyRef, ElementRef, computed, effect, inject, untracked, type Signal } from '@angular/core';

import { required } from '../validation/validators/required';
import { computedFunction } from '../utils/computed-function';
import { injectNgModelControlStateAdapter } from './adapters/ng-model';
import type { ValidationErrorMap } from '../validation/validation.type';
import { injectFormControlStateAdapter } from './adapters/form-control';
import { injectFormNodeControlStateAdapter } from './adapters/form-node';
import { injectFormFieldControlStateAdapter } from './adapters/form-field';
import { injectFormControlNameStateAdapter } from './adapters/form-control-name';
import { normalizeValidationResult } from '../validation/utils/normalize-validation-result';
import { ERROR_QUERY_CACHE_SIZE, VALIDATOR_QUERY_CACHE_SIZE } from '../utils/node-query-cache';
import { useClosestFormState, type ClosestFormState } from '../form-node/use-closest-form-state';

/** Binding APIs that can supply a universal {@link ControlState} state facade. */
export type ControlStateSource = 'formNode' | 'formField' | 'formControl' | 'formControlName' | 'ngModel';

/** A validation error normalized across supported Angular form-binding APIs. */
export type ControlStateError = {
  readonly kind: string;
  readonly [property: string]: unknown;
};

/** Errors a custom control may contribute without targeting another control. */
export type ControlError = ControlStateError & {
  readonly message?: string;
  readonly targetNode?: never;
  readonly fieldTree?: never;
  readonly formField?: never;
  readonly formNode?: never;
};

/** Reactive error contribution configured by a custom-control component. */
export type FormNodeStateOptions = {
  /**
   * Contributes component-owned errors to the current binding. Strings become kind 'custom'.
   * null, undefined, void, and [] mean no errors. Reads track signal dependencies, even if the
   * bound value stays unchanged. Read local control state, never the resulting state.errors().
   * Returning no errors removes only this contribution; destruction and rebinding clean it up.
   * CVAs using Angular 22 Signal Forms also need provideFormNodeStateErrors().
   *
   * **Default:** No component-owned error contribution.
   *
   * ```ts
   * import { Component } from '@angular/core';
   * import { model } from '@angular/core';
   *
   * @Component({
   *   selector: 'name-control',
   *   template: '',
   * })
   * export class NameControl {
   *   value = model('');
   *
   *   state = useFormNodeState({
   *     errors: () => {
   *       return this.value() === '?'
   *         ? { kind: 'incomplete' }
   *         : null;
   *     },
   *   });
   * }
   * ```
   */
  errors?: () => ControlError | string | null | undefined | void | readonly (ControlError | string)[];
};

/** A source-neutral explanation for why the bound control is disabled. */
export type ControlStateDisabledReason = {
  readonly message?: string;
};

/**
 * Read-only state of the form binding attached to a custom-control component.
 *
 * State properties are signals; query and interaction methods remain safe when the component is not bound. The current
 * implementation supplies state from every supported Angular forms binding through one stable
 * custom-control API.
 */
export type ControlState<TValue = unknown> = {
  /**
   * Nearest form submission state and optional Form Nodes API; independent of the host control connection.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.form.submitted();
   *   }
   * }
   * ```
   */
  readonly form: ClosestFormState;
  /**
   * Shortcut to form.submitted: whether the nearest form recorded an attempt, including an invalid one. The same readonly signal; false without a supported form.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.formSubmitted();
   *   }
   * }
   * ```
   */
  readonly formSubmitted: Signal<boolean>;
  /**
   * Whether a supported form binding is attached to the component host.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.connected();
   *   }
   * }
   * ```
   */
  readonly connected: Signal<boolean>;
  /**
   * API currently supplying the state, or `null` when the component is not bound.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.source();
   *   }
   * }
   * ```
   */
  readonly source: Signal<ControlStateSource | null>;
  /**
   * Current committed bound value, independent of Form Nodes node equality and pending input, or `undefined` when disconnected.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.value();
   *   }
   * }
   * ```
   */
  readonly value: Signal<TValue | undefined>;
  /**
   * Whether the bound control is disabled.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.disabled();
   *   }
   * }
   * ```
   */
  readonly disabled: Signal<boolean>;
  /**
   * Reasons currently disabling the bound control.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.disabledReasons();
   *   }
   * }
   * ```
   */
  readonly disabledReasons: Signal<readonly ControlStateDisabledReason[]>;
  /**
   * Whether the user has changed the bound control.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.dirty();
   *   }
   * }
   * ```
   */
  readonly dirty: Signal<boolean>;
  /**
   * Validation errors normalized to objects containing a `kind`.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.errors();
   *   }
   * }
   * ```
   */
  readonly errors: Signal<readonly ControlStateError[]>;
  /**
   * Whether the bound control is hidden by form state.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.hidden();
   *   }
   * }
   * ```
   */
  readonly hidden: Signal<boolean>;
  /**
   * Whether the bound control is invalid.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.invalid();
   *   }
   * }
   * ```
   */
  readonly invalid: Signal<boolean>;
  /**
   * Effective maximum numeric or date constraint. Angular control bindings read the host MaxValidator input.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.max();
   *   }
   * }
   * ```
   */
  readonly max: Signal<number | Date | undefined>;
  /**
   * Effective maximum-length constraint, including the host Angular MaxLengthValidator input.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.maxLength();
   *   }
   * }
   * ```
   */
  readonly maxLength: Signal<number | undefined>;
  /**
   * Effective minimum numeric or date constraint. Angular control bindings read the host MinValidator input.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.min();
   *   }
   * }
   * ```
   */
  readonly min: Signal<number | Date | undefined>;
  /**
   * Effective minimum-length constraint, including the host Angular MinLengthValidator input.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.minLength();
   *   }
   * }
   * ```
   */
  readonly minLength: Signal<number | undefined>;
  /**
   * Generated name associated with the binding, or `undefined` when disconnected.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.name();
   *   }
   * }
   * ```
   */
  readonly name: Signal<string | undefined>;
  /**
   * Effective regular-expression patterns. Angular PatternValidator strings are anchored; RegExp objects retain their flags and identity.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.pattern();
   *   }
   * }
   * ```
   */
  readonly pattern: Signal<readonly RegExp[]>;
  /**
   * Whether validation is currently pending.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.pending();
   *   }
   * }
   * ```
   */
  readonly pending: Signal<boolean>;
  /**
   * Whether the bound control is readonly.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.readonly();
   *   }
   * }
   * ```
   */
  readonly readonly: Signal<boolean>;
  /**
   * Whether the bound control requires a non-empty value. For Reactive Forms and ngModel,
   * recognizes directly registered Angular Validators.required / Validators.requiredTrue and an active required
   * directive on the same host. Reads rule presence even when the current value is valid or
   * disabled. Also true while the bound control has an own normalized error with kind `required` or `requiredTrue`,
   * on any supported source. Arbitrary composed validators are not executed to discover this state.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.required();
   *   }
   * }
   * ```
   */
  readonly required: Signal<boolean>;
  /**
   * Whether the user has interacted with and left the bound control.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readState() {
   *     return this.state.touched();
   *   }
   * }
   * ```
   */
  readonly touched: Signal<boolean>;
  /**
   * Whether the current normalized error list contains an exact, case-sensitive kind.
   * Suggests registered error kinds while accepting any custom string.
   * Returns false when absent or disconnected, regardless of an error payload's truthiness.
   * Queries only errors() and does not traverse child paths or explicitly trigger validation.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   showError() {
   *     return (
   *       this.state.touched() &&
   *       this.state.hasError('required')
   *     );
   *   }
   * }
   * ```
   *
   * @reactive Memoizes each error kind in a bounded cache and tracks the current binding's errors.
   * Unchanged results do not propagate to dependent computations.
   * @param kind Error kind as exposed by errors(); names are not translated between forms APIs.
   */
  hasError(kind: keyof ValidationErrorMap | (string & {})): boolean;
  /**
   * Returns the first normalized error with an exact, case-sensitive kind, or undefined when
   * absent or disconnected. Returns the same object as errors(), including kind and details.
   * Suggests registered error kinds while accepting any custom string.
   * Queries only errors() and does not traverse child paths or explicitly trigger validation.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readError() {
   *     return this.state.getError('required');
   *   }
   * }
   * ```
   *
   * @reactive Memoizes each error kind in a bounded cache and tracks the current binding's errors.
   * Unchanged results do not propagate to dependent computations; error objects use reference equality.
   * @param kind Error kind as exposed by errors(); Angular uses minlength, Form Nodes uses minLength.
   */
  getError(kind: keyof ValidationErrorMap | (string & {})): ControlStateError | undefined;
  /**
   * Queries a known rule or a validator function reference on the active binding.
   * The exported Form Nodes `required` and Angular `Validators.required` are equivalent semantic
   * queries: both return required(), including conditional rules, requiredTrue obligations, and active own required errors.
   * Other functions use direct registration identity: Form Nodes checks its configured validators;
   * Reactive Forms and ngModel check synchronous and asynchronous validator references.
   * Angular Signal Forms cannot answer arbitrary reference queries and returns undefined.
   *
   * Returns undefined for non-functions or when disconnected. A supported reference query returns
   * false when absent, including functions from another forms library. Factories such as
   * required('Message') or Validators.min(3) produce distinct functions; retain the registered reference.
   * By default, does not execute validators or resolve compositions. With [formNode],
   * { resolve: true } delegates to the node's resolved query, which may run synchronous validators
   * and tracks composition dependencies using the shared validation evaluation. It does not start
   * async validation. Angular bindings retain reference semantics because public composition
   * resolution is unavailable. The two required-export queries are unchanged by this option.
   * No Angular internals are inspected.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   readRule() {
   *     return this.state.hasValidator(required);
   *   }
   * }
   * ```
   *
   * @reactive Memoizes by validator reference and normalized resolve boolean in a bounded cache.
   * Unchanged results do not propagate to dependent computations. Tracks the active binding and its rules. Angular control events update queries;
   * silent registration changes are reconciled after rendering. Use updateValueAndValidity()
   * after changing Angular validators as usual. Equivalent required queries track required().
   * @param validator A known required export or the original validator function reference.
   * @param options Resolve synchronous compositions for [formNode] only; defaults to false.
   */
  hasValidator(validator: unknown, options?: { resolve?: boolean }): boolean | undefined;
  /**
   * Marks the bound control touched. Does nothing when no supported binding is connected.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   selector: 'status-control',
   *   template: ``,
   * })
   * export class StatusControl {
   *   state = useFormNodeState<string>();
   *
   *   onBlur() {
   *     this.state.markAsTouched();
   *   }
   * }
   * ```
   */
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
 * Pass an errors callback to contribute component-owned validation errors. It accepts an error
 * with kind, a message string, a readonly array, or null/undefined/void. Contributions follow the
 * current binding and clean up on destruction. Angular 22 Signal Forms CVAs additionally require
 * provideFormNodeStateErrors(); other supported bindings register contributions directly.
 *
 * This is a state integration utility; retain the value contract required by the chosen forms API,
 * such as a value model or ControlValueAccessor. Metadata unavailable from a source uses neutral
 * defaults. Reactive Forms and ngModel recognize Angular Validators.required / requiredTrue and
 * standard validator directives on the host. Numeric, length, and pattern metadata comes from
 * those directives; parameters hidden inside validator functions are not inferred.
 *
 * This hook must be called while constructing a custom Angular component and from an Angular
 * injection context. It reads the forms binding attached to that component's host element. Do not
 * call it from ordinary application functions, services, directives, or outside dependency
 * injection. When no supported binding exists on the component host, the returned signals expose
 * safe neutral values.
 *
 * ```ts
 * import { Component } from '@angular/core';
 * import { model } from '@angular/core';
 *
 * @Component({
 *   selector: 'name-control',
 *   template: `
 *     <input
 *       [value]="value()"
 *       [disabled]="state.disabled()"
 *       (input)="onInput($event)"
 *       (blur)="state.markAsTouched()"
 *     />
 *   `,
 * })
 * export class NameControl {
 *   value = model<string | null>(null);
 *
 *   state = useFormNodeState<string | null>();
 *
 *   onInput(event: Event) {
 *     const input =
 *       event.target as HTMLInputElement;
 *     this.value.set(input.value);
 *   }
 * }
 * ```
 *
 * @reactive The optional errors callback tracks signal reads and memoizes its normalized result.
 * @param options Optional component-owned reactive errors, combined with binding validation.
 * @throws When called outside an Angular injection context, or when contributing errors to an
 * unsupported Angular Signal Forms host (requires Angular 22+, CVA, and provideFormNodeStateErrors()).
 */
export const useFormNodeState = <TValue = unknown>(options?: FormNodeStateOptions): ControlState<TValue> => {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const destroyRef = inject(DestroyRef);
  const appId = inject(APP_ID);
  const form = useClosestFormState();
  const adapters = [
    injectFormNodeControlStateAdapter<TValue>(element, destroyRef, appId),
    injectFormFieldControlStateAdapter<TValue>(),
    injectFormControlStateAdapter<TValue>(),
    injectFormControlNameStateAdapter<TValue>(),
    injectNgModelControlStateAdapter<TValue>(),
  ];
  const active = computed(() => adapters.find(adapter => adapter.connected()) ?? null);
  const evaluateErrors = options?.errors;
  if (evaluateErrors) {
    const source = computed(() => normalizeValidationResult(evaluateErrors()).map(error => ({ ...error })));
    effect((onCleanup) => {
      const adapter = active();
      if (adapter) onCleanup(adapter.registerErrors(source));
    });
    effect(() => {
      const adapter = active();
      if (!adapter) return;
      source();
      untracked(() => adapter.refreshErrors?.());
    });
  }
  const errors = computed(() => active()?.errors() ?? []);
  const hasError = computedFunction((kind: string) => {
    return errors().some(error => error.kind === kind);
  }, { max: ERROR_QUERY_CACHE_SIZE });
  const getError = computedFunction((kind: string) => {
    return errors().find(error => error.kind === kind);
  }, { max: ERROR_QUERY_CACHE_SIZE });
  const requiredState = computed(() => (active()?.required() ?? false) || hasError('required') || hasError('requiredTrue'));
  const hasValidator = computedFunction((validator: unknown, resolve: boolean) => {
    const adapter = active();
    if (!adapter || typeof validator !== 'function') return undefined;
    if (validator === required || validator === Validators.required) return requiredState();
    return adapter.hasValidator?.(validator, { resolve });
  }, { max: VALIDATOR_QUERY_CACHE_SIZE });

  return {
    form,
    formSubmitted: form.submitted,
    connected: computed(() => active() !== null),
    source: computed(() => active()?.source ?? null),
    value: computed(() => active()?.value()),
    disabled: computed(() => active()?.disabled() ?? false),
    disabledReasons: computed(() => active()?.disabledReasons() ?? []),
    dirty: computed(() => active()?.dirty() ?? false),
    errors,
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
    required: requiredState,
    touched: computed(() => active()?.touched() ?? false),
    hasError,
    getError,
    hasValidator(validator, options) {
      return hasValidator(validator, options?.resolve === true);
    },
    markAsTouched() {
      active()?.markAsTouched();
    },
  };
};
