import type { FormCheckboxControl, FormValueControl } from '@angular/forms/signals';
import { ChangeDetectionStrategy, Component, booleanAttribute, input, model, output, type OnChanges, type SimpleChanges } from '@angular/core';

import { field, FormNode, injectBoundControl, required, type Field } from '../../src/public-api';

@Component({
  standalone: true,
  selector: 'aot-signal-value-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button type="button" [disabled]="disabled()" (click)="value.set('AOT value')" (blur)="touch.emit()">{{ value() }}</button>`,
})
export class AotSignalValueControl implements FormValueControl<string>, OnChanges {
  value = model('');
  boundControl = injectBoundControl<string>();
  touch = output<void>();
  disabled = input(false, { transform: booleanAttribute });
  dirty = input(false);
  invalid = input(false);
  readonly = input(false);
  requiredState = input(false, { alias: 'required' });
  touched = input(false);
  stateChanges: SimpleChanges[] = [];

  ngOnChanges(changes: SimpleChanges) {
    this.stateChanges.push(changes);
  }
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
  selector: 'aot-paired-value-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button type="button" (click)="valueChange.emit('AOT paired value')">{{ value() }}</button>`,
})
export class AotPairedValueControl {
  value = input('');
  valueChange = output<string>();
}

@Component({
  standalone: true,
  selector: 'aot-delegating-control',
  imports: [FormNode],
  template: `<input [formNode]="formNode()">`,
})
export class AotDelegatingControl {
  readonly formNode = input.required<Field<string>>();
}

@Component({
  standalone: true,
  selector: 'aot-pass-through-host',
  imports: [AotDelegatingControl, FormNode],
  template: `<aot-delegating-control [formNode]="name" />`,
})
export class AotPassThroughHost {
  readonly name = field('AOT wrapper initial', { nullable: false });
}

@Component({
  standalone: true,
  selector: 'aot-signal-control-host',
  imports: [AotSignalValueControl, AotSignalCheckboxControl, AotPairedValueControl, FormNode],
  template: `
    <aot-signal-value-control [formNode]="name" />
    <aot-signal-checkbox-control [formNode]="active" />
    <aot-paired-value-control [formNode]="pairedName" />
  `,
})
export class AotSignalControlHost {
  name = field('AOT initial', [required], { nullable: false });
  active = field(false, { nullable: false });
  pairedName = field('AOT paired initial', { nullable: false });
}
