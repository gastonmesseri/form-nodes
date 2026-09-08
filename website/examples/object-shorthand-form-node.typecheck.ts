import { Component, model } from '@angular/core';
import { FormNodeDirective, form } from '@ngblocks/form-nodes';

type CompanyValue = {
  companyId: number | null;
  companyName: string | null;
};

@Component({
  selector: 'app-company-selector',
  template: `{{ value().companyName }}`,
})
export class CompanySelector {
  value = model<CompanyValue>({ companyId: null, companyName: null });
}

@Component({
  imports: [FormNodeDirective, CompanySelector],
  template: `<app-company-selector [formNode]="profile.company" />`,
})
export class ProfileEditor {
  profile = form({
    name: '',
    company: { companyId: 23, companyName: 'Apple' },
  });
}
