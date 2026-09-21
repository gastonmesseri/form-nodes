import { Component, forwardRef } from '@angular/core';
import { useFormNodeState } from '@ngblocks/form-nodes';
import { FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, type ControlValueAccessor } from '@angular/forms';

// Custom control component

@Component({
  selector: 'app-date-picker',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatePicker), multi: true }],
  template: `
    <button type="button" [disabled]="formNodeState.disabled()" (click)="onSelectDate('2026-09-03')" (blur)="onBlur()">
      {{ value }}
    </button>
  `,
})
export class DatePicker implements ControlValueAccessor {
  formNodeState = useFormNodeState();
  value: string | null = null;

  onSelectDate(value: string | null) {
    this.value = value;
    this.onChange(value);
  }

  onBlur() {
    this.formNodeState.markAsTouched();
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
