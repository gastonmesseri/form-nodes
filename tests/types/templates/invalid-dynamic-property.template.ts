import { Component } from '@angular/core';

import { field, form, FormNode } from '../../../src/public-api';

@Component({
  standalone: true,
  imports: [FormNode],
  template: `<input [formNode]="profile.mistypedName">`,
})
class InvalidDynamicPropertyHost {
  readonly profile = form({ name: field('David') });
}

void InvalidDynamicPropertyHost;
