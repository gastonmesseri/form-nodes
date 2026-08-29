import { CSP_NONCE, DestroyRef, Directive, ElementRef, InjectionToken, Injector, Renderer2, computed, effect, forwardRef, inject, input, signal, untracked, type OnInit } from '@angular/core';
import { CheckboxControlValueAccessor, DefaultValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, NgControl, NumberValueAccessor, RadioControlValueAccessor, RangeValueAccessor, SelectControlValueAccessor, SelectMultipleControlValueAccessor, Validators, type ControlValueAccessor, type ValidationErrors, type Validator, type ValidatorFn } from '@angular/forms';

import type { Field } from '../../primitives/field';
import { FormNodeNgControl } from './form-node-ng-control';
import type { ValidationError } from '../../validation/validation.type';
import { registerExternalValidationErrors } from '../../validation/external-validation-errors';
import { nativeInputRequiresValidityTracking, watchNativeInputValidity } from './native-input-validity';
import { isNativeFormNodeControl, isNativeInput, isNativeSelect, parseNativeControlValue, writeNativeControlValue, type NativeFormNodeControl } from './native-control';

export const FORM_NODE = new InjectionToken<FormNodeDirective<unknown>>('FORM_NODE');

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

@Directive({
  selector: ':not(form)[formNode]',
  exportAs: 'formNode',
  standalone: true,
  providers: [
    { provide: FORM_NODE, useExisting: forwardRef(() => FormNodeDirective) },
    { provide: NgControl, useFactory: () => inject(FormNodeDirective).ngControl },
  ],
})
export class FormNodeDirective<TValue> implements OnInit {
  /** **Internal:** Signal input backing the `[formNode]` binding. Consumers should use `field` or `node` instead. */
  formNodeInput = input.required<Field<TValue>>({ alias: 'formNode' });

  private renderer = inject(Renderer2);

  private injector = inject(Injector);

  private destroyRef = inject(DestroyRef);

  private cspNonce = inject(CSP_NONCE, { optional: true });

  private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private _ngControl: FormNodeNgControl | undefined;

  private nativeControl = isNativeFormNodeControl(this.element) ? this.element : null;

  private legacyValidationOwner = {};

  private nativeParsingOwner = {};

  private destroyed = false;

  private composing = false;

  private writingAccessorValue = false;

  private lastViewValue: unknown = Symbol('unset');

  /** Current bound field, exposed as a signal for custom integrations. */
  node = computed(() => this.field);

  constructor() {
    this.destroyRef.onDestroy(() => { this.destroyed = true; });
  }

  ngOnInit() {
    const accessor = selectValueAccessor(this.injector.get<readonly ControlValueAccessor[] | null>(NG_VALUE_ACCESSOR, null, { self: true }));
    if (accessor) this.connectAccessor(accessor);
    else if (this.nativeControl) this.connectNativeControl(this.nativeControl);
    else throw new Error('formNode: the host must be a native form control or provide ControlValueAccessor');
    this.bindNodeState();
  }

  /** Field node bound to the host native control or ControlValueAccessor. */
  get field(): Field<TValue> {
    const field = this.formNodeInput();
    if (typeof field !== 'function' || typeof field.controlValue !== 'function') {
      throw new Error('formNode: a field node is required');
    }
    return field;
  }

  /** Fake `NgControl` exposed for interoperability with existing Angular controls. */
  get ngControl(): FormNodeNgControl {
    return (this._ngControl ??= new FormNodeNgControl(() => this.field as Field<unknown>));
  }

  private connectAccessor(accessor: ControlValueAccessor) {
    this.ngControl.valueAccessor = accessor;
    accessor.registerOnChange((value: unknown) => {
      if (this.destroyed || this.writingAccessorValue) return;
      this.lastViewValue = value;
      this.field.setControlValue(value as TValue);
    });
    accessor.registerOnTouched(() => {
      if (!this.destroyed) this.field.markAsTouched();
    });
    effect(() => {
      const value = this.node().controlValue();
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
        const disabled = this.node().disabled();
        untracked(() => accessor.setDisabledState!(disabled));
      }, { injector: this.injector });
    }
    this.connectLegacyValidators();
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
      const field = this.field;
      field.markAsDirty();
      const result = parseNativeControlValue(control, () => field.controlValue());
      parseErrors.set(result.error ? [result.error] : []);
      if ('value' in result) field.setControlValue(result.value as TValue);
    };
    const unlistenInput = this.renderer.listen(control, 'input', commit);
    const unlistenChange = this.renderer.listen(control, 'change', commit);
    const unlistenBlur = this.renderer.listen(control, 'blur', () => this.field.markAsTouched());
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
      const field = this.node();
      onCleanup(registerExternalValidationErrors(field, this.nativeParsingOwner, parseErrors, {
        onReset: () => {
          parseErrors.set([]);
          writeNativeControlValue(control, field.controlValue());
        },
      }));
    }, { injector: this.injector });
    effect(() => {
      const value = this.node().controlValue();
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
      const observer = new MutationObserver(() => writeNativeControlValue(control, this.field.controlValue()));
      observer.observe(control, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });
      this.destroyRef.onDestroy(() => observer.disconnect());
    }
  }

  private bindNodeState() {
    effect(() => {
      const field = this.node();
      this.renderer.setProperty(this.element, 'disabled', field.disabled());
      if ('readOnly' in this.element) this.renderer.setProperty(this.element, 'readOnly', field.readonly());
      if ('required' in this.element) this.renderer.setProperty(this.element, 'required', field.required());
      this.renderer.setAttribute(this.element, 'aria-invalid', String(field.invalid()));
    }, { injector: this.injector });
  }

  focus(options?: FocusOptions) {
    this.element.focus(options);
  }

  flush() {
    this.field.flush();
  }

  reset() {
    this.field.reset();
  }
}
