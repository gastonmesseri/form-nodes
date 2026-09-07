import { Component, model, signal } from '@angular/core';
import { FormField, form, required, type FormValueControl } from '@angular/forms/signals';

import { useControlState, type ControlStateError } from 'form-nodes';

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
export class DatePicker implements FormValueControl<string> {
  value = model('');

  controlState = useControlState();

  errorMessage(error: ControlStateError) {
    return error.kind === 'required' ? 'Choose a date.' : 'The date is invalid.';
  }
}


// Parent form component

@Component({
  imports: [DatePicker, FormField],
  template: `<app-date-picker [formField]="profile.birthDate" />`,
})
export class ProfileEditor {
  value = signal({ birthDate: '' });

  profile = form(this.value, (path) => {
    required(path.birthDate);
  });
}
