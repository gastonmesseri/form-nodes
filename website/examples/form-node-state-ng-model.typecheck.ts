import { Component, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import { useFormNodeState } from 'form-nodes';

// Custom control component

@Component({
  selector: 'app-date-picker',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatePicker), multi: true }],
  template: `<button type="button" [disabled]="formNodeState.disabled()" (click)="select('2026-09-03')" (blur)="markAsTouched()">{{ value }}</button>`,
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
    this.onTouched();
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
  imports: [DatePicker, FormsModule],
  template: `<app-date-picker name="birthDate" [(ngModel)]="birthDate" />`,
})
export class ProfileEditor {
  birthDate: string | null = null;
}
