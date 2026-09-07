import { Component, signal } from '@angular/core';
import { email, field, form, FormNode, minLength, required } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-registration',
  imports: [FormNode],
  template: `
    <form [formNode]="myForm">
      <label>
        Name
        <input [formNode]="myForm.name" />
      </label>
      @if (myForm.name.touched()) {
        @for (error of myForm.name.errors(); track error.kind) {
          <p>{{ error.message }}</p>
        }
      }

      <label>
        Email
        <input type="email" [formNode]="myForm.email" />
      </label>
      @if (myForm.email.touched()) {
        @for (error of myForm.email.errors(); track error.kind) {
          <p>{{ error.message }}</p>
        }
      }

      <button type="submit" [disabled]="myForm.submitting()">Register</button>
    </form>

    @if (registeredEmail()) {
      <p role="status">Registered {{ registeredEmail() }}</p>
    }
  `,
})
export class RegistrationComponent {
  registeredEmail = signal<string | null>(null);

  myForm = form({
    name: field('', [required, minLength(2)]),
    email: field('', [required, email]),
  }, {
    onSubmit: value => {
      this.registeredEmail.set(value.email);
    },
    onSubmitBlocked: invalidForm => invalidForm.focus(),
  });
}
