import { Component, viewChild } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNodeDirective],
  template: `
    <label>
      Name
      <input #nameBinding="formNode" [formNode]="form.name" />
    </label>

    <label>
      Age
      <input type="number" [formNode]="form.age" />
    </label>

    <p>{{ form.name() }} · {{ form.age() }}</p>
    <button type="button" (click)="focusName()">Focus name</button>
  `,
})
export class ProfileEditor {
  form = form({
    name: field(''),
    age: field<number>(),
  });
  readonly nameBinding = viewChild.required<FormNodeDirective<typeof this.form.name>>('nameBinding');

  focusName() {
    this.nameBinding().focus();
  }
}
