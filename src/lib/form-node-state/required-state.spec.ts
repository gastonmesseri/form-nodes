// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, computed, forwardRef, signal, model } from '@angular/core';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { FormField, form as angularForm, validate } from '@angular/forms/signals';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { FormControl, FormGroup, FormsModule, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule, Validators, type ControlValueAccessor } from '@angular/forms';

import { useFormNodeState } from './form-node-state';
import { field, form, FormNodeDirective, required } from '../../public-api';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../tests/helpers/register-signal-input-for-jit';

@Component({
  selector: 'required-state-control',
  template: '',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RequiredStateControl), multi: true }],
})
class RequiredStateControl implements ControlValueAccessor {
  state = useFormNodeState<string>();

  showAsterisk = computed(() => this.state.required());

  writeValue() {}

  registerOnChange() {}

  registerOnTouched() {}
}

@Component({
  template: '',
  imports: [RequiredStateControl, FormsModule, ReactiveFormsModule],
})
class Host {
  required = signal<boolean | string>(false);

  control = new FormControl('Ada', { nonNullable: true });

  profile = new FormGroup({ name: this.control });

  name = 'Ada';
}

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

const templates = {
  formControl: '<required-state-control [formControl]="control" [required]="required()" />',
  formControlName: '<form [formGroup]="profile"><required-state-control formControlName="name" [required]="required()" /></form>',
  ngModel: '<required-state-control [(ngModel)]="name" [ngModelOptions]="{ standalone: true }" [required]="required()" />',
};

const bind = async (source: keyof typeof templates) => {
  TestBed.overrideComponent(Host, { set: { template: templates[source] } });
  const fixture = TestBed.createComponent(Host);
  const render = async () => {
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  await render();
  const element = source === 'formControlName' ? fixture.debugElement.children[0]!.children[0]! : fixture.debugElement.children[0]!;
  const component = element.componentInstance as RequiredStateControl;
  const control = element.injector.get(NgControl).control!;
  return { fixture, render, component, control };
};

describe.each(['formControl', 'formControlName', 'ngModel'] as const)('useFormNodeState required with %s', (source) => {
  it('follows the Angular required directive with a valid value and while disabled', async () => {
    const { fixture, render, component, control } = await bind(source);
    expect(component.showAsterisk()).toBe(false);
    for (const value of [true, false, '', 'false', 'true', false]) {
      fixture.componentInstance.required.set(value);
      await render();
      expect(component.showAsterisk()).toBe(value !== false && value !== 'false');
      expect(component.state.errors()).toEqual([]);
      expect(component.state.value()).toBe('Ada');
    }
    fixture.componentInstance.required.set(true);
    await render();
    control.disable();
    expect(component.showAsterisk()).toBe(true);
    fixture.componentInstance.required.set(false);
    await render();
    expect(component.showAsterisk()).toBe(false);
    control.enable();
    expect(component.showAsterisk()).toBe(false);
    fixture.destroy();
    expect(component.state.connected()).toBe(false);
    expect(component.showAsterisk()).toBe(false);
  });

  it('combines direct required registration with the directive and observes silent changes', async () => {
    const { fixture, render, component, control } = await bind(source);
    expect(component.showAsterisk()).toBe(false);
    control.addValidators(Validators.required);
    control.updateValueAndValidity();
    expect(component.showAsterisk()).toBe(true);
    expect(component.state.invalid()).toBe(false);
    fixture.componentInstance.required.set(true);
    await render();
    control.removeValidators(Validators.required);
    control.updateValueAndValidity();
    expect(component.showAsterisk()).toBe(true);
    fixture.componentInstance.required.set(false);
    await render();
    expect(component.showAsterisk()).toBe(false);
    control.addValidators(Validators.required);
    control.updateValueAndValidity({ emitEvent: false });
    await render();
    expect(component.showAsterisk()).toBe(true);
    control.removeValidators(Validators.required);
    control.updateValueAndValidity({ emitEvent: false });
    await render();
    expect(component.showAsterisk()).toBe(false);
  });

  it('tracks manual required errors, silent removal, disabled state, and disconnection', async () => {
    const { fixture, render, component, control } = await bind(source);
    control.setErrors({ required: { message: 'Enter a value.' } });
    expect(component.showAsterisk()).toBe(true);
    expect(component.state.invalid()).toBe(true);
    control.setErrors({ other: true }, { emitEvent: false });
    await render();
    expect(component.showAsterisk()).toBe(false);
    expect(component.state.invalid()).toBe(true);
    control.setErrors({ required: false });
    expect(component.showAsterisk()).toBe(true);
    control.disable();
    expect(component.showAsterisk()).toBe(false);
    expect(component.state.errors()).toEqual([]);
    control.enable();
    control.setErrors({ required: true });
    expect(component.showAsterisk()).toBe(true);
    fixture.destroy();
    expect(component.showAsterisk()).toBe(false);
    expect(component.state.connected()).toBe(false);
  });

  it('tracks asynchronous required errors and clears the fallback while validation is pending', async () => {
    const { component, control } = await bind(source);
    let resolve!: (errors: { required: true } | null) => void;
    const validate = vi.fn(() => new Promise<{ required: true } | null>((done) => { resolve = done; }));
    control.setAsyncValidators(validate);
    control.updateValueAndValidity();
    expect(validate).toHaveBeenCalledTimes(1);
    expect(component.state.pending()).toBe(true);
    expect(component.showAsterisk()).toBe(false);
    resolve({ required: true });
    await Promise.resolve();
    expect(component.state.pending()).toBe(false);
    expect(component.showAsterisk()).toBe(true);
    expect(component.state.hasValidator(Validators.required)).toBe(true);
    control.setValue('Grace');
    expect(validate).toHaveBeenCalledTimes(2);
    expect(component.state.pending()).toBe(true);
    expect(component.showAsterisk()).toBe(false);
    resolve(null);
    await Promise.resolve();
    expect(component.state.pending()).toBe(false);
    expect(component.state.invalid()).toBe(false);
    expect(component.showAsterisk()).toBe(false);
  });

  it('recognizes requiredTrue as required metadata independently of validation success', async () => {
    const { component, control } = await bind(source);
    control.setValue(true);
    control.addValidators(Validators.requiredTrue);
    control.updateValueAndValidity();
    expect(component.showAsterisk()).toBe(true);
    expect(component.state.errors()).toEqual([]);
    control.setValue(false);
    expect(component.showAsterisk()).toBe(true);
    expect(component.state.invalid()).toBe(true);
    control.removeValidators(Validators.requiredTrue);
    control.updateValueAndValidity();
    expect(component.showAsterisk()).toBe(false);
  });

  it('observes custom required errors without executing validators during state reads', async () => {
    const { render, component, control } = await bind(source);
    const validate = vi.fn((current: { value: unknown }) => current.value === '' ? { required: true } : null);
    control.setValue('');
    control.setValidators(validate);
    control.updateValueAndValidity();
    const calls = validate.mock.calls.length;
    await render();
    expect(component.state.errors()).toEqual([{ kind: 'required' }]);
    expect(component.showAsterisk()).toBe(true);
    expect(component.state.hasValidator(Validators.required)).toBe(true);
    expect(validate).toHaveBeenCalledTimes(calls);
    control.setValue('Grace');
    expect(component.showAsterisk()).toBe(false);
    expect(component.state.hasValidator(Validators.required)).toBe(false);
    expect(component.state.errors()).toEqual([]);
    expect(component.state.invalid()).toBe(false);
    expect(validate).toHaveBeenCalledTimes(calls + 1);
  });
});

it('follows a replaced FormControl and releases the previous required state', async () => {
  const { fixture, render, component, control } = await bind('formControl');
  control.addValidators(Validators.required);
  control.updateValueAndValidity();
  expect(component.showAsterisk()).toBe(true);
  fixture.componentInstance.control = new FormControl('Grace', { nonNullable: true });
  await render();
  expect(component.showAsterisk()).toBe(false);
  expect(component.state.value()).toBe('Grace');
  control.updateValueAndValidity();
  expect(component.showAsterisk()).toBe(false);
  fixture.componentInstance.control.addValidators(Validators.required);
  fixture.componentInstance.control.updateValueAndValidity();
  expect(component.showAsterisk()).toBe(true);
});

it('recognizes the Angular checkbox required directive', async () => {
  TestBed.overrideComponent(RequiredStateControl, { set: { selector: 'input[required-state-control]' } });
  TestBed.overrideComponent(Host, {
    set: { template: '<input required-state-control type="checkbox" [(ngModel)]="name" [required]="required()" />' },
  });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.required.set(true);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const component = fixture.debugElement.children[0]!.componentInstance as RequiredStateControl;
  expect(component.showAsterisk()).toBe(true);
  fixture.componentInstance.required.set(false);
  fixture.detectChanges();
  await fixture.whenStable();
  expect(component.showAsterisk()).toBe(false);
});

@Component({ selector: 'required-signal-control', template: '' })
class RequiredSignalControl {
  value = model<unknown>(null);

  state = useFormNodeState();
}
registerSignalModelForJit(RequiredSignalControl, 'value', 'value');
registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');

it.each([['formNode', 'required'], ['formField', 'required'], ['formNode', 'requiredTrue'], ['formField', 'requiredTrue']] as const)('recognizes existing %s %s errors without a declared required rule', (source, kind) => {
  @Component({ template: '', imports: [RequiredSignalControl, FormNodeDirective, FormField] })
  class SignalHost {
    missing = signal(true);

    value = signal('');

    local = field('', [() => this.missing() ? { kind } : null]);

    angular = angularForm(this.value, (path) => {
      validate(path, () => this.missing() ? { kind } : null);
    });
  }
  TestBed.overrideComponent(SignalHost, { set: {
    template: source === 'formNode'
      ? '<required-signal-control [formNode]="local" />'
      : '<required-signal-control [formField]="angular" />',
  } });
  const fixture = TestBed.createComponent(SignalHost);
  fixture.detectChanges();
  const state = (fixture.debugElement.children[0]!.componentInstance as RequiredSignalControl).state;
  expect(state.source()).toBe(source);
  expect(state.required()).toBe(true);
  expect(state.hasValidator(required)).toBe(true);
  expect(state.hasValidator(Validators.required)).toBe(true);
  if (source === 'formField') expect(fixture.componentInstance.angular().required()).toBe(false);
  fixture.componentInstance.missing.set(false);
  fixture.detectChanges();
  expect(state.required()).toBe(false);
  expect(state.hasValidator(required)).toBe(false);
  expect(state.errors()).toEqual([]);
  fixture.destroy();
  expect(state.required()).toBe(false);
});

it('uses only the bound form own errors, excluding errors from descendants', () => {
  @Component({ template: '<required-signal-control [formNode]="node" />', imports: [RequiredSignalControl, FormNodeDirective] })
  class FormHost {
    profile = form({
      name: field('', [() => ({ kind: 'required' })]),
      nested: form({ name: field('') }),
    });

    node = this.profile;
  }
  const fixture = TestBed.createComponent(FormHost);
  fixture.detectChanges();
  const state = (fixture.debugElement.children[0]!.componentInstance as RequiredSignalControl).state;
  expect(state.invalid()).toBe(true);
  expect(state.required()).toBe(false);
  fixture.componentInstance.profile.setValidators(() => ({ kind: 'required' }));
  expect(state.required()).toBe(true);
  fixture.componentInstance.profile.setValidators([]);
  expect(state.required()).toBe(false);
  expect(state.invalid()).toBe(true);
});
