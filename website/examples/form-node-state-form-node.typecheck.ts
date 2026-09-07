import { Component, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { FormNode, field, form, useFormNodeState, required, minLength } from '@ngblocks/form-nodes';

// text-input.component.ts
@Component({
  selector: 'app-text-input',
  template: `
    <label>
      {{ label() }}
      @if (formNodeState.required()) {
        <span aria-hidden="true">*</span>
      }
      <input
        [value]="value()"
        [disabled]="formNodeState.disabled()"
        [required]="formNodeState.required()"
        [readOnly]="formNodeState.readonly()"
        [attr.minlength]="formNodeState.minLength()"
        [attr.aria-invalid]="formNodeState.invalid()"
        (input)="value.set($any($event.target).value)"
        (blur)="formNodeState.markAsTouched()"
      />
    </label>
    @if (formNodeState.touched()) {
      @for (error of formNodeState.errors(); track $index) {
        <p role="alert">{{ error.message }}</p>
      }
    }
  `,
})
export class MyTextInput implements FormValueControl<string> {
  label = input.required<string>();

  value = model('');

  formNodeState = useFormNodeState();
}

// profile-editor.component.ts
@Component({
  imports: [FormNode, MyTextInput],
  template: `<app-text-input label="Name" [formNode]="profile.name" />`,
})
export class ProfileEditor {
  profile = form({
    name: field('', [required, minLength(3)], {
      // Keep automatic input writes off, even if an ancestor provider enables them.
      syncInputs: false,
    }),
  });
}
