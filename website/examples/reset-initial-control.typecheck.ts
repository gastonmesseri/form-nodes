import { Component } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <form [formNode]="form">
      <input [formNode]="form.name" />
      <button type="button" (click)="form.resetToInitial()">Restore initial values</button>
    </form>
  `,
})
export class ProfileEditor {
  form = form({
    name: field('Marco', { debounce: 300 }),
  });
}
