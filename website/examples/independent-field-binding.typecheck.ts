import { Component } from '@angular/core';
import { field, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <label>Search <input [formNode]="search" /></label>
    <p>Current search: {{ search() }}</p>
    <button type="button" (click)="search.set('')">Clear search</button>
  `,
})
export class SearchPage {
  search = field('');
}
