import { Component } from '@angular/core';
import { field, form, required, FormNodeDirective, type FormNodeSubmitEvent } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <form [formNode]="profile"
      (formNodeSubmit)="recordAttempt($event)"
      (formNodeSubmitBlocked)="showBlockedMessage($event)">
      <input [formNode]="profile.name">
      <button type="submit">Save</button>
      <p>{{ message }}</p>
    </form>
  `,
})
export class ProfileComponent {
  profile = form({
    name: field('', [required], { debounce: 'blur' }),
  }, {
    submitWhen: 'valid',
    onSubmit: async value => {
      await this.saveProfile(value);
    },
  });
  message = '';

  recordAttempt(event: FormNodeSubmitEvent<typeof this.profile>) {
    this.message = `Submitting ${event.value.name ?? ''}`;
  }

  showBlockedMessage(event: FormNodeSubmitEvent<typeof this.profile>) {
    this.message = event.form.$api.pending() ? 'Please wait for validation.' : 'Please correct the errors.';
  }

  async saveProfile(value: { name: string | null }) {
    // Replace this with your application service.
    console.log(value);
  }
}
