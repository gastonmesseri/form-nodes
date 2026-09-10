import { Component } from '@angular/core';

import { field, FormNodeDirective } from '../../../src/public-api';

@Component({
  imports: [FormNodeDirective],
  template: `<input [formNode]="age" [formNodeValue]="'Ada'" />`,
})
class InvalidNodeValueHost {
  age = field.strict(42);
}

void InvalidNodeValueHost;
