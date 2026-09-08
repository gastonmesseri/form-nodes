import { Component } from '@angular/core';

import { field, FormNodeDirective } from '../../../src/public-api';

@Component({
  imports: [FormNodeDirective],
  template: `<input [formNode]="age" (formNodeValueChange)="$event.toUpperCase()" />`,
})
class InvalidOutputHost {
  age = field.strict(42);
}
