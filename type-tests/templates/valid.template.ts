import { Component, model } from '@angular/core';
import type { FormCheckboxControl, FormValueControl } from '@angular/forms/signals';

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

@Component({
  standalone: true,
  selector: 'valid-value-control',
  template: '',
})
class ValidValueControl implements FormValueControl<string> {
  value = model('');
}

@Component({
  standalone: true,
  selector: 'valid-checkbox-control',
  template: '',
})
class ValidCheckboxControl implements FormCheckboxControl {
  checked = model(false);
}

@Component({
  standalone: true,
  imports: [ValidValueControl, ValidCheckboxControl, FormNodeDirective],
  template: `
    <valid-value-control [formNode]="name" />
    <valid-checkbox-control [formNode]="active" />
  `,
})
class ValidSignalControlHost {
  name = field('David', { nullable: false });
  active = field(false, { nullable: false });
}

void [ValidFormNodeHost, ValidSignalControlHost];
