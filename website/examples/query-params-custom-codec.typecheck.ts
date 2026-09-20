import { Component } from '@angular/core';
import { field, form } from '@ngblocks/form-nodes';
import { syncQueryParams, type QueryParamCodec } from '@ngblocks/form-nodes/router';

type Sort = 'name' | 'date';

const sortCodec: QueryParamCodec<Sort> = {
  parse(values) {
    if (values.length !== 1 || (values[0] !== 'name' && values[0] !== 'date')) {
      throw new Error('Expected one sort value: name or date.');
    }
    return values[0];
  },
  serialize: value => [value],
};

@Component({
  template: '<button (click)="filters.sort.set(\'date\')">Sort by date</button>',
})
export class SortedResultsPage {
  filters = form({ sort: field.strict<Sort>('name') });

  querySync = syncQueryParams({
    sort: { source: this.filters.sort, codec: sortCodec, clearOnDefault: true },
  });
}
