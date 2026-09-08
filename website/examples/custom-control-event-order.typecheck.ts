import { Component, inject, model, output } from '@angular/core';
import { field, form, FORM_NODE, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-description-input',
  template: `
    <textarea #text [value]="value()" [attr.aria-invalid]="binding.errors().length ? true : null" (input)="value.set(text.value)" (blur)="touch.emit()"></textarea>
  `,
})
export class DescriptionInput {
  binding = inject(FORM_NODE, { self: true });

  value = model('');

  touch = output<void>();
}

@Component({
  imports: [DescriptionInput, FormNodeDirective],
  template: `
    <app-description-input [formNode]="myForm.description"
      (valueChange)="onDescriptionChange()" (touch)="onDescriptionTouch()" />
  `,
})
export class DescriptionEditor {
  myForm = form({
    description: field.strict(''),
  });

  lastDescription = '';

  descriptionTouched = false;

  onDescriptionChange() {
    this.lastDescription = this.myForm.description();
  }

  onDescriptionTouch() {
    this.descriptionTouched = this.myForm.description.touched();
  }
}
