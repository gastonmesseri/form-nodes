import type { FormCheckboxControl, FormValueControl } from '@angular/forms/signals';
import { ChangeDetectionStrategy, Component, booleanAttribute, input, model, output, signal, type OnChanges, type SimpleChanges } from '@angular/core';

import { useLegacyNgControl } from '../helpers/legacy-ng-control-hook';
import { field, form, FormNode, useFormNodeState, provideFormNodesConfig, required, type Field } from '../../src/public-api';

type Company = { companyId: number; companyName: string };
type CompanyValue = { companyId: number | null; companyName: string | null };

@Component({
  standalone: true,
  selector: 'aot-signal-value-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button type="button" [disabled]="disabled()" (click)="value.set('AOT value')" (blur)="touch.emit()">{{ value() }}</button>`,
})
export class AotSignalValueControl implements FormValueControl<string>, OnChanges {
  value = model('');
  formNodeState = useFormNodeState<string>();
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
  template: `<button type="button" (click)="checked.set(!checked())">{{ checked() }}</button>`,
})
export class AotSignalCheckboxControl implements FormCheckboxControl {
  checked = model(false);
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
  readonly name = field.strict('AOT wrapper initial');
}

@Component({
  standalone: true,
  selector: 'aot-company-selector',
  template: `<button type="button" [disabled]="disabled()" (click)="value.set({ companyId: 24, companyName: 'Microsoft' })" (blur)="touch.emit()">{{ value().companyName }}</button>`,
})
export class AotCompanySelector implements FormValueControl<CompanyValue> {
  value = model<CompanyValue>({ companyId: null, companyName: null });
  touch = output<void>();
  disabled = input(false);
  dirty = input(false);
  touched = input(false);
}

@Component({
  standalone: true,
  selector: 'aot-company-selector-host',
  providers: [provideFormNodesConfig({ syncInputs: 'all' })],
  imports: [AotCompanySelector, FormNode],
  template: `<aot-company-selector [formNode]="myForm.company" />`,
})
export class AotCompanySelectorHost {
  private initialCompany: Company = { companyId: 23, companyName: 'Apple' };

  myForm = form({
    company: this.initialCompany,
  });
}

@Component({
  standalone: true,
  selector: 'aot-signal-control-host',
  providers: [provideFormNodesConfig({ syncInputs: 'all' })],
  imports: [AotSignalValueControl, AotSignalCheckboxControl, FormNode],
  template: `
    <aot-signal-value-control [formNode]="name" />
    <aot-signal-checkbox-control [formNode]="active" />
  `,
})
export class AotSignalControlHost {
  name = field.strict('AOT initial', [required]);
  active = field.strict(false);
}

@Component({
  selector: 'aot-direct-hook-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button [disabled]="hook.disabled()" (click)="rendered.set('clicked'); hook.emitChange(rendered())" (blur)="hook.markAsTouched()">
      {{ rendered() }} / {{ hook.value() }} / {{ hook.touched() }} / {{ hook.invalid() }}
    </button>
  `,
})
export class AotDirectHookControl {
  rendered = signal('');

  hook = useLegacyNgControl<string>({
    writeValue: value => this.rendered.set(value ?? ''),
  });
}

@Component({
  imports: [FormNode, AotDirectHookControl],
  template: '<aot-direct-hook-control [formNode]="profile.name" />',
})
export class AotDirectHookHost {
  profile = form({ name: field('', [required]) });
}


@Component({
  selector: 'aot-paired-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button (click)="valueChange.emit('edited')">{{ value() }}</button>`,
})
export class AotPairedText {
  value = input('component text');
  valueChange = output<string>();
  disabled = input(true);
}

@Component({
  selector: 'aot-paired-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button (click)="checkedChange.emit(!checked())">{{ checked() }}</button>`,
})
export class AotPairedCheckbox {
  checked = input(false);
  checkedChange = output<boolean>();
}

@Component({
  imports: [FormNode, AotPairedText, AotPairedCheckbox],
  template: `
    <aot-paired-text [formNode]="name()" />
    <aot-paired-checkbox [formNode]="active()" />
  `,
})
export class AotPairedControlHost {
  name = signal(field.strict('node text', { bindValuePairs: true }));
  active = signal(field.strict(true, { bindValuePairs: true }));

  pause() {
    this.name.set(field.strict('paused text', { bindValuePairs: false }));
    this.active.set(field.strict(true, { bindValuePairs: null }));
  }

  resume() {
    this.name.set(field.strict('resumed', { bindValuePairs: true }));
    this.active.set(field.strict(true, { bindValuePairs: true }));
  }
}
