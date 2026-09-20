import { Component, signal } from '@angular/core';
import { syncQueryParams } from '@ngblocks/form-nodes/router';

@Component({
  template: `
    <p>Current page: {{ page() ?? 'Not selected' }}</p>
    <button (click)="nextPage()">Next page</button>
  `,
})
export class ResultsPage {
  search = signal('');

  page = signal<number | null>(null);

  querySync = syncQueryParams({
    q: this.search,
    page: { source: this.page, codec: 'integer', history: 'push' },
  });

  nextPage() {
    this.page.update(value => (value ?? 0) + 1);
  }
}
