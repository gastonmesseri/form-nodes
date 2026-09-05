import { input, model, output } from '@angular/core';

import type { FormNodeUiControl, FormNodeValueControl, FormNodeCheckboxControl, DisabledReason, ValidationError } from '../../src/public-api';

class DateControl implements FormNodeValueControl<Date | null> {
  value = model<Date | null>(null);
  min = input<Date | undefined>(undefined);
  max = input<Date | undefined>(undefined);
  disabled = input(false);
  errors = input<readonly ValidationError[]>([]);
  disabledReasons = input<readonly DisabledReason[]>([]);
  touch = output<void>();

  focus(_options?: FocusOptions) {}

  reset() {}
}

class CheckboxControl implements FormNodeCheckboxControl {
  checked = model(false);
  required = input(false);
  touch = output<void>();
}

declare const date: DateControl;
declare const checkbox: CheckboxControl;
const dateContract: FormNodeValueControl<Date | null> = date;
const checkboxContract: FormNodeCheckboxControl = checkbox;
const uiContract: FormNodeUiControl<Date | null> = date;

// @ts-expect-error A numeric constraint cannot represent a Date constraint.
const invalidDateUi: FormNodeUiControl<Date> = { min: input<number | undefined>(undefined) };
// @ts-expect-error Checkbox models must be boolean.
const invalidCheckbox: FormNodeCheckboxControl = { checked: model('yes') };

void [dateContract, checkboxContract, uiContract, invalidDateUi, invalidCheckbox];
