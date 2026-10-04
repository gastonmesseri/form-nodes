import { Component, computed } from '@angular/core';

import { FormNodeDirective } from '../../../src/public-api';

@Component({ imports: [FormNodeDirective], template: '<input [formNode]="value">' })
export class InvalidReadonlySignal {
  value = computed(() => 'readonly');
}
