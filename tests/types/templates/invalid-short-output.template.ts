import { Component } from '@angular/core';

import { field, FormNodeDirective } from '../../../src/public-api';

@Component({
  imports: [FormNodeDirective],
  template: `<input [formNode]="age" (formNodeChange)="$event.toUpperCase()" />`,
})
class InvalidShortOutputHost {
  age = field.strict(42);
}
