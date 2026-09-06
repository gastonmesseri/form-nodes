import { Component, forwardRef } from '@angular/core';
import { FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, type ControlValueAccessor } from '@angular/forms';

import { useControlState } from 'form-nodes';

// Custom control component

@Component({
  selector: 'app-date-picker',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatePicker), multi: true }],
  template: `
    <button
      type="button"
      [disabled]="controlState.disabled()"
      (click)="select('2026-09-03')"
      (blur)="markAsTouched()"
    >
      {{ value }}
    </button>
  `,
})
export class DatePicker implements ControlValueAccessor {
  controlState = useControlState();
  value: string | null = null;

  select(value: string | null) {
    this.value = value;
    this.onChange(value);
  }

  markAsTouched() {
    this.controlState.markAsTouched();
    this.onTouched();
  }

  // ControlValueAccessor implementation
  private onChange = (_value: string | null) => {};
  private onTouched = () => {};
  registerOnChange(fn: any) { this.onChange = fn }
  registerOnTouched(fn: any) { this.onTouched = fn }
  writeValue(value: string | null) {
    this.value = value;
  }
}


// Parent form component

@Component({
  imports: [DatePicker, ReactiveFormsModule],
  template: `
    <form [formGroup]="profile">
      <app-date-picker formControlName="birthDate" />
    </form>
  `,
})
export class ProfileEditor {
  profile = new FormGroup({ birthDate: new FormControl<string | null>(null) });
}
