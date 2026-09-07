import { DestroyRef, EventEmitter, computed, effect, signal, untracked, type Injector } from '@angular/core';
import { FormResetEvent, PristineChangeEvent, StatusChangeEvent, TouchedChangeEvent, Validators, ValueChangeEvent, type AbstractControl, type AsyncValidatorFn, type ControlEvent, type ControlValueAccessor, type FormControlStatus, type ValidationErrors, type ValidatorFn } from '@angular/forms';

import { shallowEqual } from '../utils/shallow-equal';
import type { FormApi } from '../primitives/form.type';
import type { ArrayApi } from '../primitives/array.type';
import { isNode } from '../primitives/utils/node-marker';
import { arrayToObject } from '../utils/array-to-object';
import { warnInDevMode } from '../utils/warn-in-dev-mode';
import type { InternalNode, Node, Nodes } from '../types/node.type';
import type { ValidationError } from '../validation/validation.type';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import { registerExternalValidationErrors } from '../validation/external-validation-errors';

const controlErrorPayload = Symbol('controlErrorPayload');

type NgControlState = ReturnType<FormNodeNgControl['_readState']>;

const toValidationErrors = (node: Node): ValidationErrors | null => {
  const errors = node.$api.errors();
  if (errors.length === 0) return null;
  return arrayToObject(errors, error => [error.kind, controlErrorPayload in error ? error[controlErrorPayload] : error]);
};

/** Combined Angular compatibility surface. Underscored members are adapter implementation details. */
export class FormNodeNgControl {
  readonly control = this as unknown as AbstractControl;

  valueAccessor: ControlValueAccessor | null = null;

  _valueEmitter = new EventEmitter<unknown>();

  _statusEmitter = new EventEmitter<FormControlStatus>();

  _eventEmitter = new EventEmitter<ControlEvent>();

  valueChanges: AbstractControl<unknown>['valueChanges'] = this._valueEmitter.asObservable();

  statusChanges: AbstractControl['statusChanges'] = this._statusEmitter.asObservable();

  events: AbstractControl['events'] = this._eventEmitter.asObservable();

  _manualErrors = signal<ValidationErrors | null>(null, { equal: shallowEqual });

  _registeredErrorNode: Node | undefined;

  _removeErrorSource: (() => void) | undefined;

  _silentStatus: NgControlState | undefined;

  _silentReset: NgControlState | undefined;

  _destroyed = false;

  _manualErrorSource = computed<readonly ValidationError.WithOptionalTargetNode<Node>[]>(() => {
    return Object.entries(this._manualErrors() ?? {}).map(([kind, context]) => ({
      kind,
      context,
      message: typeof context?.message === 'string' ? context.message : undefined,
      ...(this._binding ? { formNode: this._binding } : {}),
      [controlErrorPayload]: context,
    }));
  });

  constructor(
    readonly _getNode: () => Node,
    injector: Injector,
    readonly _binding?: FormNodeBinding<Node>
  ) {
    let previous: NgControlState | undefined;
    effect(() => {
      const node = this._getNode();
      untracked(() => this._releasePreviousErrors(node));
      const current = this._readState();
      // A replacement node starts a new observation, keeping existing subscriptions connected.
      const baseline = this._silentReset ?? previous;
      this._silentReset = undefined;
      const last = baseline?.node === current.node ? baseline : undefined;
      previous = current;
      const silentStatus = this._silentStatus;
      this._silentStatus = undefined;
      untracked(() => {
        if (!last || !Object.is(last.value, current.value)) {
          this._valueEmitter.emit(current.value);
          this._eventEmitter.emit(new ValueChangeEvent(current.value, this.control));
        }
        // Error details and pending work can change without changing the status string.
        if (!this._sameValidationState(last, current) && !this._sameValidationState(silentStatus, current)) {
          this._statusEmitter.emit(current.status);
          this._eventEmitter.emit(new StatusChangeEvent(current.status, this.control));
        }
        if (!last || last.touched !== current.touched) {
          this._eventEmitter.emit(new TouchedChangeEvent(current.touched, this.control));
        }
        if (!last || last.pristine !== current.pristine) {
          this._eventEmitter.emit(new PristineChangeEvent(current.pristine, this.control));
        }
      });
    }, { injector });
    injector.get(DestroyRef).onDestroy(() => {
      this._destroyed = true;
      untracked(() => this._releasePreviousErrors(undefined));
      this._valueEmitter.complete();
      this._statusEmitter.complete();
      this._eventEmitter.complete();
    });
  }

  get value(): unknown { return (this._getNode() as InternalNode).$api._controlValue(); }

  /** Structural key in the node's parent; roots and detached nodes have no name. */
  get name(): string | number | null { return this._getNode().$api.keyInParent(); }

  /** Structural path from the current node root, copied for Angular's mutable array contract. */
  get path(): string[] { return [...this._getNode().$api.path()]; }

  get valid(): boolean { return this._getNode().$api.valid(); }

  get invalid(): boolean { return this._getNode().$api.invalid(); }

  get pending(): boolean { return this._getNode().$api.pending(); }

  get disabled(): boolean { return this._getNode().$api.disabled(); }

  get enabled(): boolean { return this._getNode().$api.enabled(); }

  get errors(): ValidationErrors | null { return toValidationErrors(this._getNode()); }

  get pristine(): boolean { return this._getNode().$api.pristine(); }

  get dirty(): boolean { return this._getNode().$api.dirty(); }

  get touched(): boolean { return this._getNode().$api.touched(); }

  get untouched(): boolean { return this._getNode().$api.untouched(); }

  get status(): FormControlStatus {
    if (this.disabled) return 'DISABLED';
    if (this.valid) return 'VALID';
    if (this.invalid) return 'INVALID';
    return 'PENDING';
  }

  /** No transferable Angular validator function is exposed; read errors and required metadata. */
  get validator(): ValidatorFn | null { return null; }

  /** Async execution belongs to the node; observe pending, errors, and statusChanges instead. */
  get asyncValidator(): AsyncValidatorFn | null { return null; }

  /**
   * Resets the bound subtree through the node API. Undefined preserves committed values.
   * Notification suppression applies only to this adapter's synchronous reset result.
   */
  reset(value?: unknown, options: { emitEvent?: boolean; onlySelf?: boolean; overwriteDefaultValue?: boolean } = {}) {
    if (this._destroyed) return;
    if (options.onlySelf || options.overwriteDefaultValue) {
      warnInDevMode('formNode: reset() ignores onlySelf and overwriteDefaultValue; node ancestors remain reactive and reset has no stored default value.');
    }
    untracked(() => {
      const node = this._getNode();
      this._releasePreviousErrors(node);
      if (value === undefined) node.$api.reset();
      else node.$api.reset(value);
      this._silentStatus = undefined;
      if (options.emitEvent === false) this._silentReset = this._readState();
      else this._eventEmitter.emit(new FormResetEvent(this.control));
    });
  }

  /** Replaces only this binding's imperative errors; configured validators remain independent. */
  setErrors(errors: ValidationErrors | null, options: { emitEvent?: boolean } = {}) {
    if (this._destroyed) return;
    untracked(() => {
      const node = this._getNode();
      this._releasePreviousErrors(node);
      const nodeErrors = node.$api.errors();
      // CVAs sometimes spread control.errors into setErrors(). Do not retain validator-owned errors.
      const entries = Object.entries(errors ?? {}).filter(([kind, value]) => {
        return !nodeErrors.some(error => error.kind === kind && error === value);
      });
      if (!this._removeErrorSource && entries.length > 0) {
        this._registeredErrorNode = node;
        this._removeErrorSource = registerExternalValidationErrors(node, this, this._manualErrorSource, {
          onReset: () => this._manualErrors.set(null),
        });
      }
      this._manualErrors.set(entries.length > 0 ? Object.fromEntries(entries) : null);
      // Silence this adapter's status notification, while the node and its parents still update.
      this._silentStatus = options.emitEvent === false ? this._readState() : undefined;
    });
  }

  /**
   * Reads Angular error payloads from this node or a relative descendant path.
   * @reactive Tracks the selected node's errors and changes along the path.
   */
  getError(errorCode: string, path?: string | (string | number)[]): unknown {
    const node = path ? this._findErrorNode(path) : this._getNode();
    const errors = node ? toValidationErrors(node) : null;
    if (!errors) return null;
    return Object.hasOwn(errors, errorCode) ? errors[errorCode] : undefined;
  }

  /** @reactive Tracks the error query and follows Angular's payload truthiness check. */
  hasError(errorCode: string, path?: string | (string | number)[]): boolean {
    return !!this.getError(errorCode, path);
  }

  _findErrorNode(path: string | (string | number)[]): Node | undefined {
    const segments = typeof path === 'string' ? path.split('.') : path;
    if (segments.length === 0) return undefined;
    let node: Node | undefined = this._getNode();
    for (const segment of segments) {
      if (!node) return undefined;
      const kind = node.$api.nodeType();
      if (kind === 'field') return undefined;
      let child: unknown;
      if (kind === 'array') {
        const items = (node.$api as ArrayApi<Node>).items();
        const index = typeof segment === 'number' && segment < 0 ? items.length + segment : segment;
        child = Object.hasOwn(items, index) ? items[index as number] : undefined;
      } else {
        // Track dynamic children independently of equality on the exposed aggregate value.
        (node as InternalNode).$api._value();
        const children = (node.$api as FormApi<Nodes>).children;
        child = Object.hasOwn(children, segment) ? children[segment] : undefined;
      }
      node = isNode(child) ? child : undefined;
    }
    return node;
  }

  _releasePreviousErrors(node: Node | undefined) {
    if (this._registeredErrorNode === node) return;
    this._removeErrorSource?.();
    this._removeErrorSource = undefined;
    this._registeredErrorNode = undefined;
    this._manualErrors.set(null);
  }

  _sameValidationState(left: NgControlState | undefined, right: NgControlState): boolean {
    return left?.node === right.node && left.status === right.status && left.errors === right.errors && left.pending === right.pending;
  }

  _readState() {
    const node = this._getNode();
    return {
      node,
      value: this.value,
      status: this.status,
      errors: node.$api.errors(),
      pending: this.pending,
      touched: this.touched,
      pristine: this.pristine,
    };
  }

  hasValidator(validator: ValidatorFn): boolean {
    return validator === Validators.required && this._getNode().$api.required();
  }

  /**
   * No additional work is needed: node state is reactive and current when read.
   * Does not flush input, restart validators, clear errors, or force/suppress notifications.
   * CVA rule changes must use registerOnValidatorChange(); node rules use node APIs.
   */
  updateValueAndValidity() {}
}
