import { Component } from '@angular/core';

import { field, form, required, FormNodeDirective, type FieldNode } from '../../src/public-api';

@Component({
  selector: 'native-event-order-host',
  imports: [FormNodeDirective],
  template: `
    <textarea id="text" (input)="record('input', profile.text, $event)" [formNode]="profile.text"
      (blur)="record('blur', profile.text, $event)"
      (compositionend)="record('compositionend', profile.text, $event)"></textarea>
    <input id="checked" type="checkbox" [formNode]="profile.checked" (change)="record('change', profile.checked, $event)">
    <select id="choice" [formNode]="profile.choice" (change)="record('change', profile.choice, $event)">
      <option value="a">A</option><option value="b">B</option>
    </select>
    <input id="amount" type="number" [formNode]="profile.amount" (input)="record('input', profile.amount, $event)">
    <textarea id="deferred" [formNode]="profile.deferred" (input)="record('input', profile.deferred, $event)"
      (blur)="record('blur', profile.deferred, $event)"></textarea>
    <textarea id="delayed" [formNode]="profile.delayed" (input)="record('input', profile.delayed, $event)"></textarea>
  `,
})
export class NativeEventOrderHost {
  profile = form({
    text: field.strict('', [required]),
    checked: field.strict(false),
    choice: field.strict('a'),
    amount: field.strict(1),
    deferred: field.strict('initial', { debounce: 'blur' }),
    delayed: field.strict('initial', { debounce: 50 }),
  });

  observations: {
    event: string;
    value: unknown;
    controlValue: unknown;
    parentValue: unknown;
    dirty: boolean;
    touched: boolean;
    valid: boolean;
    parentValid: boolean;
    errors: string[];
  }[] = [];

  afterEvent?: (event: Event) => void;

  record(event: string, node: FieldNode, nativeEvent: Event) {
    this.observations.push({
      event,
      value: node(),
      controlValue: node.controlValue(),
      parentValue: this.profile(),
      dirty: node.dirty(),
      touched: node.touched(),
      valid: node.valid(),
      parentValid: this.profile.valid(),
      errors: node.errors().map(error => error.kind),
    });
    this.afterEvent?.(nativeEvent);
  }
}
