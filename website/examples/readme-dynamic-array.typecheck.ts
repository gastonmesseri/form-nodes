import { Component } from '@angular/core';
import { array, email, field, form, FormNodeDirective, required } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-contacts',
  imports: [FormNodeDirective],
  template: `
    @for (contact of form.contacts; track contact; let index = $index) {
      <fieldset>
        <legend>Contact {{ index + 1 }}</legend>
        <label>Name <input [formNode]="contact.name" /></label>
        <label>Email <input type="email" [formNode]="contact.email" /></label>
        <button type="button" (click)="form.contacts.removeAt(index)">Remove</button>
      </fieldset>
    }

    <button type="button" (click)="form.contacts.push()">Add contact</button>
    <p>{{ form.contacts.length() }} contacts</p>
  `,
})
export class ContactsComponent {
  form = form({
    contacts: array({
      name: field('', [required]),
      email: field('', [required, email]),
    }, {
      initialValue: [{ name: 'Ada', email: 'ada@example.com' }],
    }),
  });
}
