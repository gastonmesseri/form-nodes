import { Component, viewChild } from '@angular/core';
import { field, form, FormNode } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNode],
  template: `
    <label>
      Name
      <input #nameBinding="formNode" [formNode]="myForm.name" />
    </label>

    <label>
      Age
      <input type="number" [formNode]="myForm.age" />
    </label>

    <p>{{ myForm.name() }} · {{ myForm.age() }}</p>
    <button type="button" (click)="focusName()">Focus name</button>
  `,
})
export class ProfileEditor {
  myForm = form({
    name: field(''),
    age: field<number>(),
  });
  readonly nameBinding = viewChild.required<FormNode<typeof this.myForm.name>>('nameBinding');

  focusName() {
    this.nameBinding().focus();
  }
}
