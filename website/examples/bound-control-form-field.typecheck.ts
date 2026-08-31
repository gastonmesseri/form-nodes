import { Component, model } from '@angular/core';
import { FormField, type FormValueControl } from '@angular/forms/signals';

import { field, form, injectBoundControl, required, type BoundControlError } from '@gem/ng-forms';

// Custom control component

@Component({
  selector: 'app-date-picker',
  template: `
    <input
      [value]="value() ?? ''"
      [disabled]="boundControl.disabled()"
      (input)="value.set($any($event.target).value)"
      (blur)="boundControl.markAsTouched()"
    />
    @if (boundControl.touched() && boundControl.invalid()) {
      <ul aria-live="polite">
        @for (error of boundControl.errors(); track $index) {
          <li>{{ errorMessage(error) }}</li>
        }
      </ul>
    }
  `,
})
export class DatePicker implements FormValueControl<string | null> {
  value = model<string | null>(null);

  boundControl = injectBoundControl<string | null>();

  errorMessage(error: BoundControlError) {
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
