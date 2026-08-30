import { Component, model } from '@angular/core';

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
