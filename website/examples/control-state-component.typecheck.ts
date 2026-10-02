import { useControlState } from '@ngblocks/form-nodes';
import { Component, computed, model } from '@angular/core';

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
      [readonly]="controlState.readonly()"
      [required]="controlState.required()"
      [attr.aria-invalid]="controlState.invalid()"
      (input)="value.set($any($event.target).value)"
      (blur)="controlState.markAsTouched()"
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

  controlState = useControlState();

  shouldDisplayRequiredAsterisk = computed(() => this.controlState.required());

  isDisabled = computed(() => this.controlState.disabled());

  visibleErrors = computed(() => {
    return this.controlState.touched() ? this.controlState.errors() : [];
  });
}
