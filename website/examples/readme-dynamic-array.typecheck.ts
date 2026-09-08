import { Component } from '@angular/core';
import { array, email, field, form, FormNodeDirective, required } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-contacts',
  imports: [FormNodeDirective],
  template: `
    @for (contact of myForm.contacts; track contact; let index = $index) {
      <fieldset>
        <legend>Contact {{ index + 1 }}</legend>
        <label>Name <input [formNode]="contact.name" /></label>
        <label>Email <input type="email" [formNode]="contact.email" /></label>
        <button type="button" (click)="myForm.contacts.removeAt(index)">Remove</button>
      </fieldset>
    }

    <button type="button" (click)="myForm.contacts.push()">Add contact</button>
    <p>{{ myForm.contacts.length() }} contacts</p>
  `,
})
export class ContactsComponent {
  myForm = form({
    contacts: array({
      name: field('', [required]),
      email: field('', [required, email]),
    }, {
      initialValue: [{ name: 'Ada', email: 'ada@example.com' }],
    }),
  });
}
