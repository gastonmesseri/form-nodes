import { Component } from '@angular/core';
import { syncQueryParams } from '@ngblocks/form-nodes/router';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <input placeholder="Search" [formNode]="filters.search" />
    <input type="number" [formNode]="filters.page" />
    <p>Search in the URL: {{ querySync.params.q() }}</p>
  `,
})
export class SearchPage {
  filters = form({
    search: field(''),
    page: field(1),
  });

  querySync = syncQueryParams({
    q: this.filters.search,
    page: this.filters.page,
  });
}
