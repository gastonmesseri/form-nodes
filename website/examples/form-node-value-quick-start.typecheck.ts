import { Component, signal } from '@angular/core';
import { FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <label>Search <input [(formNodeValue)]="search" /></label>
    <p>Current search: {{ search() }}</p>
  `,
})
export class SearchPage {
  search = signal('');
}
