import { Component, model } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FormNode, field, form, injectBoundControl } from '@gem/ng-forms';

@Component({
  selector: 'app-date-picker',
  template: `
    <button type="button" [disabled]="boundControl.disabled()">
      Select date
    </button>
  `,
})
export class DatePicker {
  value = model<string | null>(null);
  boundControl = injectBoundControl<string | null>();
}

@Component({
  selector: 'app-profile-editor',
  imports: [DatePicker, FormNode],
  template: `<app-date-picker [formNode]="profile.birthDate" />`,
})
export class ProfileEditor {
  profile = form({ birthDate: field<string | null>(null) });
}

@Component({
  selector: 'app-reactive-editor',
  imports: [DatePicker, ReactiveFormsModule],
  template: `<app-date-picker [formControl]="birthDate" />`,
})
export class ReactiveEditor {
  birthDate = new FormControl<string | null>(null);
}

@Component({
  selector: 'app-reactive-group-editor',
  imports: [DatePicker, ReactiveFormsModule],
  template: `
    <form [formGroup]="profile">
      <app-date-picker formControlName="birthDate" />
    </form>
  `,
})
export class ReactiveGroupEditor {
  profile = new FormGroup({
    birthDate: new FormControl<string | null>(null),
  });
}

@Component({
  selector: 'app-template-driven-editor',
  imports: [DatePicker, FormsModule],
  template: `<app-date-picker [(ngModel)]="birthDate" />`,
})
export class TemplateDrivenEditor {
  birthDate: string | null = null;
}

@Component({
  selector: 'app-signal-forms-editor',
  imports: [DatePicker, FormField],
  template: `<app-date-picker [formField]="profile.birthDate.$field" />`,
})
export class SignalFormsEditor {
  profile = form({ birthDate: field<string | null>(null) });
}
