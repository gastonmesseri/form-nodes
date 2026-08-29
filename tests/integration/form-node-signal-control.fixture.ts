import type { FormCheckboxControl, FormValueControl } from '@angular/forms/signals';
import { ChangeDetectionStrategy, Component, Directive, booleanAttribute, inject, input, model, output } from '@angular/core';

import { field, FormNode, provideFormNodeControl, required, type Field } from '../../src/public-api';

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
  selector: 'aot-paired-value-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button type="button" (click)="valueChange.emit('AOT paired value')">{{ value() }}</button>`,
})
export class AotPairedValueControl {
  value = input('');
  valueChange = output<string>();
}

@Directive({
  standalone: true,
  selector: 'input[aotDirectiveControl]',
  providers: [provideFormNodeControl(() => AotDirectiveControl)],
  host: {
    '[value]': 'value()',
    '(input)': 'onInput($event)',
  },
})
export class AotDirectiveControl {
  value = model('');
  required = input(false);
  onInput(event: Event) { this.value.set((event.target as HTMLInputElement).value); }
}

@Directive({
  standalone: true,
  selector: 'input[aotDirectiveCheckbox]',
  providers: [provideFormNodeControl(() => AotDirectiveCheckbox)],
  host: {
    '[checked]': 'checked()',
    '(input)': 'onInput($event)',
  },
})
export class AotDirectiveCheckbox {
  checked = model(false);
  required = input(false);
  onInput(event: Event) { this.checked.set((event.target as HTMLInputElement).checked); }
}

@Directive({
  standalone: true,
  providers: [provideFormNodeControl(() => AotTransitiveSignalControl)],
})
export class AotTransitiveSignalControl {
  value = model('');
  required = input(false);
}

@Directive({
  standalone: true,
  hostDirectives: [AotTransitiveSignalControl],
})
export class AotSignalControlBridge {}

@Component({
  standalone: true,
  selector: 'aot-transitive-signal-control',
  hostDirectives: [AotSignalControlBridge],
  template: `<button type="button" (click)="control.value.set('AOT transitive value')">{{ control.value() }}</button>`,
})
export class AotTransitiveControlComponent {
  readonly control = inject(AotTransitiveSignalControl);
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
  imports: [AotSignalValueControl, AotSignalCheckboxControl, AotPairedValueControl, AotDirectiveControl, AotDirectiveCheckbox, AotTransitiveControlComponent, FormNode],
  template: `
    <aot-signal-value-control [formNode]="name" />
    <aot-signal-checkbox-control [formNode]="active" />
    <aot-paired-value-control [formNode]="pairedName" />
    <input aotDirectiveControl [formNode]="directiveName">
    <input type="checkbox" aotDirectiveCheckbox [formNode]="directiveActive">
    <aot-transitive-signal-control [formNode]="transitiveName" />
  `,
})
export class AotSignalControlHost {
  name = field('AOT initial', [required], { nullable: false });
  active = field(false, { nullable: false });
  pairedName = field('AOT paired initial', { nullable: false });
  directiveName = field('AOT directive initial', [required], { nullable: false });
  directiveActive = field(false, [required], { nullable: false });
  transitiveName = field('AOT transitive initial', [required], { nullable: false });
}
