import { Component, input, model } from '@angular/core';

import { FormNode, field, form, useFormNodeState, required } from 'form-nodes';

// Custom control component

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
        (input)="value.set($any($event.target).value)"
        (blur)="formNodeState.markAsTouched()"
      />
    </label>
  `,
})
export class MyTextInput {
  label = input.required<string>();

  value = model('');

  formNodeState = useFormNodeState();
}


// Parent form component

@Component({
  imports: [FormNode, MyTextInput],
  template: `<app-text-input label="Name" [formNode]="profile.name" />`,
})
export class ProfileEditor {
  profile = form({
    name: field('', [required])
  });
}
