import { Component, input, output } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-search-editor',
  imports: [FormNodeDirective],
  template: `<input [formNode]="form.query" />`,
})
export class SearchEditor {
  initialQuery = input('');
  search = output<string>();
  form = form({ query: field('') });

  ngOnInit() {
    this.form.patch({ query: this.initialQuery() });

    // Listen only after initialization; emit once typing has paused for 300 ms.
    // The form captures the component injector, so destruction cancels pending delivery.
    this.form.onValueChange(value => this.search.emit(value.query), { debounce: 300 });
  }
}
