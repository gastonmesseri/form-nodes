import { Component, model, viewChild } from '@angular/core';
import { type FormCheckboxControl, type FormValueControl } from '@angular/forms/signals';

import { array, field, form, FormNodeDirective } from '../../../src/public-api';

@Component({
  standalone: true,
  imports: [FormNodeDirective],
  template: `
    <input #binding="formNode" [formNode]="name" (formNodeValueChange)="$event.toUpperCase()"
      (formNodeControlValueChange)="$event.toUpperCase()">
    <input [formNode]="profile.age" (formNodeValueChange)="$event.toFixed()"
      (formNodeControlValueChange)="$event.toFixed()">
    @if (profile.get('dynamicName'); as dynamicName) {
      <input [formNode]="dynamicName">
    }
    {{ binding.node()() }}
    {{ binding.errors().length }}
    <button (click)="binding.focus(); binding.flush(); binding.reset()">Reset</button>
  `,
})
class ValidFormNodeHost {
  readonly name = field.strict('David');
  readonly profile = form({ age: field.strict(42) });
  readonly dynamicName = this.profile.add('dynamicName', field('Ada'));
  readonly nameBinding = viewChild.required<FormNodeDirective<typeof this.name>>('binding');

  focusName() {
    this.nameBinding().focus();
    this.nameBinding().errors();
  }
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
    <valid-checkbox-control [formNode]="active" (formNodeValueChange)="$event.valueOf()" />
  `,
})
class ValidSignalControlHost {
  name = field.strict('David');
  active = field.strict(false);
}

@Component({
  standalone: true,
  imports: [ValidProfileControl, ValidPeopleControl, FormNodeDirective],
  template: `
    <valid-profile-control [formNode]="profile" (formNodeValueChange)="$event.name?.toUpperCase()" />
    <valid-people-control [formNode]="people" (formNodeControlValueChange)="$event[0]?.name?.toUpperCase()" />
  `,
})
class ValidAggregateControlHost {
  profile = form({ name: field('David') });
  people = array({ name: field('') }, []);
}

void [ValidFormNodeHost, ValidSignalControlHost, ValidAggregateControlHost];
