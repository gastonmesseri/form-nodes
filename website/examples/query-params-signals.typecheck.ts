import { Component, signal } from '@angular/core';
import { syncQueryParams } from '@ngblocks/form-nodes/router';

@Component({
  template: `
    <p>Current page: {{ page() ?? 'Not selected' }}</p>
    <button (click)="onNextPage()">Next page</button>
  `,
})
export class ResultsPage {
  search = signal('');

  page = signal<number | null>(null);

  querySync = syncQueryParams({
    q: this.search,
    page: { source: this.page, serializer: 'integer', history: 'push' },
  });

  onNextPage() {
    this.page.update(value => (value ?? 0) + 1);
  }
}
