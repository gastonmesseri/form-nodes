import { Component, input, model } from '@angular/core';

import { FormNode, field, form, useControlState, required } from '@gem/ng-forms';

// Custom control component

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
        (input)="value.set($any($event.target).value)"
        (blur)="controlState.markAsTouched()"
      />
    </label>
  `,
})
export class MyTextInput {
  label = input.required<string>();

  value = model('');

  controlState = useControlState();
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
