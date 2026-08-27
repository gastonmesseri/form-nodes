import { Component } from '@angular/core';

import { field, form, FormNodeDirective } from '../../src/public-api';

@Component({
  standalone: true,
  imports: [FormNodeDirective],
  template: `<input [formNode]="profile">`,
})
class InvalidFormNodeHost {
  readonly profile = form({ name: field('David') });
}

void InvalidFormNodeHost;
