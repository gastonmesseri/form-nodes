import { Component } from '@angular/core';

import { field, FormNodeDirective } from '../../../src/public-api';

@Component({
  imports: [FormNodeDirective],
  template: `<input [formNode]="age" (formNodeModelChange)="$event.toUpperCase()" />`,
})
class InvalidModelOutputHost {
  age = field.strict(42);
}
