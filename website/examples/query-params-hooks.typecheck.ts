import { Component, signal } from '@angular/core';
import { field, form } from '@ngblocks/form-nodes';
import { syncQueryParams } from '@ngblocks/form-nodes/router';

@Component({
  template: `
    <p>Opened with: {{ initialSearch() }}</p>
    <p>URL filters: {{ restored().q }}, page {{ restored().page }}</p>
  `,
})
export class SearchPage {
  filters = form({ search: field.strict(''), page: field.strict(1) });

  initialSearch = signal('');

  restored = signal({ q: '', page: 1 });

  querySync = syncQueryParams({
    q: this.filters.search,
    page: { source: this.filters.page, serializer: 'integer', history: 'push' },
  }, {
    onInitialUrlSync: ({ values }) => {
      this.initialSearch.set(values.q);
    },
    onUrlSync: ({ reason, values }) => {
      this.restored.set(values);
      console.log(reason, values.q, values.page);
    },
  });
}
