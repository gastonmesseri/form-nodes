import { Component, forwardRef, signal } from '@angular/core';
import { field, form, FormNodeDirective } from '@ngblocks/form-nodes';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-text-input',
  template: `
    <label>
      Name
      <input
        #input
        [value]="value()"
        [disabled]="disabled()"
        (input)="onValueChange(input.value)"
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

  onValueChange(value: string) {
    this.value.set(value);
    this.onChange(value);
  }
}

@Component({
  selector: 'app-profile-editor',
  imports: [FormNodeDirective, TextInputControl],
  template: `
    <app-text-input [formNode]="form.name" />
    <p>Current name: {{ form.name() }}</p>
    <p>Touched: {{ form.name.touched() }}</p>
  `,
})
export class ProfileEditor {
  form = form({
    name: field('Ada'),
  });
}
