import { Component, input, model, signal } from '@angular/core';
import { email, field, form, required, FormNodeErrors, FormNodeDirective, useFormNodeState } from '@ngblocks/form-nodes';

// email-input.component.ts
@Component({
  selector: 'my-email-input',
  imports: [FormNodeErrors],
  template: `
    <label [for]="inputId()">{{ label() }}</label>
    <input
      type="email"
      autocomplete="email"
      [id]="inputId()"
      [value]="value() ?? ''"
      [disabled]="state.disabled()"
      [readOnly]="state.readonly()"
      [required]="state.required()"
      [attr.aria-invalid]="state.invalid()"
      [attr.aria-describedby]="inputId() + '-errors'"
      (input)="edit($event)" (blur)="state.markAsTouched()" 
    />
    <form-node-errors [id]="inputId() + '-errors'" [state]="state" [animate]="animateErrors()">
      <ng-template #message let-message>
        <span aria-hidden="true">!</span> {{ message }}
      </ng-template>
    </form-node-errors>
  `,
  host: { '[hidden]': 'state.hidden()' },
})
export class EmailInput {
  inputId = input.required<string>();

  label = input('Email');

  animateErrors = input(true);

  value = model<string | null>(null);

  state = useFormNodeState();

  edit(event: Event) {
    this.value.set((event.target as HTMLInputElement).value);
  }
}

// contact-editor.component.ts
@Component({
  selector: 'app-contact-editor',
  imports: [EmailInput, FormNodeDirective],
  template: `
    <form [formNode]="contact">
      <my-email-input inputId="primary-email" label="Primary email" [formNode]="contact.email" />
      <my-email-input inputId="backup-email" label="Backup email (optional)" [formNode]="contact.backupEmail" [animateErrors]="false" />
      <button type="submit">Continue</button>
      <button type="button" (click)="contact.resetToInitial()">Start over</button>
    </form>

    @if (submittedEmail(); as address) {
      <p>Submitted primary email: {{ address }}</p>
    }
  `,
})
export class ContactEditor {
  submittedEmail = signal<string | null>(null);

  contact = form({
    email: field('', [required('Enter your primary email address.'), email]),
    backupEmail: field('', [email]),
  }, {
    onSubmit: (value) => {
      this.submittedEmail.set(value.email);
    },
  });
}
