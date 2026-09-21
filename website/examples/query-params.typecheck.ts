import { Component, signal } from '@angular/core';
import { syncQueryParams } from '@ngblocks/form-nodes/router';
import { field, form, array, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <input [formNode]="form.search" />
    <input type="number" [formNode]="form.page" />
    <p>Search in the URL: {{ querySync.params.q() }}</p>
    @if (querySync.pending()) { <p>Updating URL…</p> }
  `,
})
export class SearchPage {
  form = form({
    search: field.strict('', { debounce: 250 }),
    page: field.strict(1),
    archived: field.strict(false),
    tags: array(field.strict('')),
    options: { sort: field.strict('name'), includeArchived: field.strict(false) },
  });

  view = signal('list');

  querySync = syncQueryParams({
    q: { source: this.form.search, defaultValue: '', clearOnDefault: true },
    page: { source: this.form.page, serializer: 'integer', defaultValue: 1, history: 'push' },
    archived: this.form.archived,
    view: this.view,
    tag: { source: this.form.tags, serializer: 'array' },
    options: { source: this.form.options, serializer: 'json' },
  }, {
    onError: error => console.error(error.phase, error.key, error.cause),
  });

  readUrl() {
    const rawPage = this.querySync.params.page(); // string | null, before the integer serializer
    const tags = this.form.tags(); // All parsed values from the array source.
    return { rawPage, tags };
  }

  disconnect() {
    this.querySync.unsubscribe(); // Optional; injector cleanup is automatic.
  }
}
