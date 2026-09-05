import { Component } from '@angular/core';

import { field, form, FormNode } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNode],
  template: `
    <!-- Text input binding -->
    <label>
      Name
      <input [formNode]="myForm.name" />
    </label>

    <!-- Number input binding -->
    <label>
      Age
      <input type="number" [formNode]="myForm.age" />
    </label>

    <!-- Email input binding -->
    <label>
      Email
      <input type="email" [formNode]="myForm.email" />
    </label>

    <!-- Radio group: multiple options, one field -->
    <fieldset>
      <legend>Preferred contact method</legend>

      <label>
        <input type="radio" value="email" [formNode]="myForm.contactMethod" />
        Email
      </label>

      <label>
        <input type="radio" value="phone" [formNode]="myForm.contactMethod" />
        Phone
      </label>
    </fieldset>

    <!-- Select binding -->
    <label>
      Country
      <select [formNode]="myForm.country">
        <option value="CH">Switzerland</option>
        <option value="ES">Spain</option>
      </select>
    </label>

    <!-- Checkbox binding -->
    <label>
      <input type="checkbox" [formNode]="myForm.newsletter" />
      Receive the newsletter
    </label>

    <!-- Textarea binding -->
    <label>
      About you
      <textarea rows="3" [formNode]="myForm.bio"></textarea>
    </label>

    <!-- Read the current field values -->
    <p>Current name: {{ myForm.name() }}</p>
    <p>Current age: {{ myForm.age() }}</p>
    <p>Current email: {{ myForm.email() }}</p>
    <p>Preferred contact method: {{ myForm.contactMethod() }}</p>
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
    contactMethod: field('email'),
    country: field('CH'),
    newsletter: field.strict(false),
    bio: field(''),
  });
}
