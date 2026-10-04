import { Component, signal } from '@angular/core';

import { FormNodeDirective } from '../../../src/public-api';

@Component({ imports: [FormNodeDirective], template: '<input [formNode]="value" (formNodeChange)="$event.toUpperCase()">' })
export class InvalidSignalOutput {
  value = signal(42);
}
