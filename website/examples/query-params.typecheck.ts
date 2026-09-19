import { Component } from '@angular/core';
import { syncQueryParams } from '@ngblocks/form-nodes/router';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

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
    tags: field.strict<string[]>([]),
    options: field.strict({ sort: 'name', includeArchived: false }),
  });

  querySync = syncQueryParams({
    q: { field: this.filters.search, defaultValue: '', clearOnDefault: true },
    page: { field: this.filters.page, codec: 'integer', defaultValue: 1, history: 'push' },
    archived: this.filters.archived,
    tag: { field: this.filters.tags, codec: 'array' },
    options: { field: this.filters.options, codec: 'json' },
  }, {
    onError: error => console.error(error.phase, error.key, error.cause),
  });

  readUrl() {
    const rawPage = this.querySync.params.page(); // string | null, before the integer codec
    const tags = this.querySync.paramMap().getAll('tag'); // All repeated values, before codec parsing.
    return { rawPage, tags };
  }

  disconnect() {
    this.querySync.unsubscribe(); // Optional; injector cleanup is automatic.
  }
}
