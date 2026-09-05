import { NgControl } from '@angular/forms';
import { Component, inject, signal } from '@angular/core';

import { field, form, FormNode } from '@ngblocks/form-nodes';

// Minimal illustration of a hook that assigns its accessor directly.
function useCustomValueAccessor<T>(options: { writeValue(value: T | null): unknown; setDisabledState(disabled: boolean): unknown }) {
  const ngControl = inject(NgControl, { optional: true });
  let onChange: (value: T) => void = () => {};
  let onTouched: () => void = () => {};
  if (ngControl) {
    ngControl.valueAccessor = {
      writeValue: options.writeValue,
      setDisabledState: options.setDisabledState,
      registerOnChange(callback) { onChange = callback; },
      registerOnTouched(callback) { onTouched = callback; },
    };
  }
  return {
    emitChange(value: T) { onChange(value); },
    markAsTouched() { onTouched(); },
  };
}

@Component({
  selector: 'app-hook-input',
  template: `
    <input #text [value]="value()" [disabled]="disabled()"
      (input)="edit(text.value)" (blur)="ngControl.markAsTouched()">
  `,
})
export class HookInput {
  value = signal('');

  disabled = signal(false);

  ngControl = useCustomValueAccessor<string>({
    writeValue: value => this.value.set(value ?? ''),
    setDisabledState: disabled => this.disabled.set(disabled),
  });

  edit(value: string) {
    this.value.set(value);
    this.ngControl.emitChange(value);
  }
}

@Component({
  imports: [FormNode, HookInput],
  template: '<app-hook-input [formNode]="profile.name" />',
})
export class ProfileComponent {
  profile = form({ name: field('Mark') });
}
