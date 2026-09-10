import { Component } from '@angular/core';

import { FormNodeDirective } from '../../../src/public-api';

@Component({
  imports: [FormNodeDirective],
  template: `<input #binding="formNode" [formNodeValue]="42" />{{ binding.node()().toUpperCase() }}`,
})
class InvalidStandaloneNodeHost {}

void InvalidStandaloneNodeHost;
