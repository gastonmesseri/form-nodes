import { Component, computed, signal } from '@angular/core';
import { field, form, required, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-document-editor',
  imports: [FormNodeDirective],
  template: `
    <form [formNode]="upload">
      <label>
        Cover image
        <input type="file" accept="image/*" [formNode]="upload.cover" />
      </label>
      <p>{{ coverName() }}</p>

      <label>
        Attachments
        <input type="file" multiple [formNode]="upload.attachments" />
      </label>
      @for (file of upload.attachments() ?? []; track file) {
        <p>{{ file.name }} ({{ file.size }} bytes)</p>
      }
      <button type="button" (click)="upload.cover.set(null)">Clear cover</button>
      <button type="button" (click)="upload.resetToInitial()">Start over</button>
    </form>

    <label>
      Standalone file
      <input type="file" [(formNodeValue)]="standaloneFile" />
    </label>
    <p>{{ standaloneFile()?.name ?? 'No file selected' }}</p>
  `,
})
export class DocumentEditor {
  upload = form({
    cover: field<File>(null, [required]),
    attachments: field<File[]>([]),
  });

  standaloneFile = signal<File | null>(null);

  coverName = computed(() => this.upload.cover()?.name ?? 'No file selected');
}
