import { Component, model } from '@angular/core';
import { FormField, type FormValueControl } from '@angular/forms/signals';

import { field, form, useControlState, required, type ControlStateError } from 'form-nodes';

// Custom control component

@Component({
  selector: 'app-date-picker',
  template: `
    <input
      [value]="value() ?? ''"
      [disabled]="controlState.disabled()"
      (input)="value.set($any($event.target).value)"
      (blur)="controlState.markAsTouched()"
    />
    @if (controlState.touched() && controlState.invalid()) {
      <ul aria-live="polite">
        @for (error of controlState.errors(); track $index) {
          <li>{{ errorMessage(error) }}</li>
        }
      </ul>
    }
  `,
})
export class DatePicker implements FormValueControl<string | null> {
  value = model<string | null>(null);

  controlState = useControlState();

  errorMessage(error: ControlStateError) {
    return error.kind === 'required' ? 'Choose a date.' : 'The date is invalid.';
  }
}


// Parent form component

@Component({
  imports: [DatePicker, FormField],
  template: `<app-date-picker [formField]="profile.birthDate.$field" />`,
})
export class ProfileEditor {
  profile = form({
    birthDate: field<string | null>(null, [required])
  });
}
