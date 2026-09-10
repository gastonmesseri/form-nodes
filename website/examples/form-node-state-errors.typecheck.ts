import { Component, forwardRef, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { field, form, FormNodeDirective, useFormNodeState, provideFormNodeStateErrors } from '@ngblocks/form-nodes';

@Component({
  selector: 'custom-input-date',
  template: `
    <input
      aria-label="Appointment date"
      [value]="text()"
      [disabled]="state.disabled()"
      [attr.aria-invalid]="state.invalid()"
      (input)="onInput($any($event.target).value)"
      (blur)="onTouched()"
    />
    @if (state.touched() && state.hasError('invalidDate')) {
      <span>Enter a valid date.</span>
    }
  `,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CustomInputDate), multi: true },
    // Needed only when this CVA is also used with Angular 22 Signal Forms.
    provideFormNodeStateErrors(),
  ],
})
export class CustomInputDate implements ControlValueAccessor {
  text = signal('');

  state = useFormNodeState<Date | null>({
    errors: () => {
      const text = this.text();
      if (text && Number.isNaN(new Date(text).getTime())) {
        return { kind: 'invalidDate', message: 'Enter a valid date.' };
      }
    },
  });

  onChange = (_value: Date | null) => {};

  onTouched = () => {};

  writeValue(value: Date | null) {
    this.text.set(value ? value.toISOString().slice(0, 10) : '');
  }

  registerOnChange(callback: (value: Date | null) => void) {
    this.onChange = callback;
  }

  registerOnTouched(callback: () => void) {
    this.onTouched = callback;
  }

  onInput(text: string) {
    this.text.set(text);
    const date = text ? new Date(text) : null;
    this.onChange(date && !Number.isNaN(date.getTime()) ? date : null);
  }
}

@Component({
  selector: 'appointment-editor',
  imports: [CustomInputDate, FormNodeDirective],
  template: '<custom-input-date [formNode]="appointment.date" />',
})
export class AppointmentEditor {
  appointment = form({
    date: field<Date>(null),
  });
}
