import { Component } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <input
      [formNode]="form.name"
      (formNodeChange)="onControlChange($event)"
      (formNodeModelChange)="onModelChange($event)"
    />
    <button (click)="onSetName()">Use Grace</button>
    <p>Control edits: {{ controlEdits.length }}</p>
    <p>All value changes: {{ valueChanges.length }}</p>
  `,
})
export class NameEditor {
  form = form({ name: field('Ada') });

  controlEdits: string[] = [];

  valueChanges: string[] = [];

  onControlChange(value: string) {
    this.controlEdits.push(value);
  }

  onModelChange(value: string) {
    this.valueChanges.push(value);
  }

  onSetName() {
    this.form.name.set('Grace');
  }
}
