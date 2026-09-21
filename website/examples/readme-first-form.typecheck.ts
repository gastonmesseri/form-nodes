import { Component, signal } from '@angular/core';
import { email, field, form, FormNodeDirective, minLength, required } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-registration',
  imports: [FormNodeDirective],
  template: `
    <form [formNode]="form">
      <label>
        Name
        <input [formNode]="form.name" />
      </label>
      @if (form.name.touched()) {
        @for (error of form.name.errors(); track error.kind) {
          <p>{{ error.message }}</p>
        }
      }

      <label>
        Email
        <input type="email" [formNode]="form.email" />
      </label>
      @if (form.email.touched()) {
        @for (error of form.email.errors(); track error.kind) {
          <p>{{ error.message }}</p>
        }
      }

      <button type="submit" [disabled]="form.submitting()">Register</button>
    </form>

    @if (registeredEmail()) {
      <p role="status">Registered {{ registeredEmail() }}</p>
    }
  `,
})
export class RegistrationComponent {
  registeredEmail = signal<string | null>(null);

  form = form({
    name: field('', [required, minLength(2)]),
    email: field('', [required, email]),
  }, {
    onSubmit: value => {
      this.registeredEmail.set(value.email);
    },
    onSubmitBlocked: invalidForm => invalidForm.focus(),
  });
}
