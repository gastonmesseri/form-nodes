import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Component, Directive, forwardRef, model, output } from '@angular/core';

import { field, form, FormNodeDirective, provideFormNodePassThrough } from '../../src/public-api';

@Directive({
  selector: '[isolatedCva]',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => IsolatedCva), multi: true }],
})
export class IsolatedCva {
  input = output<string>();

  change = output<string>();

  blur = output<string>();

  onChange: (value: string) => void = () => {};

  onTouched: () => void = () => {};

  writeValue(_value: string) {}

  registerOnChange(callback: (value: string) => void) { this.onChange = callback; }

  registerOnTouched(callback: () => void) { this.onTouched = callback; }
}

@Component({
  selector: 'isolated-model',
  template: '<input>',
})
export class IsolatedModel {
  value = model('');

  input = output<string>();

  change = output<string>();

  blur = output<string>();

  touch = output<void>();
}

@Directive({
  selector: '[isolatedPassThrough]',
  providers: [provideFormNodePassThrough()],
})
export class IsolatedPassThrough {}

@Component({
  selector: 'native-event-isolation-host',
  imports: [FormNodeDirective, IsolatedCva, IsolatedModel, IsolatedPassThrough],
  template: `
    <input id="native-cva" isolatedCva [formNode]="profile.nativeCva">
    <div id="custom-cva" isolatedCva [formNode]="profile.customCva"><input></div>
    <isolated-model [formNode]="profile.customModel" />
    <input id="pass-through" isolatedPassThrough [formNode]="profile.passThrough">
  `,
})
export class NativeEventIsolationHost {
  profile = form({
    nativeCva: field.strict('initial'),
    customCva: field.strict('initial'),
    customModel: field.strict('initial'),
    passThrough: field.strict('initial'),
  });
}
