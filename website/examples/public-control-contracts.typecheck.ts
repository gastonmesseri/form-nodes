import { Component, input, model, output } from '@angular/core';
import { field, form, FormNodeDirective, type FormNodeValueControl, type FormNodeCheckboxControl } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-contract-text',
  template: `<input #text [value]="value()" [disabled]="disabled()"
    (input)="value.set(text.value)" (blur)="touch.emit()">`,
})
export class ContractTextControl implements FormNodeValueControl<string> {
  value = model('');

  disabled = input(false);

  touch = output<void>();
}

@Component({
  selector: 'app-contract-checkbox',
  template: `<input #checkbox type="checkbox" [checked]="checked()"
    (change)="checked.set(checkbox.checked)" (blur)="touch.emit()">`,
})
export class ContractCheckboxControl implements FormNodeCheckboxControl {
  checked = model(false);

  touch = output<void>();
}

@Component({
  imports: [FormNodeDirective, ContractTextControl, ContractCheckboxControl],
  template: `
    <app-contract-text [formNode]="profile.name" />
    <app-contract-checkbox [formNode]="profile.subscribe" />
  `,
})
export class ProfileComponent {
  profile = form({
    name: field.strict('Ada'),
    subscribe: field.strict(false),
  });
}
