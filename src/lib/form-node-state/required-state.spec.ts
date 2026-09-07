// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, computed, forwardRef, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { FormControl, FormGroup, FormsModule, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule, Validators, type ControlValueAccessor } from '@angular/forms';

import { useFormNodeState } from './form-node-state';

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

  it('does not execute custom validators or infer required from an error payload', async () => {
    const { render, component, control } = await bind(source);
    const validate = vi.fn(() => ({ required: true }));
    control.setValidators(validate);
    control.updateValueAndValidity();
    const calls = validate.mock.calls.length;
    await render();
    expect(component.state.errors()).toEqual([{ kind: 'required' }]);
    expect(component.showAsterisk()).toBe(false);
    expect(validate).toHaveBeenCalledTimes(calls);
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
