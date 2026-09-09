import { Component } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <form [formNode]="myForm">
      <input [formNode]="myForm.name" />
      <button type="button" (click)="myForm.resetToInitial()">Restore initial values</button>
    </form>
  `,
})
export class ProfileEditor {
  myForm = form({
    name: field('Marco', { debounce: 300 }),
  });
}
