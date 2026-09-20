import { Component } from '@angular/core';
import { field, form } from '@ngblocks/form-nodes';
import { syncQueryParams } from '@ngblocks/form-nodes/router';

@Component({
  template: '<button (click)="includeArchived()">Include archived</button>',
})
export class SavedSearchPage {
  filters = form({
    search: field.strict(''),
    includeArchived: field.strict(false),
  });

  querySync = syncQueryParams({
    filters: { source: this.filters, serializer: 'json' },
  });

  includeArchived() {
    this.filters.patch({ includeArchived: true });
  }
}
