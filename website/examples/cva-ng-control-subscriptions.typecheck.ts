import { startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormNodeDirective, field, form, required } from '@ngblocks/form-nodes';
import { Component, DestroyRef, Injector, forwardRef, inject, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, NgControl, type ControlValueAccessor, type ValidationErrors } from '@angular/forms';

// An existing CVA can keep its Angular Forms integration unchanged.
@Component({
  selector: 'app-legacy-text-control',
  template: `<input #input [value]="value()" (input)="onInputValueChange(input.value)" (blur)="onTouched()" />`,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LegacyTextControl), multi: true }],
})
export class LegacyTextControl implements ControlValueAccessor {
  injector = inject(Injector);

  destroyRef = inject(DestroyRef);

  value = signal('');

  errors = signal<ValidationErrors | null>(null);

  ngAfterContentInit() {
    // Capture Injector during construction; inject() cannot be called directly in this hook.
    const ngControl = this.injector.get(NgControl);
    ngControl.statusChanges!
      .pipe(takeUntilDestroyed(this.destroyRef), startWith(ngControl.status))
      .subscribe(() => {
        this.errors.set(ngControl.errors);
      });
  }

  onInputValueChange(value: string) {
    this.value.set(value);
    this.onChange(value);
  }

  // Ng Value Accessor implementation

  onChange = (_value: string) => {};
  onTouched = () => {};

  registerOnChange(fn: any) { this.onChange = fn }
  registerOnTouched(fn: any) { this.onTouched = fn }

  writeValue(value: string | null) { this.value.set(value ?? ''); }
}

@Component({
  imports: [FormNodeDirective, LegacyTextControl],
  template: `<app-legacy-text-control [formNode]="myForm.username" />`,
})
export class ProfileEditor {
  myForm = form({
    username: field('', [required]),
  });
}
