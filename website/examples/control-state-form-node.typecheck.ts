import { Component, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { FormNodeDirective, field, form, useControlState, required, minLength } from '@ngblocks/form-nodes';

// text-input.component.ts
@Component({
  selector: 'app-text-input',
  template: `
    <label>
      {{ label() }}
      @if (controlState.required()) {
        <span aria-hidden="true">*</span>
      }
      <input
        [value]="value()"
        [disabled]="controlState.disabled()"
        [required]="controlState.required()"
        [readOnly]="controlState.readonly()"
        [attr.minlength]="controlState.minLength()"
        [attr.aria-invalid]="controlState.invalid()"
        (input)="value.set($any($event.target).value)"
        (blur)="controlState.markAsTouched()"
      />
    </label>
    @if (controlState.touched()) {
      @for (error of controlState.errors(); track $index) {
        <p role="alert">{{ error.message }}</p>
      }
    }
  `,
})
export class MyTextInput implements FormValueControl<string> {
  label = input.required<string>();

  value = model('');

  controlState = useControlState();
}

// profile-editor.component.ts
@Component({
  imports: [FormNodeDirective, MyTextInput],
  template: `
    <app-text-input label="Name" [formNode]="form.name" />
  `,
})
export class ProfileEditor {
  form = form({
    name: field('', [required, minLength(3)], {
      // Keep automatic input writes off, even if an ancestor provider enables them.
      syncInputs: false,
    }),
  });
}
