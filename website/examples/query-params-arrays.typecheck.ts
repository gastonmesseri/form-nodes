import { Component } from '@angular/core';
import { array, field, form } from '@ngblocks/form-nodes';
import { syncQueryParams } from '@ngblocks/form-nodes/router';

@Component({
  template: '<button (click)="selectFilters()">Select filters</button>',
})
export class FilterPage {
  form = form({
    tags: field.strict<string[]>([]),
    selectedIds: array(field.strict(0)),
  });

  querySync = syncQueryParams({
    tag: { source: this.form.tags, serializer: 'array' },
    ids: { source: this.form.selectedIds, serializer: 'json' },
  });

  selectFilters() {
    this.form.tags.set(['angular', 'forms']);
    this.form.selectedIds.set([10, 20]);
  }
}
