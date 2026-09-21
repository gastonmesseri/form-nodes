import { Component } from '@angular/core';

import { FormNodeDirective } from '../../../src/public-api';

@Component({
  imports: [FormNodeDirective],
  template: `<input [formNodeValue]="42" (formNodeValueChange)="$event.toUpperCase()" />`,
})
class InvalidStandaloneOutputHost {}

void InvalidStandaloneOutputHost;
