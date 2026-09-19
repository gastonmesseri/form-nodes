import { Component, signal } from '@angular/core';
import { syncQueryParams } from '@ngblocks/form-nodes/router';
import { field, form, array, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  imports: [FormNodeDirective],
  template: `
    <input [formNode]="filters.search" />
    <input type="number" [formNode]="filters.page" />
    <p>Search in the URL: {{ querySync.params.q() }}</p>
    @if (querySync.pending()) { <p>Updating URL…</p> }
  `,
})
export class SearchPage {
  filters = form({
    search: field.strict('', { debounce: 250 }),
    page: field.strict(1),
    archived: field.strict(false),
    tags: array(field.strict('')),
    options: { sort: field.strict('name'), includeArchived: field.strict(false) },
  });

  view = signal('list');

  querySync = syncQueryParams({
    q: { source: this.filters.search, defaultValue: '', clearOnDefault: true },
    page: { source: this.filters.page, codec: 'integer', defaultValue: 1, history: 'push' },
    archived: this.filters.archived,
    view: this.view,
    tag: { source: this.filters.tags, codec: 'array' },
    options: { source: this.filters.options, codec: 'json' },
  }, {
    onError: error => console.error(error.phase, error.key, error.cause),
  });

  readUrl() {
    const rawPage = this.querySync.params.page(); // string | null, before the integer codec
    const tags = this.filters.tags(); // All parsed values from the array source.
    return { rawPage, tags };
  }

  disconnect() {
    this.querySync.unsubscribe(); // Optional; injector cleanup is automatic.
  }
}
