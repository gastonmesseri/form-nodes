import { Component, model } from '@angular/core';

import { useControlState } from 'form-nodes';

@Component({
  selector: 'my-control-component',
  template: `
    <label for="my-control">
      Name
      @if (controlState.required()) {
        <span aria-hidden="true">*</span>
      }
    </label>

    <input
      id="my-control"
      [value]="value() ?? ''"
      [disabled]="controlState.disabled()"
      [readonly]="controlState.readonly()"
      [required]="controlState.required()"
      [attr.aria-invalid]="controlState.invalid()"
      (input)="value.set($any($event.target).value)"
      (blur)="controlState.markAsTouched()"
    />

    @if (controlState.touched() && controlState.errors().length) {
      <ul aria-live="polite">
        @for (error of controlState.errors(); track $index) {
          <li>{{ error.kind }}</li>
        }
      </ul>
    }
  `,
})
export class MyControlComponent {
  value = model<string | null>(null);

  controlState = useControlState();
}
