import { Component } from '@angular/core';

import { FormNode } from '../../../src/public-api';

@Component({
  standalone: true,
  imports: [FormNode],
  template: `<input [formNode]="name">`,
})
class InvalidValueHost {
  readonly name = 'David';
}

void InvalidValueHost;
