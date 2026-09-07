import { useFormNodeState } from '@ngblocks/form-nodes';
import { Component, forwardRef, signal } from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators, type ControlValueAccessor } from '@angular/forms';

// text-control.component.ts
@Component({
  selector: 'app-text-control',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextControl), multi: true }],
  template: `
    @if (state.required()) { <span aria-hidden="true">*</span> }
    <input
      [value]="value()"
      [disabled]="state.disabled()"
      [attr.minlength]="state.minLength()"
      [attr.maxlength]="state.maxLength()"
      (input)="onInput($event)"
      (blur)="onTouched()"
    />
    @if (state.touched() && state.hasError('minlength')) {
      <p>Use at least {{ state.getError('minlength')?.['requiredLength'] }} characters.</p>
    } @else if (state.touched() && state.invalid()) {
      <p>Please check your input.</p>
    }
  `,
})
export class TextControl implements ControlValueAccessor {
  state = useFormNodeState<string>();
  value = signal('');
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string) { this.value.set(value); }
  registerOnChange(callback: (value: string) => void) { this.onChange = callback; }
  registerOnTouched(callback: () => void) { this.onTouched = callback; }

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value);
  }
}

// profile-editor.component.ts
@Component({
  imports: [TextControl, ReactiveFormsModule],
  template: `
    <label>
      Name
      <app-text-control [formControl]="name" [minlength]="minimumLength()" maxlength="40" />
    </label>
  `,
})
export class ProfileEditor {
  minimumLength = signal(2);
  name = new FormControl('Ada', { nonNullable: true, validators: [Validators.required] });
}
