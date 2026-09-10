import { Component, signal, viewChild } from '@angular/core';
import { field, form, required, FormNodeDirective, type FieldNode } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-contact-editor',
  imports: [FormNodeDirective],
  template: `
    <label>
      Suggested name
      <input #suggestion="formNode" [formNodeValue]="suggestedName()"
        (formNodeValueChange)="lastEdit.set($event)" />
    </label>
    <p>Local value: {{ suggestion.node()() }}</p>
    <p>Last edit: {{ lastEdit() }}</p>

    <label>
      Search
      <input [(formNodeValue)]="search" />
    </label>

    <label>
      Contact name
      <input [formNode]="contact.name" [formNodeValue]="loadedName()" />
    </label>
    @if (contact.name.touched() && contact.name.invalid()) {
      <p>A contact name is required.</p>
    }
  `,
})
export class ContactEditor {
  suggestedName = signal('Ada');

  lastEdit = signal('');

  search = signal('');

  loadedName = signal('Grace');

  contact = form({
    name: field('', required),
  });

  suggestion = viewChild.required<FormNodeDirective<FieldNode<string>>>('suggestion');
}
