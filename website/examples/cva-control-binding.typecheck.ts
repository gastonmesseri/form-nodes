import { Component, forwardRef, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import { field, form, FormNode } from '@ngblocks/form-nodes';

@Component({
  selector: 'app-text-input',
  template: `
    <label>
      Name
      <input
        #input
        [value]="value()"
        [disabled]="disabled()"
        (input)="changeValue(input.value)"
        (blur)="onTouched()"
      />
    </label>
  `,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => TextInputControl),
    multi: true,
  }],
})
export class TextInputControl implements ControlValueAccessor {
  value = signal('');

  disabled = signal(false);

  onChange: (value: string) => void = () => {};

  onTouched: () => void = () => {};

  writeValue(value: string | null) {
    this.value.set(value ?? '');
  }

  registerOnChange(callback: (value: string) => void) {
    this.onChange = callback;
  }

  registerOnTouched(callback: () => void) {
    this.onTouched = callback;
  }

  setDisabledState(disabled: boolean) {
    this.disabled.set(disabled);
  }

  changeValue(value: string) {
    this.value.set(value);
    this.onChange(value);
  }
}

@Component({
  selector: 'app-profile-editor',
  imports: [FormNode, TextInputControl],
  template: `
    <app-text-input [formNode]="myForm.name" />
    <p>Current name: {{ myForm.name() }}</p>
    <p>Touched: {{ myForm.name.touched() }}</p>
  `,
})
export class ProfileEditor {
  myForm = form({
    name: field('Ada'),
  });
}
