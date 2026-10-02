// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, computed, forwardRef, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { FormField, form as angularForm, required as angularRequired } from '@angular/forms/signals';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { FormControl, FormGroup, FormsModule, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule, Validators, type ControlValueAccessor } from '@angular/forms';

import { form } from '../../primitives/form';
import { field } from '../../primitives/field';
import type { AnyNode } from '../../types/node.type';
import { useControlState } from '../control-state';
import { required } from '../../validation/validators/required';
import { asyncValidator } from '../../validation/async-validator';
import { requiredIf } from '../../validation/validators/required-if';
import { FormNodeDirective } from '../../form-node/form-node.directive';
import { registerSignalInputForJit } from '../../../../tests/helpers/register-signal-input-for-jit';

@Component({
  selector: 'validator-query-control',
  template: '',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ValidatorControl), multi: true }],
})
class ValidatorControl implements ControlValueAccessor {
  state = useControlState();

  query = signal<unknown>(Validators.required);

  result = computed(() => this.state.hasValidator(this.query()));

  localRequired = computed(() => this.state.hasValidator(required));

  writeValue() {}

  registerOnChange() {}

  registerOnTouched() {}
}

@Component({ template: '', imports: [ValidatorControl, FormNodeDirective, FormField, FormsModule, ReactiveFormsModule] })
class Host {
  required = signal(false);

  node = signal<AnyNode>(field('Ada', [requiredIf(() => this.required())]));

  control = new FormControl('Ada');

  profile = new FormGroup({ name: this.control });

  name = 'Ada';

  angularField = angularForm(signal('Ada'), path => angularRequired(path, { when: () => this.required() }));
}

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

const templates = {
  formNode: '<validator-query-control [formNode]="node()" />',
  formField: '<validator-query-control [formField]="angularField" />',
  formControl: '<validator-query-control [formControl]="control" [required]="required()" />',
  formControlName: '<form [formGroup]="profile"><validator-query-control formControlName="name" [required]="required()" /></form>',
  ngModel: '<validator-query-control [(ngModel)]="name" [ngModelOptions]="{ standalone: true }" [required]="required()" />',
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
  const component = element.componentInstance as ValidatorControl;
  const control = element.injector.get(NgControl, null)?.control;
  return { fixture, render, component, control };
};

describe.each(['formNode', 'formField', 'formControl', 'formControlName', 'ngModel'] as const)('hasValidator with %s', (source) => {
  it('treats both required exports as reactive required-state queries', async () => {
    const { fixture, render, component } = await bind(source);
    expect(component.result()).toBe(false);
    expect(component.localRequired()).toBe(false);
    fixture.componentInstance.required.set(true);
    await render();
    expect(component.result()).toBe(true);
    expect(component.localRequired()).toBe(true);
    expect(component.state.errors()).toEqual([]);
    const { hasValidator } = component.state;
    expect(hasValidator(Validators.required)).toBe(true);
    fixture.componentInstance.required.set(false);
    await render();
    expect(component.result()).toBe(false);
    expect(component.localRequired()).toBe(false);
    fixture.destroy();
    expect(component.result()).toBeUndefined();
    expect(component.localRequired()).toBeUndefined();
  });

  it('rejects non-function arguments without invoking them', async () => {
    const { component } = await bind(source);
    for (const value of [undefined, null, false, 1, 'required', {}, []]) {
      expect(component.state.hasValidator(value)).toBeUndefined();
    }
  });
});

describe.each(['formControl', 'formControlName', 'ngModel'] as const)('Angular references with %s', (source) => {
  it('tracks exact synchronous and asynchronous registrations, including silent changes', async () => {
    const { component, control, render } = await bind(source);
    const validate = vi.fn(() => null);
    component.query.set(validate);
    expect(component.result()).toBe(false);
    control!.addValidators(validate);
    control!.updateValueAndValidity();
    expect(component.result()).toBe(true);
    const calls = validate.mock.calls.length;
    expect(component.state.hasValidator(validate)).toBe(true);
    expect(validate).toHaveBeenCalledTimes(calls);
    control!.removeValidators(validate);
    control!.updateValueAndValidity({ emitEvent: false });
    await render();
    expect(component.result()).toBe(false);
    control!.addValidators(validate);
    control!.updateValueAndValidity({ emitEvent: false });
    await render();
    expect(component.result()).toBe(true);
    const asyncRule = vi.fn(async () => null);
    component.query.set(asyncRule);
    expect(component.result()).toBe(false);
    control!.addAsyncValidators(asyncRule);
    await render();
    expect(component.result()).toBe(true);
    expect(asyncRule).not.toHaveBeenCalled();
    control!.removeAsyncValidators(asyncRule);
    await render();
    expect(component.result()).toBe(false);
  });

  it('preserves reference identity for factories and maps requiredTrue obligations through required', async () => {
    const { component, control } = await bind(source);
    const minimum = Validators.min(3);
    control!.addValidators([minimum, Validators.requiredTrue]);
    control!.updateValueAndValidity();
    expect(component.state.hasValidator(minimum)).toBe(true);
    expect(component.state.hasValidator(Validators.min(3))).toBe(false);
    expect(component.state.hasValidator(Validators.requiredTrue)).toBe(true);
    expect(component.state.hasValidator(Validators.required)).toBe(true);
    expect(component.state.hasValidator(required)).toBe(true);
    expect(component.state.hasValidator(required('Custom message'))).toBe(false);
  });
});

it.each(['field', 'form', 'nested form'] as const)('delegates direct references to a %s without resolving compositions', async (kind) => {
  const { fixture, render, component } = await bind('formNode');
  const leaf = vi.fn(() => null);
  const composed = vi.fn(() => leaf);
  const asyncRule = asyncValidator(async () => null);
  const profile = form({ name: field('Ada'), nested: form({ name: field('Ada') }, { validators: [composed, asyncRule] }) }, { validators: [composed, asyncRule] });
  const node = kind === 'field' ? field('Ada', [composed, asyncRule]) : kind === 'form' ? profile : profile.nested;
  fixture.componentInstance.node.set(node);
  component.query.set(composed);
  await render();
  expect(component.result()).toBe(true);
  const calls = composed.mock.calls.length;
  expect(component.state.hasValidator(leaf)).toBe(false);
  expect(component.state.hasValidator(asyncRule)).toBe(true);
  expect(composed).toHaveBeenCalledTimes(calls);
  node.$api.setValidators([]);
  expect(component.result()).toBe(false);
  fixture.componentInstance.node.set(field('Replacement', [composed]));
  await render();
  expect(component.result()).toBe(true);
  expect(component.state.hasValidator(asyncRule)).toBe(false);
});

it('returns undefined for arbitrary references with Angular Signal Forms', async () => {
  const { component } = await bind('formField');
  const validate = vi.fn(() => null);
  expect(component.state.hasValidator(validate)).toBeUndefined();
  expect(component.state.hasValidator(Validators.requiredTrue)).toBeUndefined();
  expect(validate).not.toHaveBeenCalled();
});

it('returns undefined when unbound', () => {
  const unbound = TestBed.createComponent(ValidatorControl);
  expect(unbound.componentInstance.state.hasValidator(required)).toBeUndefined();
  unbound.destroy();
});

it('follows replacement of an Angular control', async () => {
  const { fixture, render, component, control } = await bind('formControl');
  const validate = () => null;
  control!.addValidators(validate);
  control!.updateValueAndValidity();
  component.query.set(validate);
  expect(component.result()).toBe(true);
  fixture.componentInstance.control = new FormControl('Replacement');
  await render();
  expect(component.result()).toBe(false);
  control!.updateValueAndValidity();
  expect(component.result()).toBe(false);
});

it.each(['field', 'form', 'nested form'] as const)('resolves synchronous compositions on a %s and tracks their dependencies', async (kind) => {
  const { fixture, render, component } = await bind('formNode');
  const enabled = signal(true);
  const resolve = signal(false);
  const leaf = vi.fn(() => ({ kind: 'policy' }));
  const alternate = vi.fn(() => null);
  const composed = vi.fn(() => enabled() ? leaf : alternate);
  const profile = form({ name: field('Ada'), nested: form({ name: field('Ada') }, { validators: [composed] }) }, { validators: [composed] });
  const node = kind === 'field' ? field('Ada', [composed]) : kind === 'form' ? profile : profile.nested;
  fixture.componentInstance.node.set(node);
  await render();
  const present = computed(() => component.state.hasValidator(leaf, { resolve: resolve() }));
  expect(present()).toBe(false);
  expect(component.state.hasValidator(composed)).toBe(true);
  const calls = composed.mock.calls.length;
  const leafCalls = leaf.mock.calls.length;
  resolve.set(true);
  expect(present()).toBe(true);
  expect(component.state.hasValidator(composed, { resolve: true })).toBe(false);
  expect(composed).toHaveBeenCalledTimes(calls);
  expect(leaf).toHaveBeenCalledTimes(leafCalls);
  enabled.set(false);
  expect(present()).toBe(false);
  expect(component.state.hasValidator(alternate, { resolve: true })).toBe(true);
  expect(node.$api.errors()).toEqual([]);
  expect(composed).toHaveBeenCalledTimes(calls + 1);
  enabled.set(true);
  expect(present()).toBe(true);
  expect(node.$api.hasError('policy')).toBe(true);
  resolve.set(false);
  expect(present()).toBe(false);
  fixture.componentInstance.node.set(field('Replacement', [leaf]));
  await render();
  expect(present()).toBe(true);
  fixture.destroy();
  expect(present()).toBeUndefined();
});

it.each(['field', 'form'] as const)('does not start async work when resolving a disabled %s', async (kind) => {
  const { fixture, render, component } = await bind('formNode');
  const run = vi.fn(async () => null);
  const remote = asyncValidator(run);
  const node = kind === 'field' ? field('Ada', [remote], { disabled: true })
    : form({ name: field('Ada') }, { validators: [remote], disabled: true });
  fixture.componentInstance.node.set(node);
  await render();
  expect(component.state.hasValidator(remote, { resolve: true })).toBe(true);
  expect(run).not.toHaveBeenCalled();
  expect(node.$api.pending()).toBe(false);
});

it.each(['formControl', 'formControlName', 'ngModel'] as const)('keeps Angular %s reference semantics with resolve enabled', async (source) => {
  const { component, control, render } = await bind(source);
  const leaf = vi.fn(() => null);
  const composed = Validators.compose([leaf])!;
  control!.setValidators(composed);
  control!.updateValueAndValidity();
  await render();
  const calls = leaf.mock.calls.length;
  expect(component.state.hasValidator(leaf, { resolve: true })).toBe(false);
  expect(component.state.hasValidator(composed, { resolve: true })).toBe(true);
  expect(leaf).toHaveBeenCalledTimes(calls);
});

it.each(['formNode', 'formField', 'formControl', 'formControlName', 'ngModel'] as const)('keeps required equivalence with resolve enabled on %s', async (source) => {
  const { fixture, render, component } = await bind(source);
  fixture.componentInstance.required.set(true);
  await render();
  expect(component.state.hasValidator(required, { resolve: true })).toBe(true);
  expect(component.state.hasValidator(Validators.required, { resolve: true })).toBe(true);
  if (source === 'formField') {
    expect(component.state.hasValidator(() => null, { resolve: true })).toBeUndefined();
  }
  expect(component.state.hasValidator(null, { resolve: true })).toBeUndefined();
});

it.each(['formControl', 'formControlName', 'ngModel'] as const)('memoizes normalized validator queries on %s', async (source) => {
  const { control, component, render } = await bind(source);
  if (!control) throw new Error('Expected an Angular control binding');
  const validator = () => null;
  control.addValidators(validator);
  await render();
  const query = vi.spyOn(control, 'hasValidator');
  const read = vi.fn(() => component.state.hasValidator(validator, { resolve: true }));
  const result = computed(read);
  expect(result()).toBe(true);
  const calls = query.mock.calls.length;
  expect(component.state.hasValidator(validator, { resolve: true })).toBe(true);
  expect(query).toHaveBeenCalledTimes(calls);
  control.addValidators(() => null);
  await render();
  expect(result()).toBe(true);
  expect(read).toHaveBeenCalledTimes(1);
  control.removeValidators(validator);
  await render();
  expect(result()).toBe(false);
  expect(read).toHaveBeenCalledTimes(2);
});

describe('hasValidators', () => {
  it('returns false without a binding, including after destruction', () => {
    const fixture = TestBed.createComponent(ValidatorControl);
    expect(fixture.componentInstance.state.hasValidators()).toBe(false);
    fixture.destroy();
    expect(fixture.componentInstance.state.hasValidators()).toBe(false);
  });

  it('returns undefined for Signal Forms even when a known rule is active', async () => {
    const { fixture, render, component } = await bind('formField');
    expect(component.state.hasValidators()).toBeUndefined();
    fixture.componentInstance.required.set(true);
    await render();
    expect(component.state.required()).toBe(true);
    expect(component.state.hasValidators()).toBeUndefined();
    fixture.destroy();
    expect(component.state.hasValidators()).toBe(false);
  });

  it.each(['field', 'form', 'nested form'] as const)('tracks own registrations on a %s without running validators or counting descendants', async (kind) => {
    const { fixture, render, component } = await bind('formNode');
    const profile = form({ name: field('', required), nested: form({ name: field('', required) }) });
    const node = kind === 'field' ? field('Ada') : kind === 'form' ? profile : profile.nested;
    fixture.componentInstance.node.set(node);
    await render();
    expect(component.state.hasValidators()).toBe(false);
    const composed = vi.fn(() => []);
    const remote = vi.fn(async () => null);
    const asyncRule = asyncValidator(remote);
    node.$api.disable();
    node.$api.setValidators([composed, asyncRule]);
    expect(component.state.hasValidators()).toBe(true);
    expect(composed).not.toHaveBeenCalled();
    expect(remote).not.toHaveBeenCalled();
    expect(component.state.errors()).toEqual([]);
    node.$api.reset();
    expect(component.state.hasValidators()).toBe(true);
    node.$api.setValidators(asyncRule);
    expect(component.state.hasValidators()).toBe(true);
    expect(remote).not.toHaveBeenCalled();
    node.$api.setValidators([]);
    expect(component.state.hasValidators()).toBe(false);
    node.$api.setValidators(requiredIf(() => false));
    node.$api.enable();
    expect(component.state.hasValidators()).toBe(true);
    expect(node.$api.errors()).toEqual([]);
    fixture.componentInstance.node.set(field('Replacement'));
    await render();
    expect(component.state.hasValidators()).toBe(false);
    node.$api.setValidators(required);
    expect(component.state.hasValidators()).toBe(false);
    fixture.destroy();
    expect(component.state.hasValidators()).toBe(false);
  });

  it.each(['formControl', 'formControlName', 'ngModel'] as const)('tracks sync and async registrations on %s independently of errors', async (source) => {
    const { fixture, render, component, control } = await bind(source);
    // The inactive required directive still registers a validator.
    expect(component.state.hasValidators()).toBe(true);
    expect(component.state.required()).toBe(false);
    control!.clearValidators();
    control!.updateValueAndValidity();
    expect(component.state.hasValidators()).toBe(false);
    control!.setErrors({ manual: true });
    expect(component.state.invalid()).toBe(true);
    expect(component.state.hasValidators()).toBe(false);
    control!.setErrors(null);
    const validate = vi.fn(() => null);
    control!.addValidators(validate);
    control!.updateValueAndValidity();
    const calls = validate.mock.calls.length;
    expect(component.state.hasValidators()).toBe(true);
    expect(component.state.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledTimes(calls);
    control!.disable();
    expect(component.state.hasValidators()).toBe(true);
    control!.clearValidators();
    control!.updateValueAndValidity({ emitEvent: false });
    await render();
    expect(component.state.hasValidators()).toBe(false);
    const remote = vi.fn(async () => null);
    control!.addAsyncValidators(remote);
    await render();
    expect(component.state.hasValidators()).toBe(true);
    expect(remote).not.toHaveBeenCalled();
    control!.clearAsyncValidators();
    await render();
    expect(component.state.hasValidators()).toBe(false);
    fixture.destroy();
    expect(component.state.hasValidators()).toBe(false);
  });

  it('follows replacement of an Angular control', async () => {
    const { fixture, render, component, control } = await bind('formControl');
    control!.clearValidators();
    control!.updateValueAndValidity();
    expect(component.state.hasValidators()).toBe(false);
    fixture.componentInstance.control = new FormControl('Replacement', Validators.required);
    await render();
    expect(component.state.hasValidators()).toBe(true);
    control!.updateValueAndValidity();
    expect(component.state.hasValidators()).toBe(true);
    fixture.componentInstance.control.clearValidators();
    fixture.componentInstance.control.updateValueAndValidity();
    expect(component.state.hasValidators()).toBe(false);
  });
});
