import { Component } from '@angular/core';
import { syncQueryParams } from '@ngblocks/form-nodes/router';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <input placeholder="Search" [formNode]="form.search" />
    <input type="number" [formNode]="form.page" />
    <p>Search in the URL: {{ querySync.params.q() }}</p>
  `,
})
export class SearchPage {
  form = form({
    search: field(''),
    page: field(1),
  });

  querySync = syncQueryParams({
    q: this.form.search,
    page: this.form.page,
  });
}
