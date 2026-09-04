import { DestroyRef, EventEmitter, computed, effect, signal, untracked, type Injector } from '@angular/core';
import { PristineChangeEvent, StatusChangeEvent, TouchedChangeEvent, Validators, ValueChangeEvent, type AbstractControl, type ControlEvent, type ControlValueAccessor, type FormControlStatus, type ValidationErrors, type ValidatorFn } from '@angular/forms';

import { shallowEqual } from '../utils/shallow-equal';
import type { FormApi } from '../primitives/form.type';
import type { ArrayApi } from '../primitives/array.type';
import { isNode } from '../primitives/utils/node-marker';
import { arrayToObject } from '../utils/array-to-object';
import type { InternalNode, Node, Nodes } from '../types/node.type';
import type { ValidationError } from '../validation/validation.type';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import { registerExternalValidationErrors } from '../validation/external-validation-errors';

const controlErrorPayload = Symbol('controlErrorPayload');

type NgControlState = ReturnType<FormNodeNgControl['readState']>;

const toValidationErrors = (node: Node): ValidationErrors | null => {
  const errors = node.$api.errors();
  if (errors.length === 0) return null;
  return arrayToObject(errors, error => [error.kind, controlErrorPayload in error ? error[controlErrorPayload] : error]);
};

export class FormNodeNgControl {
  readonly control = this as unknown as AbstractControl;

  valueAccessor: ControlValueAccessor | null = null;

  valueEmitter = new EventEmitter<unknown>();

  statusEmitter = new EventEmitter<FormControlStatus>();

  eventEmitter = new EventEmitter<ControlEvent>();

  valueChanges: AbstractControl<unknown>['valueChanges'] = this.valueEmitter.asObservable();

  statusChanges: AbstractControl['statusChanges'] = this.statusEmitter.asObservable();

  events: AbstractControl['events'] = this.eventEmitter.asObservable();

  manualErrors = signal<ValidationErrors | null>(null, { equal: shallowEqual });

  registeredErrorNode: Node | undefined;

  removeErrorSource: (() => void) | undefined;

  silentStatus: NgControlState | undefined;

  destroyed = false;

  manualErrorSource = computed<readonly ValidationError.WithOptionalTargetNode<Node>[]>(() => {
    return Object.entries(this.manualErrors() ?? {}).map(([kind, context]) => ({
      kind,
      context,
      message: typeof context?.message === 'string' ? context.message : undefined,
      ...(this.binding ? { formNode: this.binding } : {}),
      [controlErrorPayload]: context,
    }));
  });

  constructor(readonly getNode: () => Node, injector: Injector, readonly binding?: FormNodeBinding<Node>) {
    let previous: NgControlState | undefined;
    effect(() => {
      const node = this.getNode();
      untracked(() => this.releasePreviousErrors(node));
      const current = this.readState();
      // A replacement node starts a new observation, keeping existing subscriptions connected.
      const last = previous?.node === current.node ? previous : undefined;
      previous = current;
      const silentStatus = this.silentStatus;
      this.silentStatus = undefined;
      untracked(() => {
        if (!last || !Object.is(last.value, current.value)) {
          this.valueEmitter.emit(current.value);
          this.eventEmitter.emit(new ValueChangeEvent(current.value, this.control));
        }
        // Error details and pending work can change without changing the status string.
        if (!this.sameValidationState(last, current) && !this.sameValidationState(silentStatus, current)) {
          this.statusEmitter.emit(current.status);
          this.eventEmitter.emit(new StatusChangeEvent(current.status, this.control));
        }
        if (!last || last.touched !== current.touched) {
          this.eventEmitter.emit(new TouchedChangeEvent(current.touched, this.control));
        }
        if (!last || last.pristine !== current.pristine) {
          this.eventEmitter.emit(new PristineChangeEvent(current.pristine, this.control));
        }
      });
    }, { injector });
    injector.get(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      untracked(() => this.releasePreviousErrors(undefined));
      this.valueEmitter.complete();
      this.statusEmitter.complete();
      this.eventEmitter.complete();
    });
  }

  /** Replaces only this binding's imperative errors; configured validators remain independent. */
  setErrors(errors: ValidationErrors | null, options: { emitEvent?: boolean } = {}) {
    if (this.destroyed) return;
    untracked(() => {
      const node = this.getNode();
      this.releasePreviousErrors(node);
      const nodeErrors = node.$api.errors();
      // CVAs sometimes spread control.errors into setErrors(). Do not retain validator-owned errors.
      const entries = Object.entries(errors ?? {}).filter(([kind, value]) => {
        return !nodeErrors.some(error => error.kind === kind && error === value);
      });
      if (!this.removeErrorSource && entries.length > 0) {
        this.registeredErrorNode = node;
        this.removeErrorSource = registerExternalValidationErrors(node, this, this.manualErrorSource, {
          onReset: () => this.manualErrors.set(null),
        });
      }
      this.manualErrors.set(entries.length > 0 ? Object.fromEntries(entries) : null);
      // Silence this adapter's status notification, while the node and its parents still update.
      this.silentStatus = options.emitEvent === false ? this.readState() : undefined;
    });
  }

  /**
   * Reads Angular error payloads from this node or a relative descendant path.
   * @reactive Tracks the selected node's errors and changes along the path.
   */
  getError(errorCode: string, path?: string | (string | number)[]): unknown {
    const node = path ? this.findErrorNode(path) : this.getNode();
    const errors = node ? toValidationErrors(node) : null;
    if (!errors) return null;
    return Object.hasOwn(errors, errorCode) ? errors[errorCode] : undefined;
  }

  /** @reactive Tracks the error query and follows Angular's payload truthiness check. */
  hasError(errorCode: string, path?: string | (string | number)[]): boolean {
    return !!this.getError(errorCode, path);
  }

  findErrorNode(path: string | (string | number)[]): Node | undefined {
    const segments = typeof path === 'string' ? path.split('.') : path;
    if (segments.length === 0) return undefined;
    let node: Node | undefined = this.getNode();
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

  releasePreviousErrors(node: Node | undefined) {
    if (this.registeredErrorNode === node) return;
    this.removeErrorSource?.();
    this.removeErrorSource = undefined;
    this.registeredErrorNode = undefined;
    this.manualErrors.set(null);
  }

  sameValidationState(left: NgControlState | undefined, right: NgControlState): boolean {
    return left?.node === right.node && left.status === right.status && left.errors === right.errors && left.pending === right.pending;
  }

  readState() {
    const node = this.getNode();
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

  get value(): unknown { return (this.getNode() as InternalNode).$api._controlValue(); }

  get valid(): boolean { return this.getNode().$api.valid(); }

  get invalid(): boolean { return this.getNode().$api.invalid(); }

  get pending(): boolean { return this.getNode().$api.pending(); }

  get disabled(): boolean { return this.getNode().$api.disabled(); }

  get enabled(): boolean { return this.getNode().$api.enabled(); }

  get errors(): ValidationErrors | null { return toValidationErrors(this.getNode()); }

  get pristine(): boolean { return this.getNode().$api.pristine(); }

  get dirty(): boolean { return this.getNode().$api.dirty(); }

  get touched(): boolean { return this.getNode().$api.touched(); }

  get untouched(): boolean { return this.getNode().$api.untouched(); }

  get status(): FormControlStatus {
    if (this.disabled) return 'DISABLED';
    if (this.valid) return 'VALID';
    if (this.invalid) return 'INVALID';
    return 'PENDING';
  }

  hasValidator(validator: ValidatorFn): boolean {
    return validator === Validators.required && this.getNode().$api.required();
  }

  updateValueAndValidity() {}
}

/**
 * asyncValidator
 * control
 * dirty
 * disabled
 * enabled
 * errors
 * getError
 * hasError
 * invalid
 * name
 * path
 * pending
 * pristine
 * reset
 * status
 * statusChanges
 * touched
 * untouched
 * valid
 * validator
 * value
 * valueAccessor
 * valueChanges
 * viewToModelUpdate
 */
