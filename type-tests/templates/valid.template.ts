import { Component } from '@angular/core';

import { field, form, FormNodeDirective } from '../../src/public-api';

@Component({
  standalone: true,
  imports: [FormNodeDirective],
  template: `
    <input [formNode]="name">
    <input [formNode]="profile.age">
  `,
})
class ValidFormNodeHost {
  readonly name = field('David', { nullable: false });
  readonly profile = form({ age: field(42, { nullable: false }) });
}

void ValidFormNodeHost;
