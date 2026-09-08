import { NgControl } from '@angular/forms';
import { DestroyRef, Directive, ElementRef, InjectionToken, Injector, Renderer2, afterRenderEffect, computed, effect, forwardRef, inject, input, type OnInit, type Signal } from '@angular/core';

import { shallowEqual } from '../utils/shallow-equal';
import { warnInDevMode } from '../utils/warn-in-dev-mode';
import { FormNodeNgControl } from './form-node-ng-control';
import { FORM_NODE_CLASSES } from './provide-form-nodes-config';
import { FORM_NODE_PASS_THROUGH } from './form-node-pass-through';
import { registerNodeBindingInjector } from '../utils/node-injector';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import type { ControlAdapterContext } from './adapters/control-adapter';
import { resolveControlAdapter } from './adapters/resolve-control-adapter';
import type { InternalNode, InternalNodeApi, AnyNode } from '../types/node.type';
import type { ValidationErrorWithTargetNode } from '../validation/validation.type';
import { registerControlStateBinding } from '../form-node-state/adapters/form-node';
import { getGlobalFormNodeClasses } from '../configuration/configure-global-form-nodes';
import { prepareNativeControlEvents } from './adapters/native-control/native-control-events';
import { syncNativeControlState } from './adapters/native-control/sync-native-control-state';
import { componentAcceptsFormNode } from './adapters/signal-forms-control/discover-custom-control';

/** Public injection token for the nearest `[formNode]` binding. */
export const FORM_NODE = new InjectionToken<FormNodeBinding<AnyNode>>('FORM_NODE');

@Directive({
  selector: '[formNode]',
  standalone: true,
  providers: [
    { provide: FORM_NODE, useExisting: forwardRef(() => _FormNode) },
    { provide: NgControl, useFactory: () => inject(_FormNode)._ngControl },
  ],
  host: {
    '(submit)': '_submitNativeForm($event)',
    '(reset)': '_resetNativeForm($event)',
  },
  exportAs: 'formNode',
})
export class _FormNode<TNode extends AnyNode = AnyNode> implements FormNodeBinding<TNode>, OnInit {
  _formNodeInput = input.required<TNode>({ alias: 'formNode' });

  injector = inject(Injector);

  private renderer = inject(Renderer2);

  private destroyRef = inject(DestroyRef);

  element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private interopNgControl: FormNodeNgControl | undefined;

  private nativeForm = this.element.tagName === 'FORM';

  private bindingInjectorCleanups = new Set<() => void>();

  private formNodeStateCleanup: (() => void) | undefined;

  private explicitPassThrough = inject(FORM_NODE_PASS_THROUGH, { optional: true, self: true }) ?? false;

  private configuredClasses = inject(FORM_NODE_CLASSES, { optional: true }) ?? getGlobalFormNodeClasses();

  private connectNativeEvents = prepareNativeControlEvents(this.element, this.renderer, this.destroyRef);

  private focuser = (options?: FocusOptions) => this.element.focus(options);

  /** Current bound field, exposed as a signal for custom integrations. */
  node = computed<TNode>(() => this._field);

  /** Errors visible to this binding, excluding errors owned by another binding. */
  errors: Signal<readonly ValidationErrorWithTargetNode<TNode>[]> = computed(() => {
    const errors = this.node().$api.errors() as readonly ValidationErrorWithTargetNode<TNode>[];
    return errors.filter(error => !error.formNode || error.formNode === this);
  }, { equal: shallowEqual });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.formNodeStateCleanup?.();
      this.bindingInjectorCleanups.forEach(cleanup => cleanup());
      this.bindingInjectorCleanups.clear();
    });
    effect((onCleanup) => {
      const cleanup = registerNodeBindingInjector(this.node(), this.injector);
      this.bindingInjectorCleanups.add(cleanup);
      onCleanup(() => {
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
      getNgControl: () => this._ngControl,
    };
    const connection = resolveControlAdapter(context, this.interopNgControl?.valueAccessor);
    this.connectNativeEvents(connection.nativeEvents);
    this.focuser = connection.focus ?? this.focuser;
    this.formNodeStateCleanup = registerControlStateBinding(this.element, this);
    syncNativeControlState(context, connection.inputNames);
    this.registerControlBinding();
    this.warnWhenHidden();
    this.installClassBindingEffect();
  }

  /** Handles submission only when this binding is hosted by a native form. */
  _submitNativeForm(event: Event) {
    if (!this.nativeForm) return;
    event.preventDefault();
    const api = this.requireObjectNode();
    if (api.nodeType() === 'form') {
      void (api as typeof api & { submit(): Promise<boolean> }).submit();
      return;
    }
    api.markAsTouched();
    api.flush();
  }

  /** Handles reset only when this binding is hosted by a native form. */
  _resetNativeForm(event: Event) {
    if (!this.nativeForm) return;
    event.preventDefault();
    this.requireObjectNode().reset();
  }

  private requireObjectNode(): InternalNodeApi {
    const api = (this._field as unknown as InternalNode).$api;
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
  get _field(): TNode {
    const node = this._formNodeInput();
    // eslint-disable-next-line @angular-eslint/no-uncalled-signals -- Validate the callable node itself before invoking it.
    if (typeof node !== 'function' || typeof (node as unknown as InternalNode).$api?._controlValue !== 'function') {
      throw new Error('formNode: a field, form, or array node is required');
    }
    return node;
  }

  /** Observable `NgControl` view exposed only through Angular dependency injection. */
  get _ngControl(): FormNodeNgControl {
    return (this.interopNgControl ??= new FormNodeNgControl(() => this._field, this.injector, this));
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
      const field = this.node() as unknown as InternalNode;
      onCleanup(field.$api._registerControlBinding({
        element: this.element,
        focus: options => this.focus(options),
      }));
    }, { injector: this.injector });
  }

  focus(options?: FocusOptions) {
    this.focuser(options);
  }

  flush() {
    this._field.$api.flush();
  }

  reset() {
    this._field.$api.reset();
  }
}

/** Public Angular directive value used in component imports and dependency injection. */
export const FormNodeDirective = _FormNode;

/** Public instance view exposed by `[formNode]` template references and queries. */
export type FormNodeDirective<TNode extends AnyNode = AnyNode> = FormNodeBinding<TNode>;
