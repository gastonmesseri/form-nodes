import { NgControl } from '@angular/forms';
import { Component, inject } from '@angular/core';

import { OrderedValueControl, OrderedCheckboxControl, OrderedPairControl } from './custom-event-order.fixture';
import { array, field, form, required, FormNodeDirective, type AnyNode, type FieldNode } from '../../src/public-api';

@Component({ selector: 'output-cva', template: '' })
export class OutputCvaControl {
  ngControl = inject(NgControl);

  onChange: (value: unknown) => void = () => {};

  onTouched: () => void = () => {};

  value: unknown;

  constructor() {
    this.ngControl.valueAccessor = this;
  }

  writeValue(value: unknown) {
    this.value = value;
    this.onChange(value);
  }

  registerOnChange(fn: (value: unknown) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }
}

@Component({
  imports: [FormNodeDirective, OutputCvaControl, OrderedValueControl, OrderedCheckboxControl, OrderedPairControl],
  template: `
    <textarea #textBinding="formNode" [formNode]="text" (formNodeControlValueChange)="record('text', 'control', $event)"
      (formNodeValueChange)="record('text', 'value', $event)"></textarea>
    <input id="number" [formNode]="number" (formNodeControlValueChange)="record('number', 'control', $event)"
      (formNodeValueChange)="record('number', 'value', $event)" />
    <input id="check" type="checkbox" [formNode]="check" (formNodeControlValueChange)="record('check', 'control', $event)"
      (formNodeValueChange)="record('check', 'value', $event)" />
    <input id="date" type="date" [formNode]="date" (formNodeControlValueChange)="record('date', 'control', $event)"
      (formNodeValueChange)="record('date', 'value', $event)" />
    <select multiple [formNode]="selected" (formNodeControlValueChange)="record('selected', 'control', $event)"
      (formNodeValueChange)="record('selected', 'value', $event)"><option>A</option><option>B</option></select>
    <output-cva [formNode]="cva" (formNodeControlValueChange)="record('cva', 'control', $event)"
      (formNodeValueChange)="record('cva', 'value', $event)" />
    <ordered-value [formNode]="custom" (formNodeControlValueChange)="record('custom', 'control', $event)"
      (formNodeValueChange)="record('custom', 'value', $event)" />
    <ordered-check [formNode]="checked" (formNodeControlValueChange)="record('checked', 'control', $event)"
      (formNodeValueChange)="record('checked', 'value', $event)" />
    <ordered-pair [formNode]="pair" (formNodeControlValueChange)="record('pair', 'control', $event)"
      (formNodeValueChange)="record('pair', 'value', $event)" />
  `,
})
export class ValueChangeOutputsHost {
  text: FieldNode<string> = field.strict('', [required]);

  number = field.strict(0);

  check = field.strict(false);

  date = field<Date>(null);

  selected = field.strict<string[]>([]);

  cva: AnyNode = field.strict('');

  custom: AnyNode = form({ name: field.strict('') }, { debounce: 'blur' });

  checked = field.strict(false);

  pair = array(field.strict(''), { initialValue: [''], debounce: 'blur', bindInputOutputPairs: true });

  profile = form({ text: this.text });

  events: { source: string; kind: string; event: unknown; value: unknown; control: unknown; dirty: boolean; valid: boolean; parent: unknown }[] = [];

  afterEvent?: (kind: string) => void;

  record(source: 'text' | 'number' | 'check' | 'date' | 'selected' | 'cva' | 'custom' | 'checked' | 'pair', kind: string, event: unknown) {
    const node = this[source] as AnyNode;
    this.events.push({ source, kind, event, value: node(), control: node.$api.controlValue(), dirty: node.$api.dirty(), valid: node.$api.valid(), parent: this.profile() });
    this.afterEvent?.(kind);
  }
}
