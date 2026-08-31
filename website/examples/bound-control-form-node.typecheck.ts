import { Component, input, model } from '@angular/core';

import { FormNode, field, form, injectBoundControl, required } from '@gem/ng-forms';

// Custom control component

@Component({
  selector: 'app-text-input',
  template: `
    <label>
      {{ label() }}
      @if (boundControl.required()) {
        <span aria-hidden="true">*</span>
      }
      <input
        [value]="value()"
        [disabled]="boundControl.disabled()"
        [required]="boundControl.required()"
        (input)="value.set($any($event.target).value)"
        (blur)="boundControl.markAsTouched()"
      />
    </label>
  `,
})
export class MyTextInput {
  label = input.required<string>();

  value = model('');

  boundControl = injectBoundControl<string>();
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
