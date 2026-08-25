import type { FormCheckboxControl, FormValueControl } from '@angular/forms/signals';
import { ChangeDetectionStrategy, Component, booleanAttribute, input, model, output } from '@angular/core';

import { field, FormNode, required } from '../src/public-api';

@Component({
  standalone: true,
  selector: 'aot-signal-value-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button type="button" [disabled]="disabled()" (click)="value.set('AOT value')" (blur)="touch.emit()">{{ value() }}</button>`,
})
export class AotSignalValueControl implements FormValueControl<string> {
  value = model('');
  touch = output<void>();
  disabled = input(false, { transform: booleanAttribute });
  dirty = input(false);
  invalid = input(false);
  readonly = input(false);
  required = input(false);
  touched = input(false);
}

@Component({
  standalone: true,
  selector: 'aot-signal-checkbox-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button type="button" (click)="checked.update(value => !value)">{{ checked() }}</button>`,
})
export class AotSignalCheckboxControl implements FormCheckboxControl {
  checked = model(false);
}

@Component({
  standalone: true,
  selector: 'aot-signal-control-host',
  imports: [AotSignalValueControl, AotSignalCheckboxControl, FormNode],
  template: `
    <aot-signal-value-control [formNode]="name" />
    <aot-signal-checkbox-control [formNode]="active" />
  `,
})
export class AotSignalControlHost {
  name = field('AOT initial', [required], { nullable: false });
  active = field(false, { nullable: false });
}
