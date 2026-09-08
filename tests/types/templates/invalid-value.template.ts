import { Component } from '@angular/core';

import { FormNodeDirective } from '../../../src/public-api';

@Component({
  standalone: true,
  imports: [FormNodeDirective],
  template: `<input [formNode]="name">`,
})
class InvalidValueHost {
  readonly name = 'David';
}

void InvalidValueHost;
