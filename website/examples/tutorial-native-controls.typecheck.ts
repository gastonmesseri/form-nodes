import { Component } from '@angular/core';

import { field, form, FormNode } from 'form-nodes';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNode],
  template: `
    <label>
      Name
      <input [formNode]="myForm.name" />
    </label>

    <label>
      Age
      <input type="number" [formNode]="myForm.age" />
    </label>

    <label>
      Email
      <input type="email" [formNode]="myForm.email" />
    </label>

    <label>
      Country
      <select [formNode]="myForm.country">
        <option value="CH">Switzerland</option>
        <option value="ES">Spain</option>
      </select>
    </label>

    <label>
      <input type="checkbox" [formNode]="myForm.newsletter" />
      Receive the newsletter
    </label>

    <label>
      About you
      <textarea rows="3" [formNode]="myForm.bio"></textarea>
    </label>

    <p>Current name: {{ myForm.name() }}</p>
    <p>Current age: {{ myForm.age() }}</p>
    <p>Current email: {{ myForm.email() }}</p>
    <p>Country code: {{ myForm.country() }}</p>
    <p>Newsletter enabled: {{ myForm.newsletter() }}</p>
    <p>Bio: {{ myForm.bio() }}</p>
  `,
})
export class ProfileEditor {
  myForm = form({
    name: field(''),
    age: field<number>(null),
    email: field(''),
    country: field('CH'),
    newsletter: field.strict(false),
    bio: field(''),
  });
}
