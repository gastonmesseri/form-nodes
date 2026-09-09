import { NgControl } from '@angular/forms';
import { Component, inject, input, model, output } from '@angular/core';

import { field, form, required, FORM_NODE, FormNodeDirective, type AnyNode } from '../../src/public-api';

@Component({ selector: 'ordered-value', template: '' })
export class OrderedValueControl {
  ngControl = inject(NgControl, { self: true, optional: true });

  selection = model<any>('', { alias: 'value' });

  touch = output<void>();
}

@Component({ selector: 'ordered-check', template: '' })
export class OrderedCheckboxControl {
  checked = model(false);

  touch = output<void>();
}

@Component({ selector: 'ordered-pair', template: '' })
export class OrderedPairControl {
  value = input('');

  valueChange = output<string>();

  touch = output<void>();
}

@Component({
  selector: 'custom-event-order-host',
  imports: [FormNodeDirective, OrderedValueControl, OrderedCheckboxControl, OrderedPairControl],
  template: `
    <ordered-value id="value" (valueChange)="record(profile.value, $event)" [formNode]="profile.value"
      (touch)="record(profile.value)" />
    <ordered-check [formNode]="profile.checked" (checkedChange)="record(profile.checked, $event)"
      (touch)="record(profile.checked)" />
    <ordered-pair [formNode]="profile.paired" (valueChange)="record(profile.paired, $event)"
      (touch)="record(profile.paired)" />
    <ordered-value id="deferred" [formNode]="profile.deferred" (valueChange)="record(profile.deferred, $event)"
      (touch)="record(profile.deferred)" />
    <ordered-value id="aggregate" [formNode]="profile.aggregate" (valueChange)="record(profile.aggregate, $event)"
      (touch)="record(profile.aggregate)" />
  `,
})
export class CustomEventOrderHost {
  profile = form({
    value: field.strict('', [required]),
    checked: field.strict(false),
    paired: field.strict('', { bindInputOutputPairs: true }),
    deferred: field.strict('initial', { debounce: 'blur' }),
    aggregate: form({ name: field.strict('initial', [required]) }),
  });

  observations: { eventValue: unknown; value: unknown; controlValue: unknown; parent: unknown; dirty: boolean; touched: boolean; valid: boolean; parentValid: boolean }[] = [];

  afterEvent?: () => void;

  record(node: AnyNode, eventValue?: unknown) {
    this.observations.push({
      eventValue,
      value: node(),
      controlValue: node.$api.value.control(),
      parent: this.profile(),
      dirty: node.$api.dirty(),
      touched: node.$api.touched(),
      valid: node.$api.valid(),
      parentValid: this.profile.valid(),
    });
    this.afterEvent?.();
  }
}

@Component({ selector: 'direct-binding-control', template: '' })
export class DirectBindingControl {
  touch = output<void>();

  binding = inject(FORM_NODE, { self: true });

  value = model('');
}

@Component({ selector: 'direct-directive-control', template: '' })
export class DirectDirectiveControl {
  binding = inject(FormNodeDirective, { self: true });

  checked = model(false);

  touch = output<void>();
}

@Component({ selector: 'direct-pair-control', template: '' })
export class DirectPairControl {
  binding = inject(FORM_NODE, { self: true });

  value = input('');

  valueChange = output<string>();

  touch = output<void>();
}

@Component({
  selector: 'direct-binding-host',
  imports: [FormNodeDirective, DirectBindingControl, DirectDirectiveControl, DirectPairControl],
  template: `
    <direct-binding-control [formNode]="name" (valueChange)="observed = name()" (touch)="touched = name.touched()" />
    <direct-directive-control [formNode]="checked" (checkedChange)="checkedObserved = checked()" (touch)="checkedTouched = checked.touched()" />
    <direct-pair-control [formNode]="paired" (valueChange)="pairedObserved = paired()" (touch)="pairedTouched = paired.touched()" />
  `,
})
export class DirectBindingHost {
  name = field.strict('initial');

  observed = '';

  touched = false;

  checked = field.strict(false);

  checkedObserved = false;

  checkedTouched = false;

  paired = field.strict('initial', { bindInputOutputPairs: true });

  pairedObserved = '';

  pairedTouched = false;
}
