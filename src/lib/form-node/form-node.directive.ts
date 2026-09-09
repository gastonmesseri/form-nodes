import { NgControl } from '@angular/forms';
import { DestroyRef, Directive, ElementRef, InjectionToken, Injector, Renderer2, afterRenderEffect, computed, effect, forwardRef, inject, input, output, type OnInit, type Signal } from '@angular/core';

import { shallowEqual } from '../utils/shallow-equal';
import { warnInDevMode } from '../utils/warn-in-dev-mode';
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

/** Public injection token for the nearest `[formNode]` binding. */
export const FORM_NODE = new InjectionToken<FormNodeBinding<AnyNode>>('FORM_NODE');

@Directive({
  selector: '[formNode]',
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
export class _FormNode<TNode extends AnyNode = AnyNode> implements FormNodeBinding<TNode>, OnInit {
  formNodeInput = input.required<TNode>({ alias: 'formNode' });

  /** Emits the committed control-originated value after debounce or an explicit flush. */
  formNodeValueChange = output<NodeValue<TNode>>();

  /** Emits the latest parsed control value immediately, including while debounce is pending. */
  formNodeControlValueChange = output<NodeValue<TNode>>();

  /** Native form attempt after flushing input; emitted before validation gating and onSubmit. */
  formNodeSubmit = output<FormNodeSubmitEvent<TNode>>();

  /** Native form attempt rejected by submitWhen; async listeners are not awaited. */
  formNodeSubmitBlocked = output<FormNodeSubmitEvent<TNode>>();

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

  private focuser = (options?: FocusOptions) => this.element.focus(options);

  /** Current bound field, exposed as a signal for custom integrations. */
  node = computed<TNode>(() => this.field);

  /** Errors visible to this binding, excluding errors owned by another binding. */
  errors: Signal<readonly ValidationErrorWithTargetNode<TNode>[]> = computed(() => {
    const errors = this.node().$api.errors() as readonly ValidationErrorWithTargetNode<TNode>[];
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
    const context: ControlAdapterContext<TNode> = {
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
    let committedValue: NodeValue<TNode>;
    const emitCommitted = () => {
      const binding = bindingRef.deref();
      if (!binding || binding.destroyRef.destroyed || binding.node() !== node || binding.bindingGeneration !== generation) return;
      if (!Object.is(api._value(), committedValue)) return;
      binding.formNodeValueChange.emit(node() as NodeValue<TNode>);
    };
    api._setControlValue(value, () => {
      committedValue = api._value() as NodeValue<TNode>;
      committed = true;
      if (!receiving) emitCommitted();
    });
    this.formNodeControlValueChange.emit(api._controlValue() as NodeValue<TNode>);
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
      let payload: FormNodeSubmitEvent<TNode>;
      void (api as typeof api & {
        _submitFromControl(notifications: { attempted(): void; blocked(): void }): Promise<boolean>;
      })._submitFromControl({
        attempted: () => {
          payload = { value: form() as NodeValue<TNode>, form, event };
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
  get field(): TNode {
    const node = this.formNodeInput();
    // eslint-disable-next-line @angular-eslint/no-uncalled-signals -- Validate the callable node itself before invoking it.
    if (typeof node !== 'function' || typeof (node as unknown as InternalNode).$api?._controlValue !== 'function') {
      throw new Error('formNode: a field, form, or array node is required');
    }
    return node;
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
