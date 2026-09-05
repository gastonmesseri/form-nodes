import { Component, computed, model } from '@angular/core';

import { useFormNodeState } from 'form-nodes';

@Component({
  selector: 'my-control-component',
  template: `
    <label for="my-control">
      Name
      @if (shouldDisplayRequiredAsterisk()) {
        <span aria-hidden="true">*</span>
      }
    </label>

    <input
      id="my-control"
      [value]="value() ?? ''"
      [disabled]="isDisabled()"
      [readonly]="formNodeState.readonly()"
      [required]="formNodeState.required()"
      [attr.aria-invalid]="formNodeState.invalid()"
      (input)="value.set($any($event.target).value)"
      (blur)="formNodeState.markAsTouched()"
    />

    @if (visibleErrors().length) {
      <ul aria-live="polite">
        @for (error of visibleErrors(); track $index) {
          <li>{{ error.kind }}</li>
        }
      </ul>
    }
  `,
})
export class MyControlComponent {
  value = model<string | null>(null);

  formNodeState = useFormNodeState();

  shouldDisplayRequiredAsterisk = computed(() => this.formNodeState.required());

  isDisabled = computed(() => this.formNodeState.disabled());

  visibleErrors = computed(() => {
    return this.formNodeState.touched() ? this.formNodeState.errors() : [];
  });
}
