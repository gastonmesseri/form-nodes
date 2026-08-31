import { Component, model } from '@angular/core';
import type { FormCheckboxControl, FormValueControl } from '@angular/forms/signals';

import { array, field, form, FormNodeDirective } from '../../src/public-api';

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
  selector: 'valid-profile-control',
  template: '',
})
class ValidProfileControl implements FormValueControl<{ name: string | null }> {
  value = model({ name: null as string | null });
}

@Component({
  standalone: true,
  selector: 'valid-people-control',
  template: '',
})
class ValidPeopleControl implements FormValueControl<{ name: string | null }[]> {
  value = model<{ name: string | null }[]>([]);
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

@Component({
  standalone: true,
  imports: [ValidProfileControl, ValidPeopleControl, FormNodeDirective],
  template: `
    <valid-profile-control [formNode]="profile" />
    <valid-people-control [formNode]="people" />
  `,
})
class ValidAggregateControlHost {
  profile = form({ name: field('David') });
  people = array({ name: field('') }, []);
}

void [ValidFormNodeHost, ValidSignalControlHost, ValidAggregateControlHost];
