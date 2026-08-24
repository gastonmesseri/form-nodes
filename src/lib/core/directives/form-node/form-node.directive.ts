import { DestroyRef, Directive, ElementRef, InjectionToken, Injector, Input, Renderer2, computed, effect, forwardRef, inject, signal, untracked, type OnInit, type Signal } from '@angular/core';
import { CheckboxControlValueAccessor, DefaultValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, NgControl, NumberValueAccessor, RadioControlValueAccessor, RangeValueAccessor, SelectControlValueAccessor, SelectMultipleControlValueAccessor, Validators, type ControlValueAccessor, type ValidationErrors, type Validator, type ValidatorFn } from '@angular/forms';

import type { Field } from '../../primitives/field';
import { FormNodeNgControl } from './form-node-ng-control';
import type { ValidationError } from '../../validation/validation.type';
import { registerExternalValidationErrors } from '../../validation/external-validation-errors';
import { isNativeFormNodeControl, readNativeControlValue, writeNativeControlValue, type NativeFormNodeControl } from './native-control';

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
  selector: '[formNode]',
  exportAs: 'formNode',
  standalone: true,
  providers: [
    { provide: FORM_NODE, useExisting: forwardRef(() => FormNodeDirective) },
    { provide: NgControl, useFactory: () => inject(FormNodeDirective).ngControl },
  ],
})
export class FormNodeDirective<TValue> implements OnInit {
  private readonly currentField = signal<Field<TValue> | undefined>(undefined);

  /** Field node bound to the host native control or ControlValueAccessor. */
  @Input({ required: true, alias: 'formNode' })
  set field(value: Field<TValue>) { this.currentField.set(value); }

  get field(): Field<TValue> {
    const field = this.currentField();
    if (!field) throw new Error('formNode: a field node is required');
    return field;
  }

  /** Current bound field, exposed as a signal for custom integrations. */
  readonly node: Signal<Field<TValue>> = computed(() => {
    const field = this.currentField();
    if (!field) throw new Error('formNode: a field node is required');
    return field;
  });
  private _ngControl: FormNodeNgControl | undefined;

  /** Fake `NgControl` exposed for interoperability with existing Angular controls. */
  get ngControl(): FormNodeNgControl {
    return (this._ngControl ??= new FormNodeNgControl(() => this.field as Field<unknown>));
  }

  private readonly renderer = inject(Renderer2);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly nativeControl = isNativeFormNodeControl(this.element) ? this.element : null;
  private destroyed = false;
  private composing = false;
  private writingAccessorValue = false;
  private lastViewValue: unknown = Symbol('unset');

  constructor() {
    this.destroyRef.onDestroy(() => { this.destroyed = true; });
  }

  ngOnInit(): void {
    const accessor = selectValueAccessor(this.injector.get<readonly ControlValueAccessor[] | null>(NG_VALUE_ACCESSOR, null, { self: true }));
    if (accessor) this.connectAccessor(accessor);
    else if (this.nativeControl) this.connectNativeControl(this.nativeControl);
    else throw new Error('formNode: the host must be a native form control or provide ControlValueAccessor');
    this.bindNodeState();
  }

  focus(options?: FocusOptions): void { this.element.focus(options); }
  flush(): void { this.field.flush(); }
  reset(): void { this.field.reset(); }

  private connectAccessor(accessor: ControlValueAccessor): void {
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

  private connectLegacyValidators(): void {
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
      onCleanup(registerExternalValidationErrors(field, this, errors));
    }, { injector: this.injector });
  }

  private connectNativeControl(control: NativeFormNodeControl): void {
    const commit = () => {
      if (this.composing || this.destroyed) return;
      if (control instanceof HTMLInputElement && control.type === 'radio' && !control.checked) return;
      this.field.setControlValue(readNativeControlValue(control, () => this.field.controlValue()) as TValue);
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
    effect(() => writeNativeControlValue(control, this.node().controlValue()), { injector: this.injector });
    if (control instanceof HTMLSelectElement) {
      const observer = new MutationObserver(() => writeNativeControlValue(control, this.field.controlValue()));
      observer.observe(control, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });
      this.destroyRef.onDestroy(() => observer.disconnect());
    }
  }

  private bindNodeState(): void {
    effect(() => {
      const field = this.node();
      this.renderer.setProperty(this.element, 'disabled', field.disabled());
      if ('readOnly' in this.element) this.renderer.setProperty(this.element, 'readOnly', field.readonly());
      if ('required' in this.element) this.renderer.setProperty(this.element, 'required', field.required());
      this.renderer.setAttribute(this.element, 'aria-invalid', String(field.invalid()));
    }, { injector: this.injector });
  }
}
