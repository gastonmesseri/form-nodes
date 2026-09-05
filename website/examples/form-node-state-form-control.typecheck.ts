import { Component, forwardRef } from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, type ControlValueAccessor } from '@angular/forms';

import { useFormNodeState } from 'form-nodes';

// Custom control component

@Component({
  selector: 'app-date-picker',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatePicker), multi: true }],
  template: `
    <button
      type="button"
      [disabled]="formNodeState.disabled()"
      (click)="select('2026-09-03')"
      (blur)="markAsTouched()"
      >
      {{ value }}
    </button>
  `,
})
export class DatePicker implements ControlValueAccessor {
  formNodeState = useFormNodeState();

  value: string | null = null;

  select(value: string | null) {
    this.value = value;
    this.onChange(value);
  }

  markAsTouched() {
    this.formNodeState.markAsTouched();
  }

  // ControlValueAccessor implementation

  onChange = (_value: string | null) => {};
  onTouched = () => {};

  registerOnChange(fn: any) { this.onChange = fn }
  registerOnTouched(fn: any) { this.onTouched = fn }

  writeValue(value: string | null) {
    this.value = value;
  }
}


// Parent form component

@Component({
  imports: [DatePicker, ReactiveFormsModule],
  template: `<app-date-picker [formControl]="birthDate" />`,
})
export class ProfileEditor {
  birthDate = new FormControl<string | null>(null);
}
