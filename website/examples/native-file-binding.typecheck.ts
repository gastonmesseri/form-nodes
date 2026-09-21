import { Component, computed } from '@angular/core';
import { field, form, required, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-document-editor',
  imports: [FormNodeDirective],
  template: `
    <form [formNode]="form">
      <label>
        Cover image
        <input type="file" accept="image/*" [formNode]="form.cover" />
      </label>
      <p>{{ coverName() }}</p>

      <label>
        Attachments
        <input type="file" multiple [formNode]="form.attachments" />
      </label>
      @for (file of form.attachments() ?? []; track file) {
        <p>{{ file.name }} ({{ file.size }} bytes)</p>
      }
      <button type="button" (click)="form.cover.set(null)">Clear cover</button>
      <button type="button" (click)="form.resetToInitial()">Start over</button>
    </form>
  `,
})
export class DocumentEditor {
  form = form({
    cover: field<File>(null, [required]),
    attachments: field<File[]>([]),
  });

  coverName = computed(() => this.form.cover()?.name ?? 'No file selected');
}
