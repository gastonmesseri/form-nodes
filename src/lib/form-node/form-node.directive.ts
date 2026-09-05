import { NG_VALIDATORS, NG_VALUE_ACCESSOR, NgControl, Validators, type ControlValueAccessor, type Validator, type ValidatorFn } from '@angular/forms';
import { APP_ID, CSP_NONCE, DestroyRef, Directive, ElementRef, InjectionToken, Injector, Renderer2, afterEveryRender, afterRenderEffect, computed, effect, forwardRef, inject, input, signal, untracked, type OnInit, type Signal } from '@angular/core';

import type { Field } from '../primitives/field';
import { FORM_NODE_CONFIG } from './form-node-config';
import { shallowEqual } from '../utils/shallow-equal';
import { connectSignalControl } from './signal-control';
import { getFormNodeName } from './utils/form-node-name';
import { warnInDevMode } from '../utils/warn-in-dev-mode';
import { FormNodeNgControl } from './form-node-ng-control';
import type { FormNodeControl } from './form-node-control';
import { FORM_NODE_PASS_THROUGH } from './form-node-pass-through';
import { registerNodeBindingInjector } from '../utils/node-injector';
import type { ValidationError } from '../validation/validation.type';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import { connectSignalControlInputs } from './utils/signal-control-inputs';
import type { InternalNode, InternalNodeApi, Node, NodeValue } from '../types/node.type';
import { registerExternalValidationErrors } from '../validation/external-validation-errors';
import { componentAcceptsFormNode, discoverSignalControl } from './utils/discover-signal-control';
import { hasControlStateConsumer, registerControlStateBinding } from '../form-node-state/adapters/form-node';
import { nativeInputRequiresValidityTracking, watchNativeInputValidity } from './utils/native-input-validity';
import { isNativeFormNodeControl, isNativeInput, isNativeSelect, parseNativeControlValue, writeNativeControlValue, type NativeFormNodeControl } from './utils/native-control';
import { elementAcceptsMinMax, formatNativeLimit, formatNativePattern, isTextualFormElement, isValidatorObject, selectValueAccessor, toControlErrors } from './form-node.utils';

/** Public injection token for the nearest `[formNode]` binding. */
export const FORM_NODE = new InjectionToken<FormNodeBinding<Node>>('FORM_NODE');

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
export class _FormNode<TNode extends Node = Node> implements FormNodeBinding<TNode>, OnInit {
  _formNodeInput = input.required<TNode>({ alias: 'formNode' });

  injector = inject(Injector);

  private renderer = inject(Renderer2);

  private destroyRef = inject(DestroyRef);

  private cspNonce = inject(CSP_NONCE, { optional: true });

  private appId = inject(APP_ID);

  element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private interopNgControl: FormNodeNgControl | undefined;

  private nativeControl = isNativeFormNodeControl(this.element) ? this.element : null;

  private nativeForm = this.element.tagName === 'FORM';

  private legacyValidationOwner = {};

  private nativeParsingOwner = {};

  private destroyed = false;

  private bindingInjectorCleanups = new Set<() => void>();

  private formNodeStateCleanup: (() => void) | undefined;

  private composing = false;

  private writingAccessorValue = false;

  private lastViewValue: unknown = Symbol('unset');

  private customControlInputNames: ReadonlySet<string> = new Set();

  private explicitPassThrough = inject(FORM_NODE_PASS_THROUGH, { optional: true, self: true }) ?? false;

  private config = inject(FORM_NODE_CONFIG, { optional: true });

  private focuser = (options?: FocusOptions) => this.element.focus(options);

  /** Current bound field, exposed as a signal for custom integrations. */
  node = computed<TNode>(() => this._field);

  /** Errors visible to this binding, excluding errors owned by another binding. */
  errors: Signal<readonly ValidationError.WithTargetNode<TNode>[]> = computed(() => {
    const errors = this.node().$api.errors() as readonly ValidationError.WithTargetNode<TNode>[];
    return errors.filter(error => !error.formNode || error.formNode === this);
  }, { equal: shallowEqual });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
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
    if (this.explicitPassThrough || componentAcceptsFormNode(this.element)) return;
    const accessor = this.interopNgControl?.valueAccessor ?? selectValueAccessor(this.injector.get<readonly ControlValueAccessor[] | null>(NG_VALUE_ACCESSOR, null, { self: true }));
    const signalControl = discoverSignalControl(this.element);
    if (accessor) this.connectAccessor(accessor);
    else if (signalControl) this.connectSignalCustomControl(signalControl as FormNodeControl<NodeValue<TNode>, TNode>);
    else if (this.nativeControl) this.connectNativeControl(this.nativeControl);
    else throw new Error('formNode: the host must be a native form control, a recognized signal custom-control component, or provide ControlValueAccessor');
    this.formNodeStateCleanup = registerControlStateBinding(this.element, this);
    this.bindNodeState();
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
    const classes = Object.entries(this.config?.classes ?? {}).map(([className, predicate]) => [
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

  private connectAccessor(accessor: ControlValueAccessor) {
    this._ngControl.valueAccessor = accessor;
    accessor.registerOnChange((value: unknown) => {
      if (this.destroyed || this.writingAccessorValue) return;
      this.lastViewValue = value;
      (this._field as unknown as InternalNode).$api._setControlValue(value);
    });
    accessor.registerOnTouched(() => {
      if (this.destroyed) return;
      this._field.$api.markAsTouched();
      (this._field as unknown as InternalNode).$api._flushControlValueOnBlur();
    });
    effect(() => {
      const value = (this.node() as unknown as InternalNode).$api._controlValue();
      if (Object.is(value, this.lastViewValue)) return;
      this.lastViewValue = value;
      untracked(() => {
        this.writingAccessorValue = true;
        try {
          accessor.writeValue(value);
        } finally {
          this.writingAccessorValue = false;
        }
      });
    }, { injector: this.injector });
    if (accessor.setDisabledState) {
      effect(() => {
        const disabled = this.node().$api.disabled();
        untracked(() => accessor.setDisabledState!(disabled));
      }, { injector: this.injector });
    }
    this.connectLegacyValidators();
    this.customControlInputNames = connectSignalControlInputs(accessor, () => this._field, this.injector, hasControlStateConsumer(this.element)).inputNames;
  }

  private connectSignalCustomControl(control: FormNodeControl<NodeValue<TNode>, TNode>) {
    const connection = connectSignalControl(control, () => this._field, this.injector, hasControlStateConsumer(this.element));
    this.focuser = connection.focus ?? this.focuser;
    this.customControlInputNames = connection.inputNames;
  }

  private connectLegacyValidators() {
    const validators = this.injector.get<readonly (ValidatorFn | Validator)[] | null>(NG_VALIDATORS, null, { self: true });
    if (!validators?.length) return;
    const version = signal(0);
    validators.forEach((validator) => {
      if (isValidatorObject(validator) && validator.registerOnValidatorChange) {
        validator.registerOnValidatorChange(() => version.update(current => current + 1));
      }
    });
    const validator = Validators.compose(validators.map((item) => {
      return typeof item === 'function' ? item : item.validate.bind(item);
    },
    ));
    const errors = computed(() => {
      version();
      return toControlErrors(validator?.(this._ngControl.control) ?? null);
    });
    effect((onCleanup) => {
      const field = this.node();
      onCleanup(registerExternalValidationErrors(field, this.legacyValidationOwner, errors));
    }, { injector: this.injector });
  }

  private connectNativeControl(control: NativeFormNodeControl) {
    const parseErrors = signal<readonly ValidationError.WithoutTargetNode[]>([]);
    const bindingParseErrors = computed(() => {
      return parseErrors().map(error => ({
        ...error,
        formNode: this,
      }));
    });
    const commit = () => {
      if (this.composing || this.destroyed) return;
      if (isNativeInput(control) && control.type === 'radio' && !control.checked) return;
      const field = this.getNativeField();
      field.markAsDirty();
      const result = parseNativeControlValue(control, () => field.controlValue());
      parseErrors.set(result.error ? [result.error] : []);
      if ('value' in result) field.setControlValue(result.value as NodeValue<TNode>);
    };
    const unlistenInput = this.renderer.listen(control, 'input', commit);
    const unlistenChange = this.renderer.listen(control, 'change', commit);
    const unlistenBlur = this.renderer.listen(control, 'blur', () => {
      this._field.$api.markAsTouched();
      (this._field as unknown as InternalNode).$api._flushControlValueOnBlur();
    });
    const unlistenCompositionStart = this.renderer.listen(control, 'compositionstart', () => { this.composing = true; });
    const unlistenCompositionEnd = this.renderer.listen(control, 'compositionend', () => {
      this.composing = false;
      commit();
    });
    this.destroyRef.onDestroy(() => {
      unlistenInput();
      unlistenChange();
      unlistenBlur();
      unlistenCompositionStart();
      unlistenCompositionEnd();
    });
    effect((onCleanup) => {
      const field = this.getNativeField();
      onCleanup(registerExternalValidationErrors(field, this.nativeParsingOwner, bindingParseErrors, {
        onReset: () => {
          parseErrors.set([]);
          writeNativeControlValue(control, field.controlValue());
        },
      }));
    }, { injector: this.injector });
    effect(() => {
      const value = this.getNativeField().controlValue();
      untracked(() => {
        parseErrors.set([]);
        writeNativeControlValue(control, value);
      });
    }, { injector: this.injector });
    if (isNativeInput(control) && control.type === 'radio') {
      afterEveryRender(() => writeNativeControlValue(control, this.getNativeField().controlValue()), { injector: this.injector });
    }
    if (isNativeInput(control) && nativeInputRequiresValidityTracking(control)) {
      const stopWatchingValidity = watchNativeInputValidity(control, commit, this.cspNonce ?? undefined);
      this.destroyRef.onDestroy(stopWatchingValidity);
    }
    if (isNativeSelect(control) && typeof MutationObserver === 'function') {
      const observer = new MutationObserver(() => writeNativeControlValue(control, this.getNativeField().controlValue()));
      observer.observe(control, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });
      this.destroyRef.onDestroy(() => observer.disconnect());
    }
  }

  private bindNodeState() {
    effect(() => {
      const node = this.node();
      const field = node as unknown as Partial<Field<NodeValue<TNode>>>;
      if (this.nativeControl && !this.customControlInputNames.has('name')) this.renderer.setProperty(this.nativeControl, 'name', getFormNodeName(node, this.appId));
      if (this.nativeControl && !this.customControlInputNames.has('disabled')) this.renderer.setProperty(this.nativeControl, 'disabled', node.$api.disabled());
      if (this.nativeControl && !this.customControlInputNames.has('readonly') && 'readOnly' in this.nativeControl) this.renderer.setProperty(this.nativeControl, 'readOnly', node.$api.readonly());
      if (this.nativeControl && !this.customControlInputNames.has('required') && 'required' in this.nativeControl) this.renderer.setProperty(this.nativeControl, 'required', node.$api.required());
      if (elementAcceptsMinMax(this.element)) {
        if (!this.customControlInputNames.has('min')) this.renderer.setProperty(this.element, 'min', formatNativeLimit(field.min?.(), this.element.type) ?? '');
        if (!this.customControlInputNames.has('max')) this.renderer.setProperty(this.element, 'max', formatNativeLimit(field.max?.(), this.element.type) ?? '');
      }
      if (isTextualFormElement(this.element)) {
        const value = field.minLength?.();
        if (!this.customControlInputNames.has('minLength')) {
          if (value === null) this.renderer.removeAttribute(this.element, 'minlength');
          else this.renderer.setProperty(this.element, 'minLength', value);
        }
        const maximumValue = field.maxLength?.();
        if (!this.customControlInputNames.has('maxLength')) {
          if (maximumValue === null) this.renderer.removeAttribute(this.element, 'maxlength');
          else this.renderer.setProperty(this.element, 'maxLength', maximumValue);
        }
      }
      if (!this.customControlInputNames.has('pattern') && 'pattern' in this.element) this.renderer.setProperty(this.element, 'pattern', formatNativePattern(field.pattern?.() ?? []));
      this.renderer.setAttribute(this.element, 'aria-invalid', String(node.$api.invalid()));
    }, { injector: this.injector });
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

  private getNativeField(): Field<NodeValue<TNode>> {
    const node = this._field as unknown as Partial<Field<NodeValue<TNode>>>;
    if (typeof node.setControlValue !== 'function') {
      throw new Error('formNode: native controls require a field node');
    }
    return node as Field<NodeValue<TNode>>;
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
export const FormNode = _FormNode;

/** Public instance view exposed by `[formNode]` template references and queries. */
export type FormNode<TNode extends Node = Node> = FormNodeBinding<TNode>;
