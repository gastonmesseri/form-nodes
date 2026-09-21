import { Component } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNodeDirective],
  template: `
    <!-- Text input binding -->
    <label>
      Name
      <input [formNode]="form.name" />
    </label>

    <!-- Number input binding -->
    <label>
      Age
      <input type="number" [formNode]="form.age" />
    </label>

    <!-- Email input binding -->
    <label>
      Email
      <input type="email" [formNode]="form.email" />
    </label>

    <!-- Radio group: multiple options, one field -->
    <fieldset>
      <legend>Preferred contact method</legend>

      <label>
        <input type="radio" value="email" [formNode]="form.contactMethod" />
        Email
      </label>

      <label>
        <input type="radio" value="phone" [formNode]="form.contactMethod" />
        Phone
      </label>
    </fieldset>

    <!-- Select binding -->
    <label>
      Country
      <select [formNode]="form.country">
        <option value="CH">Switzerland</option>
        <option value="ES">Spain</option>
      </select>
    </label>

    <!-- Checkbox binding -->
    <label>
      <input type="checkbox" [formNode]="form.newsletter" />
      Receive the newsletter
    </label>

    <!-- Textarea binding -->
    <label>
      About you
      <textarea rows="3" [formNode]="form.bio"></textarea>
    </label>

    <!-- Read the current field values -->
    <p>Current name: {{ form.name() }}</p>
    <p>Current age: {{ form.age() }}</p>
    <p>Current email: {{ form.email() }}</p>
    <p>Preferred contact method: {{ form.contactMethod() }}</p>
    <p>Country code: {{ form.country() }}</p>
    <p>Newsletter enabled: {{ form.newsletter() }}</p>
    <p>Bio: {{ form.bio() }}</p>
  `,
})
export class ProfileEditor {
  form = form({
    name: field(''),
    age: field<number>(null),
    email: field(''),
    contactMethod: field('email'),
    country: field('CH'),
    newsletter: field.strict(false),
    bio: field(''),
  });
}
