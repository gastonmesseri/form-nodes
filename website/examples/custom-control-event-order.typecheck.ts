import { Component, model, output } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-description-input',
  template: `
    <textarea #text [value]="value()" (input)="value.set(text.value)" (blur)="touch.emit()"></textarea>
  `,
})
export class DescriptionInput {
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
