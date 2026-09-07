import { Component, Injector, forwardRef, inject, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, NgControl, type ControlValueAccessor } from '@angular/forms';

import { FormNode, field, form, required } from 'form-nodes';

@Component({
  selector: 'app-date-input',
  template: `
    <input
      #input
      placeholder="YYYY-MM-DD"
      [value]="text()"
      [disabled]="disabled()"
      (input)="changeDate(input.value)"
      (blur)="onTouched()"
    />
  `,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateInput), multi: true }],
})
export class DateInput implements ControlValueAccessor {
  injector = inject(Injector);

  ngControl: NgControl | undefined;

  text = signal('');

  disabled = signal(false);

  onChange: (value: Date | null) => void = () => {};

  onTouched: () => void = () => {};

  ngAfterContentInit() {
    this.ngControl = this.injector.get(NgControl);
  }

  writeValue(value: Date | null) {
    this.text.set(value?.toISOString().slice(0, 10) ?? '');
    this.ngControl?.control?.setErrors(null);
  }

  registerOnChange(callback: (value: Date | null) => void) {
    this.onChange = callback;
  }

  registerOnTouched(callback: () => void) {
    this.onTouched = callback;
  }

  setDisabledState(disabled: boolean) {
    this.disabled.set(disabled);
  }

  changeDate(text: string) {
    this.text.set(text);
    const date = new Date(`${text}T00:00:00.000Z`);
    const valid = !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
    this.onChange(valid ? date : null);
    this.ngControl!.control!.setErrors(text && !valid ? {
      invalidDateFormat: { message: 'Enter a date as YYYY-MM-DD.', actual: text },
    } : null);
  }
}

@Component({
  imports: [FormNode, DateInput],
  template: `
    <app-date-input [formNode]="myForm.appointment" />
    @for (error of myForm.appointment.errors(); track error) {
      <p>{{ error.message }}</p>
    }
    <button [disabled]="!myForm.valid()">Continue</button>
  `,
})
export class AppointmentEditor {
  myForm = form({
    appointment: field<Date | null>(null, [required]),
  });
}
