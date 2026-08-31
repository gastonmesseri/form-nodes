import { Component, model } from '@angular/core';

import { injectBoundControl } from '@gem/ng-forms';

@Component({
  selector: 'my-control-component',
  template: `
    <label for="my-control">
      Name
      @if (boundControl.required()) {
        <span aria-hidden="true">*</span>
      }
    </label>

    <input
      id="my-control"
      [value]="value() ?? ''"
      [disabled]="boundControl.disabled()"
      [readonly]="boundControl.readonly()"
      [required]="boundControl.required()"
      [attr.aria-invalid]="boundControl.invalid()"
      (input)="value.set($any($event.target).value)"
      (blur)="boundControl.markAsTouched()"
    />

    @if (boundControl.touched() && boundControl.errors().length) {
      <ul aria-live="polite">
        @for (error of boundControl.errors(); track $index) {
          <li>{{ error.kind }}</li>
        }
      </ul>
    }
  `,
})
export class MyControlComponent {
  value = model<string | null>(null);

  boundControl = injectBoundControl<string | null>();
}
