import { Component } from '@angular/core';
import { email, field, form, required, minLength, pattern, FormNodeErrors, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-styled-contact-form',
  imports: [FormNodeErrors, FormNodeDirective],
  template: `
    <form [formNode]="contact">
      <label for="styled-email">Email</label>
      <input id="styled-email" type="email" [formNode]="contact.email" aria-describedby="styled-email-errors" />
      <form-node-errors id="styled-email-errors" [node]="contact.email">
        <ng-template #message let-message>
          <span class="error-message">
            <span class="error-icon" aria-hidden="true">!</span>
            <span>{{ message }}</span>
          </span>
        </ng-template>
      </form-node-errors>

      <label for="styled-username">Username</label>
      <input id="styled-username" [formNode]="contact.username" aria-describedby="styled-username-errors" />
      <form-node-errors id="styled-username-errors" class="rose-errors" [node]="contact.username" [maxMessages]="2">
        <ng-template #message let-firstMessage let-messages="messages">
          @if (messages.length === 1) {
            <p class="error-message">{{ firstMessage }}</p>
          } @else {
            <ul class="error-list">
              @for (message of messages; track $index) { <li>{{ message }}</li> }
            </ul>
          }
        </ng-template>
      </form-node-errors>
      <button type="submit">Check details</button>
    </form>
  `,
  styles: `
    .rose-errors {
      --form-node-errors-color: #be123c;
      --form-node-errors-font-size: 1rem;
      --form-node-errors-line-height: 1.5;
    }
    .error-message { display: flex; align-items: baseline; gap: 0.5rem; padding-block: 0.25rem; margin: 0; }
    .error-icon { border: 1px solid currentColor; border-radius: 50%; padding-inline: 0.35em; }
    .error-list { margin-block: 0; padding-left: 1.25rem; }
  `,
})
export class StyledContactForm {
  contact = form({
    email: field('', [required('Enter your email address.'), email]),
    username: field('', [required, minLength(4), pattern(/^[a-z]+$/)]),
  });
}
