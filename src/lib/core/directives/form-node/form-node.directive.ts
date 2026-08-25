import { APP_ID, CSP_NONCE, DestroyRef, Directive, ElementRef, InjectionToken, Injector, Renderer2, computed, effect, forwardRef, inject, input, signal, untracked, type OnInit } from '@angular/core';
import { CheckboxControlValueAccessor, DefaultValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, NgControl, NumberValueAccessor, RadioControlValueAccessor, RangeValueAccessor, SelectControlValueAccessor, SelectMultipleControlValueAccessor, Validators, type ControlValueAccessor, type ValidationErrors, type Validator, type ValidatorFn } from '@angular/forms';

import type { Field } from '../../primitives/field';
import { connectSignalControl } from './signal-control';
import { getFormNodeName } from './utils/form-node-name';
import type { InternalNode, Node, NodeValue } from '../../types/node.type';
import { FormNodeNgControl } from './form-node-ng-control';
import { discoverSignalControl } from './utils/discover-signal-control';
import type { ValidationError } from '../../validation/validation.type';
import { connectSignalControlInputs } from './utils/signal-control-inputs';
import { FORM_NODE_CONTROL, type FormNodeControl } from './form-node-control';
import { registerExternalValidationErrors } from '../../validation/external-validation-errors';
import { nativeInputRequiresValidityTracking, watchNativeInputValidity } from './utils/native-input-validity';
import { isNativeFormNodeControl, isNativeInput, isNativeSelect, parseNativeControlValue, writeNativeControlValue, type NativeFormNodeControl } from './utils/native-control';

export const FORM_NODE = new InjectionToken<FormNodeDirective<Node>>('FORM_NODE');

const builtInAccessors = [
  CheckboxControlValueAccessor,
  DefaultValueAccessor,
  NumberValueAccessor,
  RadioControlValueAccessor,
  RangeValueAccessor,
  SelectControlValueAccessor,
  SelectMultipleControlValueAccessor,
];

const isBuiltInAccessor = (accessor: ControlValueAccessor): boolean =>
  builtInAccessors.some((accessorType) => accessor instanceof accessorType);

const selectValueAccessor = (accessors: readonly ControlValueAccessor[] | null): ControlValueAccessor | null => {
  if (!accessors || accessors.length === 0) return null;
  let defaultAccessor: ControlValueAccessor | undefined;
  let builtInAccessor: ControlValueAccessor | undefined;
  let customAccessor: ControlValueAccessor | undefined;

  accessors.forEach((accessor) => {
    if (accessor instanceof DefaultValueAccessor) {
      if (defaultAccessor) throw new Error('formNode: more than one default ControlValueAccessor matches the host');
      defaultAccessor = accessor;
    } else if (isBuiltInAccessor(accessor)) {
      if (builtInAccessor) throw new Error('formNode: more than one built-in ControlValueAccessor matches the host');
      builtInAccessor = accessor;
    } else {
      if (customAccessor) throw new Error('formNode: more than one custom ControlValueAccessor matches the host');
      customAccessor = accessor;
    }
  });

  return customAccessor ?? builtInAccessor ?? defaultAccessor!;
};

const isValidatorObject = (validator: ValidatorFn | Validator): validator is Validator =>
  typeof validator === 'object' && validator !== null;

const toControlErrors = (errors: ValidationErrors | null): readonly ValidationError.WithoutTargetNode[] =>
  errors ? Object.entries(errors).map(([kind, context]) => ({ kind, context })) : [];

const formatNativeLimit = (value: unknown, type: string): unknown => {
  if (!(value instanceof Date) || (type !== 'date' && type !== 'month')) return value;
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  if (type === 'month') return `${year}-${month}`;
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatNativePattern = (patterns: readonly RegExp[]): string => {
  if (patterns.length <= 1) return patterns[0]?.source ?? '';
  return `${patterns.map((pattern) => `(?=(?:${pattern.source})$)`).join('')}.*`;
};

@Directive({
  selector: ':not(form)[formNode]',
  exportAs: 'formNode',
  standalone: true,
  providers: [
    { provide: FORM_NODE, useExisting: forwardRef(() => FormNodeDirective) },
    { provide: NgControl, useFactory: () => inject(FormNodeDirective).ngControl },
  ],
})
export class FormNodeDirective<TNode extends Node = Node> implements OnInit {
  /** **Internal:** Signal input backing the `[formNode]` binding. Consumers should use `field` or `node` instead. */
  formNodeInput = input.required<TNode>({ alias: 'formNode' });

  private renderer = inject(Renderer2);

  private injector = inject(Injector);

  private destroyRef = inject(DestroyRef);

  private cspNonce = inject(CSP_NONCE, { optional: true });

  private appId = inject(APP_ID);

  private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private _ngControl: FormNodeNgControl | undefined;

  private nativeControl = isNativeFormNodeControl(this.element) ? this.element : null;

  private legacyValidationOwner = {};

  private nativeParsingOwner = {};

  private destroyed = false;

  private composing = false;

  private writingAccessorValue = false;

  private lastViewValue: unknown = Symbol('unset');

  private signalControl = inject(FORM_NODE_CONTROL, { optional: true, self: true });

  private focuser = (options?: FocusOptions) => this.element.focus(options);

  /** Current bound field, exposed as a signal for custom integrations. */
  node = computed(() => this.field);

  constructor() {
    this.destroyRef.onDestroy(() => { this.destroyed = true; });
  }

  ngOnInit() {
    const accessor = selectValueAccessor(this.injector.get<readonly ControlValueAccessor[] | null>(NG_VALUE_ACCESSOR, null, { self: true }));
    const signalControl = this.signalControl ?? discoverSignalControl(this.element);
    if (accessor) this.connectAccessor(accessor);
    else if (signalControl) this.connectSignalCustomControl(signalControl as FormNodeControl<NodeValue<TNode>, TNode>);
    else if (this.nativeControl) this.connectNativeControl(this.nativeControl);
    else throw new Error('formNode: the host must be a native form control, provide a signal custom control, or provide ControlValueAccessor');
    this.bindNodeState();
    this.registerControlBinding();
    this.warnWhenHidden();
  }

  /** Field, form, or array node bound to the host control. */
  get field(): TNode {
    const node = this.formNodeInput();
    if (typeof node !== 'function' || typeof (node as unknown as InternalNode).api?._controlValue !== 'function') {
      throw new Error('formNode: a field, form, or array node is required');
    }
    return node;
  }

  /** Fake `NgControl` exposed for interoperability with existing Angular controls. */
  get ngControl(): FormNodeNgControl {
    return (this._ngControl ??= new FormNodeNgControl(() => this.field));
  }

  private connectAccessor(accessor: ControlValueAccessor) {
    this.ngControl.valueAccessor = accessor;
    accessor.registerOnChange((value: unknown) => {
      if (this.destroyed || this.writingAccessorValue) return;
      this.lastViewValue = value;
      (this.field as unknown as InternalNode).api._setControlValue(value);
    });
    accessor.registerOnTouched(() => {
      if (!this.destroyed) this.field.api.markAsTouched();
    });
    effect(() => {
      const value = (this.node() as unknown as InternalNode).api._controlValue();
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
        const disabled = this.node().api.disabled();
        untracked(() => accessor.setDisabledState!(disabled));
      }, { injector: this.injector });
    }
    this.connectLegacyValidators();
    connectSignalControlInputs(accessor, () => this.field, this.injector);
  }

  private connectSignalCustomControl(control: FormNodeControl<NodeValue<TNode>, TNode>) {
    const connection = connectSignalControl(control, () => this.field, this.injector);
    this.focuser = connection.focus ?? this.focuser;
  }

  private connectLegacyValidators() {
    const validators = this.injector.get<readonly (ValidatorFn | Validator)[] | null>(NG_VALIDATORS, null, { self: true });
    if (!validators?.length) return;
    const version = signal(0);
    validators.forEach((validator) => {
      if (isValidatorObject(validator) && validator.registerOnValidatorChange) {
        validator.registerOnValidatorChange(() => version.update((current) => current + 1));
      }
    });
    const validator = Validators.compose(validators.map((item) =>
      typeof item === 'function' ? item : item.validate.bind(item),
    ));
    const errors = computed(() => {
      version();
      return toControlErrors(validator?.(this.ngControl.control) ?? null);
    });
    effect((onCleanup) => {
      const field = this.node();
      onCleanup(registerExternalValidationErrors(field, this.legacyValidationOwner, errors));
    }, { injector: this.injector });
  }

  private connectNativeControl(control: NativeFormNodeControl) {
    const parseErrors = signal<readonly ValidationError.WithoutTargetNode[]>([]);
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
    const unlistenBlur = this.renderer.listen(control, 'blur', () => this.field.api.markAsTouched());
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
      onCleanup(registerExternalValidationErrors(field, this.nativeParsingOwner, parseErrors, {
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
      if (this.nativeControl) this.renderer.setProperty(this.nativeControl, 'name', getFormNodeName(node, this.appId));
      this.renderer.setProperty(this.element, 'disabled', node.api.disabled());
      if ('readOnly' in this.element) this.renderer.setProperty(this.element, 'readOnly', node.api.readonly());
      if ('required' in this.element) this.renderer.setProperty(this.element, 'required', node.api.required());
      if ('min' in this.element) this.renderer.setProperty(this.element, 'min', formatNativeLimit(field.min?.(), (this.element as HTMLInputElement).type) ?? '');
      if ('max' in this.element) this.renderer.setProperty(this.element, 'max', formatNativeLimit(field.max?.(), (this.element as HTMLInputElement).type) ?? '');
      if ('minLength' in this.element) {
        const value = field.minLength?.();
        if (value === null) this.renderer.removeAttribute(this.element, 'minlength');
        else this.renderer.setProperty(this.element, 'minLength', value);
      }
      if ('maxLength' in this.element) {
        const value = field.maxLength?.();
        if (value === null) this.renderer.removeAttribute(this.element, 'maxlength');
        else this.renderer.setProperty(this.element, 'maxLength', value);
      }
      if ('pattern' in this.element) this.renderer.setProperty(this.element, 'pattern', formatNativePattern(field.pattern?.() ?? []));
      this.renderer.setAttribute(this.element, 'aria-invalid', String(node.api.invalid()));
    }, { injector: this.injector });
  }

  private warnWhenHidden() {
    if (typeof ngDevMode === 'undefined' || !ngDevMode) return;
    effect(() => {
      const node = this.node();
      if (!node.api.hidden()) return;
      const path = node.api.path().join('.') || '<root>';
      console.warn(`formNode: field '${path}' is hidden but is being rendered. Hidden fields should be removed from the DOM using @if.`);
    }, { injector: this.injector });
  }

  private registerControlBinding() {
    effect((onCleanup) => {
      const field = this.node() as unknown as InternalNode;
      onCleanup(field.api._registerControlBinding({
        element: this.element,
        focus: (options) => this.focus(options),
      }));
    }, { injector: this.injector });
  }

  focus(options?: FocusOptions) {
    this.focuser(options);
  }

  flush() {
    this.field.api.flush();
  }

  reset() {
    this.field.api.reset();
  }

  private getNativeField(): Field<NodeValue<TNode>> {
    const node = this.field as unknown as Partial<Field<NodeValue<TNode>>>;
    if (typeof node.controlValue !== 'function') {
      throw new Error('formNode: native controls require a field node');
    }
    return node as Field<NodeValue<TNode>>;
  }
}
