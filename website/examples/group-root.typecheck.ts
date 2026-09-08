import { Component } from '@angular/core';
import { field, FormNodeDirective, group } from '@ngblocks/form-nodes';

declare function loadProducts(filters: { query: string | null; category: string | null }): void;

@Component({
  selector: 'app-product-filters',
  imports: [FormNodeDirective],
  template: `
    <form [formNode]="filters">
      <input [formNode]="filters.query" placeholder="Search products" />

      <select [formNode]="filters.category">
        <option value="all">All categories</option>
        <option value="books">Books</option>
        <option value="music">Music</option>
      </select>

      <button type="button" (click)="applyFilters()">Apply filters</button>
      <button type="reset">Reset</button>
    </form>
  `,
})
export class ProductFilters {
  filters = group({
    query: field(''),
    category: field('all'),
  });

  applyFilters() {
    loadProducts(this.filters());
  }
}
