import { NgControl } from '@angular/forms';
import { DestroyRef, Directive, ElementRef, InjectionToken, Injector, Renderer2, afterRenderEffect, computed, effect, forwardRef, inject, input, output, untracked, type OnInit, type Signal, type OnChanges } from '@angular/core';

import { shallowEqual } from '../utils/shallow-equal';
import type { FieldNode } from '../primitives/field.type';
import { warnInDevMode } from '../utils/warn-in-dev-mode';
import { createFieldNode } from '../primitives/field-node';
import type { FormNodeNgControl } from './form-node-ng-control';
import { FORM_NODE_CLASSES } from './provide-form-nodes-config';
import { FORM_NODE_PASS_THROUGH } from './form-node-pass-through';
import { registerNodeBindingInjector } from '../utils/node-injector';
import type { ControlAdapterContext } from './adapters/control-adapter';
import { resolveControlAdapter } from './adapters/resolve-control-adapter';
import type { ValidationErrorWithTargetNode } from '../validation/validation.type';
import { registerControlStateBinding } from '../form-node-state/adapters/form-node';
import { getGlobalFormNodeClasses } from '../configuration/configure-global-form-nodes';
import type { FormNodeBinding, FormNodeSubmitEvent } from '../types/form-node-binding.type';
import type { InternalNode, InternalNodeApi, AnyNode, NodeValue } from '../types/node.type';
import { prepareNativeControlEvents } from './adapters/native-control/native-control-events';
import { syncNativeControlState } from './adapters/native-control/sync-native-control-state';
import type { CustomControlEvents } from './adapters/signal-forms-control/custom-control-events';
import { componentAcceptsFormNode } from './adapters/signal-forms-control/discover-custom-control';
import { FORM_NODE_INTEROP, createFormNodeInterop, injectFormNodeNgControl } from './form-node-interop';

const UNSET_VALUE = Symbol('unset formNodeValue');

// Angular's template type constructor defaults an omitted node generic to any.
// Infer standalone field values from the value input in that case.
type BoundNode<TNode extends AnyNode, TValue> = 0 extends (1 & TNode) ? FieldNode<TValue> : [TNode] extends [never] ? FieldNode<TValue> : TNode;

/** Public injection token for the nearest Form Nodes control binding. */
export const FORM_NODE = new InjectionToken<FormNodeBinding<AnyNode>>('FORM_NODE');

@Directive({
  selector: '[formNode],[formNodeValue]',
  standalone: true,
  providers: [
    { provide: FORM_NODE, useExisting: forwardRef(() => _FormNode) },
    { provide: FORM_NODE_INTEROP, useFactory: () => createFormNodeInterop(inject(Injector)) },
    { provide: NgControl, useFactory: injectFormNodeNgControl },
  ],
  host: {
    '(valueChange)': 'handleCustomEvent("valueChange", $event)',
    '(checkedChange)': 'handleCustomEvent("checkedChange", $event)',
    '(touch)': 'handleCustomEvent("touch", $event)',
    '(submit)': 'submitNativeForm($event)',
    '(reset)': 'resetNativeForm($event)',
  },
  exportAs: 'formNode',
})
export class _FormNode<TNode extends AnyNode = never, TValue = unknown> implements FormNodeBinding<BoundNode<TNode, TValue>>, OnInit, OnChanges {
  formNodeInput = input<TNode | undefined>(undefined, { alias: 'formNode' });

  /** Supplies a value to the explicit node or an independent, lazily created field. */
  _formNodeValue = input<TValue | typeof UNSET_VALUE, TValue & NodeValue<BoundNode<NoInfer<TNode>, NoInfer<TValue>>>>(UNSET_VALUE, {
    alias: 'formNodeValue',
    transform: value => value,
  });

  /** Emits the committed control-originated value after debounce or an explicit flush. */
  formNodeValueChange = output<NodeValue<BoundNode<TNode, TValue>>>();

  /** Emits the latest parsed control value immediately, including while debounce is pending. */
  formNodeControlValueChange = output<NodeValue<BoundNode<TNode, TValue>>>();

  /** Native form attempt after flushing input; emitted before validation gating and onSubmit. */
  formNodeSubmit = output<FormNodeSubmitEvent<BoundNode<TNode, TValue>>>();

  /** Native form attempt rejected by submitWhen; async listeners are not awaited. */
  formNodeSubmitBlocked = output<FormNodeSubmitEvent<BoundNode<TNode, TValue>>>();

  injector = inject(Injector);

  private renderer = inject(Renderer2);

  private destroyRef = inject(DestroyRef);

  element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private interop = inject(FORM_NODE_INTEROP);

  private nativeForm = this.element.tagName === 'FORM';

  private bindingInjectorCleanups = new Set<() => void>();

  private formNodeStateCleanup: (() => void) | undefined;

  private explicitPassThrough = inject(FORM_NODE_PASS_THROUGH, { optional: true, self: true }) ?? false;

  private configuredClasses = inject(FORM_NODE_CLASSES, { optional: true }) ?? getGlobalFormNodeClasses();

  private connectNativeEvents = prepareNativeControlEvents(this.element, this.renderer, this.destroyRef);

  private customEvents: CustomControlEvents | undefined;

  resetControl: (() => void) | undefined;

  bindingGeneration = 0;

  private _standaloneNode: FieldNode<TValue> | undefined;

  private _synchronizedNode: BoundNode<TNode, TValue> | undefined;

  private _synchronizedValue: unknown = UNSET_VALUE;

  private focuser = (options?: FocusOptions) => this.element.focus(options);

  /** Current bound field, exposed as a signal for custom integrations. */
  node = computed<BoundNode<TNode, TValue>>(() => this.field);

  /** Errors visible to this binding, excluding errors owned by another binding. */
  errors: Signal<readonly ValidationErrorWithTargetNode<BoundNode<TNode, TValue>>[]> = computed(() => {
    const errors = this.node().$api.errors() as readonly ValidationErrorWithTargetNode<BoundNode<TNode, TValue>>[];
    return errors.filter(error => !error.formNode || error.formNode === this);
  }, { equal: shallowEqual });

  constructor() {
    this.interop.connect(this);
    this.destroyRef.onDestroy(() => {
      this.customEvents = undefined;
      this.formNodeStateCleanup?.();
      this.bindingInjectorCleanups.forEach(cleanup => cleanup());
      this.bindingInjectorCleanups.clear();
    });
    effect((onCleanup) => {
      const cleanup = registerNodeBindingInjector(this.node(), this.injector);
      this.bindingInjectorCleanups.add(cleanup);
      onCleanup(() => {
        this.bindingGeneration++;
        this.bindingInjectorCleanups.delete(cleanup);
        cleanup();
      });
    }, { injector: this.injector });
  }

  ngOnChanges() {
    const value = this._formNodeValue();
    if (value === UNSET_VALUE) return;
    untracked(() => {
      const node = this.node();
      if (node !== this._synchronizedNode || !Object.is(value, this._synchronizedValue)) {
        node.$api.set(value);
      }
      this._synchronizedNode = node;
      this._synchronizedValue = value;
    });
  }

  ngOnInit() {
    if (this.nativeForm) {
      this.requireObjectNode();
      this.renderer.setAttribute(this.element, 'novalidate', '');
      return;
    }
    if (this.explicitPassThrough || componentAcceptsFormNode(this.element)) {
      this.connectNativeEvents();
      return;
    }
    const context: ControlAdapterContext<BoundNode<TNode, TValue>> = {
      binding: this,
      renderer: this.renderer,
      getNgControl: () => this.ngControl,
      receiveValue: value => this.receiveControlValue(value),
    };
    const connection = resolveControlAdapter(context, this.interop.peek()?.valueAccessor);
    this.connectNativeEvents(connection.nativeEvents);
    this.customEvents = connection.customEvents;
    this.resetControl = connection.reset;
    this.focuser = connection.focus ?? this.focuser;
    this.formNodeStateCleanup = registerControlStateBinding(this.element, this);
    syncNativeControlState(context, connection.inputNames);
    this.registerControlBinding();
    this.warnWhenHidden();
    this.installClassBindingEffect();
  }

  /** Tracks the originating binding through synchronous and deferred commits. */
  receiveControlValue(value: unknown) {
    const node = this.node();
    const api = (node as unknown as InternalNode).$api;
    const bindingRef = new WeakRef(this);
    const generation = this.bindingGeneration;
    let receiving = true;
    let committed = false;
    let committedValue: NodeValue<BoundNode<TNode, TValue>>;
    const emitCommitted = () => {
      const binding = bindingRef.deref();
      if (!binding || binding.destroyRef.destroyed || binding.node() !== node || binding.bindingGeneration !== generation) return;
      if (!Object.is(api._value(), committedValue)) return;
      const value = node() as NodeValue<BoundNode<TNode, TValue>>;
      if (binding._formNodeValue() !== UNSET_VALUE) {
        binding._synchronizedNode = node;
        binding._synchronizedValue = value;
      }
      binding.formNodeValueChange.emit(value);
    };
    api._setControlValue(value, () => {
      committedValue = api._value() as NodeValue<BoundNode<TNode, TValue>>;
      committed = true;
      if (!receiving) emitCommitted();
    });
    this.formNodeControlValueChange.emit(api._controlValue() as NodeValue<BoundNode<TNode, TValue>>);
    receiving = false;
    if (committed) emitCommitted();
  }

  /** Dispatches declared custom outputs before consumer template listeners. */
  handleCustomEvent(name: keyof CustomControlEvents, value: unknown) {
    if (value instanceof Event && value.type === name && value.currentTarget === this.element) return;
    this.customEvents?.[name]?.(value);
  }

  /** Handles submission only when this binding is hosted by a native form. */
  submitNativeForm(event: Event) {
    if (!this.nativeForm) return;
    event.preventDefault();
    const api = this.requireObjectNode();
    if (api.nodeType() === 'form') {
      const form = this.node();
      let payload: FormNodeSubmitEvent<BoundNode<TNode, TValue>>;
      void (api as typeof api & {
        _submitFromControl(notifications: { attempted(): void; blocked(): void }): Promise<boolean>;
      })._submitFromControl({
        attempted: () => {
          payload = { value: form() as NodeValue<BoundNode<TNode, TValue>>, form, event };
          this.formNodeSubmit.emit(payload);
        },
        blocked: () => this.formNodeSubmitBlocked.emit(payload),
      });
      return;
    }
    api.markAsTouched();
    api.flush();
  }

  /** Handles reset only when this binding is hosted by a native form. */
  resetNativeForm(event: Event) {
    if (!this.nativeForm) return;
    event.preventDefault();
    this.requireObjectNode().reset();
  }

  private requireObjectNode(): InternalNodeApi {
    const api = (this.field as unknown as InternalNode).$api;
    if (api.nodeType() !== 'form' && api.nodeType() !== 'group') {
      throw new Error('formNode: a native form requires a form() or group() node');
    }
    return api;
  }

  private installClassBindingEffect() {
    const classes = Object.entries(this.configuredClasses).map(([className, predicate]) => [
      className,
      computed(() => predicate(this)),
    ] as const);
    if (classes.length === 0) return;
    const appliedClasses = new Map<string, boolean>();

    afterRenderEffect({
      write: () => {
        classes.forEach(([className, active]) => {
          const isActive = active();
          if (appliedClasses.get(className) === isActive) return;
          appliedClasses.set(className, isActive);
          if (isActive) this.renderer.addClass(this.element, className);
          else this.renderer.removeClass(this.element, className);
        });
      },
    }, { injector: this.injector });
  }

  /** Field, form, or array node bound to the host control. */
  get field(): BoundNode<TNode, TValue> {
    let node: AnyNode | undefined = this.formNodeInput();
    if (node === undefined && this._formNodeValue() !== UNSET_VALUE) {
      this._standaloneNode ??= untracked(() => {
        return createFieldNode(this._formNodeValue() as TValue, [], { injector: this.injector });
      });
      node = this._standaloneNode;
    }
    // eslint-disable-next-line @angular-eslint/no-uncalled-signals -- Validate the callable node itself before invoking it.
    if (typeof node !== 'function' || typeof (node as unknown as InternalNode).$api?._controlValue !== 'function') {
      throw new Error('formNode: a field, form, or array node is required');
    }
    return node as BoundNode<TNode, TValue>;
  }

  /** Observable `NgControl` view exposed only through Angular dependency injection. */
  get ngControl(): FormNodeNgControl {
    return this.interop.get();
  }

  private warnWhenHidden() {
    if (typeof ngDevMode === 'undefined' || !ngDevMode) return;
    effect(() => {
      const node = this.node();
      if (!node.$api.hidden()) return;
      const path = node.$api.path().join('.') || '<root>';
      warnInDevMode(`formNode: field '${path}' is hidden but is being rendered. Hidden fields should be removed from the DOM using @if.`);
    }, { injector: this.injector });
  }

  private registerControlBinding() {
    effect((onCleanup) => {
      const node = this.node();
      const field = node as unknown as InternalNode;
      onCleanup(field.$api._registerControlBinding({
        element: this.element,
        focus: options => this.focus(options),
        reset: () => {
          if (this.node() === node) this.resetControl?.();
        },
      }));
    }, { injector: this.injector });
  }

  focus(options?: FocusOptions) {
    this.focuser(options);
  }

  flush() {
    this.field.$api.flush();
  }

  reset() {
    this.field.$api.reset();
  }
}

/**
 * Public Angular directive for binding native and custom controls to a node.
 * `[formNodeValue]` supplies an external value and creates one independent field when
 * `[formNode]` is absent or undefined. Source changes preserve interaction state and do not
 * emit value outputs. `[(formNodeValue)]` writes committed user changes back to the source.
 * CVAs receive their initial value and optional disabled state synchronously during setup,
 * before child initialization. Subsequent model-to-view updates run through Angular effects;
 * they are not guaranteed to render before a programmatic node setter returns.
 * Reset forces a synchronous CVA write even for unchanged values. Rebinding refreshes value
 * and disabled state during synchronization, including when the new node has an equal value.
 * CVA user callbacks update control state synchronously, with debounce governing commits.
 */
export const FormNodeDirective = _FormNode;

/** Public instance view exposed by `[formNode]` template references and queries. */
export type FormNodeDirective<TNode extends AnyNode = AnyNode> = FormNodeBinding<TNode>;
