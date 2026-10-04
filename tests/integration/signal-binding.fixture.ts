import { Component, signal, type WritableSignal } from '@angular/core';

import { OutputCvaControl } from './value-change-outputs.fixture';
import { field, form, FormNodeDirective, provideFormNodesConfig, type AnyNode } from '../../src/public-api';
import { OrderedValueControl, OrderedCheckboxControl, OrderedPairControl } from './custom-event-order.fixture';

@Component({
  selector: 'signal-binding-host',
  providers: [provideFormNodesConfig({ bindInputOutputPairs: true })],
  imports: [FormNodeDirective, OrderedValueControl, OrderedCheckboxControl, OrderedPairControl, OutputCvaControl],
  template: `
    <input #textBinding="formNode" id="text" [formNode]="active()" (formNodeControlValueChange)="observations.push(text())" (formNodeValueChange)="onCommit($event)">
    <input #sharedBinding="formNode" id="shared" [formNode]="text">
    <input id="number" type="number" [formNode]="amount">
    <ordered-pair [formNode]="pair" (valueChange)="pairs.push(pair())" />
    <input id="check" type="checkbox" [formNode]="checked">
    <ordered-check [formNode]="checked" (checkedChange)="checks.push(checked())" />
    <ordered-value [formNode]="objectSource()" (valueChange)="names.push(person().name)" />
    <output-cva [formNode]="cva" (formNodeValueChange)="cvaValues.push(cva())" />
  `,
})
export class SignalBindingHost {
  text = signal('initial');

  active = signal<WritableSignal<string> | AnyNode>(this.text);

  amount = signal<number | null>(null);

  pair = signal('pair initial');

  pairs: string[] = [];

  checked = signal(false);

  person = signal({ name: 'Ada' });

  objectSource = signal<WritableSignal<{ name: string }> | AnyNode>(this.person);

  cva = signal('CVA initial');

  observations: string[] = [];

  commits: unknown[] = [];

  afterCommit?: () => void;

  onCommit(value: unknown) {
    this.commits.push(value);
    this.afterCommit?.();
  }

  checks: boolean[] = [];

  names: string[] = [];

  cvaValues: string[] = [];

  replacement = signal('replacement');

  field = field.strict('field');

  form = form({ name: field.strict('form') });
}
