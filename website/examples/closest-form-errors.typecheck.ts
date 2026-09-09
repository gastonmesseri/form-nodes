import { Component, computed, input } from '@angular/core';
import { field, form, required, useClosestForm, FormNodeDirective, type FieldNode } from '@ngblocks/form-nodes';

// submission-errors.component.ts
@Component({
  selector: 'app-submission-errors',
  template: `
    @if (showErrors()) {
      @for (error of node().errors(); track $index) {
        <p>{{ error.message ?? error.kind }}</p>
      }
    }
  `,
})
export class SubmissionErrors {
  node = input.required<FieldNode>();
  closestForm = useClosestForm();
  showErrors = computed(() => {
    const node = this.node();
    return node.invalid() && (node.touched() || this.closestForm()?.$api.submitted() === true);
  });
}

// profile-editor.component.ts
@Component({
  imports: [FormNodeDirective, SubmissionErrors],
  template: `
    <form [formNode]="profile">
      <input [formNode]="profile.name" />
      <app-submission-errors [node]="profile.name" />
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
    </form>
  `,
})
export class ProfileEditor {
  profile = form({
    name: field('', [required]),
  }, {
    onSubmit: async value => { await this.save(value.name); },
  });

  async save(name: string | null) {
    // Replace with an application service call.
    await Promise.resolve(name);
  }
}
