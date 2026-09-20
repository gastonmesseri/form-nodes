import { Component } from '@angular/core';
import { array, field, form } from '@ngblocks/form-nodes';
import { syncQueryParams } from '@ngblocks/form-nodes/router';

@Component({
  template: '<button (click)="selectFilters()">Select filters</button>',
})
export class FilterPage {
  filters = form({
    tags: field.strict<string[]>([]),
    selectedIds: array(field.strict(0)),
  });

  querySync = syncQueryParams({
    tag: { source: this.filters.tags, serializer: 'array' },
    ids: { source: this.filters.selectedIds, serializer: 'json' },
  });

  selectFilters() {
    this.filters.tags.set(['angular', 'forms']);
    this.filters.selectedIds.set([10, 20]);
  }
}
