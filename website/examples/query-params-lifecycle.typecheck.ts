import { field, form } from '@ngblocks/form-nodes';
import { Component, Injector, inject, signal } from '@angular/core';
import { syncQueryParams, type QueryParamsSync } from '@ngblocks/form-nodes/router';

@Component({
  template: `
    <button (click)="onConnect()">Sync with URL</button>
    <button (click)="onDisconnect()">Stop syncing</button>
    @if (querySync?.pending()) { <p>Updating URL…</p> }
    @if (problem()) { <p>{{ problem() }}</p> }
  `,
})
export class OptionalSyncPage {
  injector = inject(Injector);

  form = form({ search: field.strict('') });

  problem = signal<string | null>(null);

  querySync?: QueryParamsSync<'q'>;

  onConnect() {
    this.querySync?.unsubscribe();
    this.problem.set(null);
    this.querySync = syncQueryParams({
      q: { source: this.form.search, defaultValue: '', clearOnDefault: true },
    }, {
      injector: this.injector,
      history: 'replace',
      onError: error => this.problem.set(`URL ${error.phase} failed for ${error.key ?? 'the navigation'}.`),
    });
  }

  onDisconnect() {
    this.querySync?.unsubscribe();
  }
}
