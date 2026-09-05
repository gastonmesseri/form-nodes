import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Component, forwardRef, input, model, output, signal } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import type { Node } from '../types/node.type';
import { FormNode } from './form-node.directive';
import { provideFormNodeConfig } from './form-node-config';
import { registerSignalInputForJit, registerSignalModelForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNode, 'formNode', '_formNodeInput');

@Component({ selector: 'config-value-control', template: '' })
class ValueControl {
  value = model<unknown>('');

  disabled = input(true);

  readOnly = input(true, { alias: 'readonly' });

  touch = output<void>();

  resets = 0;

  reset() { this.resets++; }
}

@Component({ selector: 'config-checkbox-control', template: '' })
class CheckboxControl {
  checked = model(false);

  disabled = input(true);
}

@Component({
  selector: 'config-cva-control',
  template: '',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CvaControl), multi: true }],
})
class CvaControl implements ControlValueAccessor {
  readonly = input(true);

  disabled = false;

  writeValue(_value: unknown) {}

  registerOnChange(_callback: (value: unknown) => void) {}

  registerOnTouched(_callback: () => void) {}

  setDisabledState(value: boolean) { this.disabled = value; }
}

registerSignalModelForJit(ValueControl, 'value');
registerSignalInputForJit(ValueControl, 'disabled', 'disabled');
registerSignalInputForJit(ValueControl, 'readonly', 'readOnly');
registerSignalOutputForJit(ValueControl, 'touch', 'touch');
registerSignalModelForJit(CheckboxControl, 'checked');
registerSignalInputForJit(CheckboxControl, 'disabled', 'disabled');
registerSignalInputForJit(CvaControl, 'readonly', 'readonly');

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

describe('custom-control input configuration', () => {
  it.each(['field', 'form'] as const)('preserves consumer inputs while synchronizing a %s and checkbox', (kind) => {
    @Component({
      template: `
        <config-value-control [formNode]="current()" [disabled]="saving()" [readonly]="saving()" />
        <config-checkbox-control [formNode]="profile.active" />
      `,
      imports: [FormNode, ValueControl, CheckboxControl],
      providers: [provideFormNodeConfig({ syncControlInputs: false })],
    })
    class Host {
      profile = form({ name: field('Mark'), active: field(false) });

      current = signal<Node>(kind === 'field' ? this.profile.name : form({ name: field('Mark') }));

      saving = signal(true);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const control = fixture.debugElement.children[0]!.componentInstance as ValueControl;
    const checkbox = fixture.debugElement.children[1]!.componentInstance as CheckboxControl;
    const node = host.current();
    expect(control.disabled()).toBe(true);
    expect(control.readOnly()).toBe(true);
    expect(control.value()).toEqual(kind === 'field' ? 'Mark' : { name: 'Mark' });
    expect(checkbox.checked()).toBe(false);
    expect(checkbox.disabled()).toBe(true);

    const edited = kind === 'field' ? 'Jane' : { name: 'Jane' };
    control.value.set(edited);
    checkbox.checked.set(true);
    control.touch.emit();
    fixture.detectChanges();
    expect(node()).toEqual(edited);
    expect(node.$api.dirty()).toBe(true);
    expect(node.$api.touched()).toBe(true);
    expect(host.profile.active()).toBe(true);
    expect(host.profile.dirty()).toBe(true);

    node.$api.disable();
    node.$api.markAsReadonly();
    host.saving.set(false);
    fixture.detectChanges();
    expect(control.disabled()).toBe(false);
    expect(control.readOnly()).toBe(false);
    expect(node.$api.disabled()).toBe(true);
    node.$api.reset(kind === 'field' ? 'Mark' : { name: 'Mark' });
    fixture.detectChanges();
    expect(control.value()).toEqual(kind === 'field' ? 'Mark' : { name: 'Mark' });
    expect(control.resets).toBe(1);
    expect(node.$api.touched()).toBe(false);

    const replacement = kind === 'field' ? field('New') : form({ name: field('New') });
    host.current.set(replacement);
    fixture.detectChanges();
    expect(control.value()).toEqual(kind === 'field' ? 'New' : { name: 'New' });
    control.value.set(kind === 'field' ? 'Later' : { name: 'Later' });
    expect(replacement()).toEqual(kind === 'field' ? 'Later' : { name: 'Later' });
    expect(node()).toEqual(kind === 'field' ? 'Mark' : { name: 'Mark' });
    fixture.destroy();
    control.value.set('detached');
    expect(replacement()).toEqual(kind === 'field' ? 'Later' : { name: 'Later' });
  });

  it('allows a nearer provider to enable inputs and preserves native and CVA disabled behavior', () => {
    @Component({
      selector: 'config-opt-in',
      template: '<config-value-control [formNode]="name" />',
      imports: [FormNode, ValueControl],
      providers: [provideFormNodeConfig({ syncControlInputs: true })],
    })
    class OptIn {
      name = field('Mark');
    }

    @Component({
      template: `
        <config-value-control [formNode]="profile.name" />
        <config-opt-in />
        <config-cva-control [formNode]="profile.name" />
        <input [formNode]="profile.name">
      `,
      imports: [FormNode, ValueControl, CvaControl, OptIn],
      providers: [provideFormNodeConfig({ syncControlInputs: false })],
    })
    class Host {
      profile = form({ name: field('Mark') });
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const controls = fixture.debugElement.children;
    const outer = controls[0]!.componentInstance as ValueControl;
    const inner = controls[1]!.children[0]!.componentInstance as ValueControl;
    const cva = controls[2]!.componentInstance as CvaControl;
    const native = controls[3]!.nativeElement as HTMLInputElement;
    expect(outer.disabled()).toBe(true);
    expect(inner.disabled()).toBe(false);
    expect(cva.readonly()).toBe(true);
    expect(cva.disabled).toBe(false);
    expect(native.disabled).toBe(false);
    fixture.componentInstance.profile.disable();
    fixture.detectChanges();
    expect(cva.disabled).toBe(true);
    expect(native.disabled).toBe(true);
    fixture.componentInstance.profile.enable();
    fixture.detectChanges();
    expect(cva.disabled).toBe(false);
    expect(native.disabled).toBe(false);
  });
});
