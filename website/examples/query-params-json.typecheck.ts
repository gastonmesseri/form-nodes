import { Component } from '@angular/core';
import { field, form } from '@ngblocks/form-nodes';
import { syncQueryParams } from '@ngblocks/form-nodes/router';

@Component({
  template: '<button (click)="includeArchived()">Include archived</button>',
})
export class SavedSearchPage {
  form = form({
    search: field.strict(''),
    includeArchived: field.strict(false),
  });

  querySync = syncQueryParams({
    filters: { source: this.form, serializer: 'json' },
  });

  includeArchived() {
    this.form.patch({ includeArchived: true });
  }
}
