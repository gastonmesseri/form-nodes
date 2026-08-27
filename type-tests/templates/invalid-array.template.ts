import { Component } from '@angular/core';

import { array, field, FormNodeDirective } from '../../src/public-api';

@Component({
  standalone: true,
  imports: [FormNodeDirective],
  template: `<input [formNode]="names">`,
})
class InvalidArrayNodeHost {
  readonly names = array(field(''));
}

void InvalidArrayNodeHost;
