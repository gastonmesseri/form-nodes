// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, computed, forwardRef, signal } from '@angular/core';
import { FormField, form as angularForm, validate } from '@angular/forms/signals';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { FormControl, FormGroup, FormsModule, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule, type ControlValueAccessor } from '@angular/forms';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import type { AnyNode } from '../types/node.type';
import { useFormNodeState } from './form-node-state';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';
import { FormNodeDirective } from '../form-node/form-node.directive';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

@Component({
  selector: 'error-query-control',
  template: '',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ErrorControl), multi: true }],
})
class ErrorControl implements ControlValueAccessor {
  state = useFormNodeState();

  hasIssue = computed(() => this.state.hasError('issue'));

  issue = computed(() => this.state.getError('issue'));

  writeValue() {}

  registerOnChange() {}

  registerOnTouched() {}
}

@Component({ template: '', imports: [ErrorControl, FormNodeDirective, FormField, FormsModule, ReactiveFormsModule] })
class Host {
  issues = signal<{ kind: string; message: string }[]>([]);

  validate = vi.fn(() => this.issues());

  node = signal<AnyNode>(field('Ada', [this.validate]));

  control = new FormControl('Ada');

  profile = new FormGroup({ name: this.control });

  name = 'Ada';

  value = signal('Ada');

  angularField = angularForm(this.value, path => validate(path, this.validate));
}

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

const templates = {
  formNode: '<error-query-control [formNode]="node()" />',
  formField: '<error-query-control [formField]="angularField" />',
  formControl: '<error-query-control [formControl]="control" />',
  formControlName: '<form [formGroup]="profile"><error-query-control formControlName="name" /></form>',
  ngModel: '<error-query-control [(ngModel)]="name" [ngModelOptions]="{ standalone: true }" />',
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
  const component = element.componentInstance as ErrorControl;
  const setIssue = async (message?: string) => {
    if (source === 'formNode' || source === 'formField') {
      fixture.componentInstance.issues.set(message === undefined ? [] : [{ kind: 'issue', message }]);
    } else {
      element.injector.get(NgControl).control!.setErrors(message === undefined ? null : { issue: { message } });
    }
    await render();
  };
  return { fixture, render, component, setIssue, element };
};

describe.each(['formNode', 'formField', 'formControl', 'formControlName', 'ngModel'] as const)('state error queries with %s', (source) => {
  it('tracks appearance, changed details, clearing, and destruction without running validation again', async () => {
    const { fixture, component, setIssue } = await bind(source);
    const { state } = component;
    expect(component.hasIssue()).toBe(false);
    expect(component.issue()).toBeUndefined();
    await setIssue('First');
    expect(state.errors()).toEqual([expect.objectContaining({ kind: 'issue', message: 'First' })]);
    const calls = fixture.componentInstance.validate.mock.calls.length;
    expect(component.hasIssue()).toBe(true);
    expect(component.issue()).toBe(state.errors()[0]);
    expect(state.hasError('Issue')).toBe(false);
    expect(state.getError('missing')).toBeUndefined();
    const { hasError, getError } = state;
    expect(hasError('issue')).toBe(true);
    expect(getError('issue')).toBe(state.errors()[0]);
    expect(fixture.componentInstance.validate).toHaveBeenCalledTimes(calls);
    await setIssue('Updated');
    expect(component.issue()?.['message']).toBe('Updated');
    await setIssue();
    expect(component.hasIssue()).toBe(false);
    expect(component.issue()).toBeUndefined();
    await setIssue('Before destroy');
    fixture.destroy();
    expect(state.connected()).toBe(false);
    expect(component.hasIssue()).toBe(false);
    expect(component.issue()).toBeUndefined();
  });
});

it('uses normalized entry presence even for false, zero, and null Angular payloads', async () => {
  const { element, component } = await bind('formControl');
  element.injector.get(NgControl).control!.setErrors({ flag: false, count: 0, empty: null });
  for (const [kind, value] of [['flag', false], ['count', 0], ['empty', null]] as const) {
    expect(component.state.hasError(kind)).toBe(true);
    expect(component.state.getError(kind)).toEqual({ kind, value });
  }
});

it.each(['field', 'form', 'nested form'] as const)('returns the first matching error for a %s and follows rebinding', async (kind) => {
  const { fixture, render, component } = await bind('formNode');
  const validators = () => [{ kind: 'issue', message: 'First' }, { kind: 'issue', message: 'Second' }];
  const profile = form({ nested: form({ name: field('', [required]) }, { validators }) }, { validators });
  fixture.componentInstance.node.set(kind === 'field' ? field('', [validators]) : kind === 'form' ? profile : profile.nested);
  await render();
  expect(component.state.getError('issue')?.['message']).toBe('First');
  expect(component.state.getError('issue')).toBe(component.state.errors()[0]);
  expect(component.state.errors().filter(error => error.kind === 'issue')).toHaveLength(2);
  expect(component.state.hasError('required')).toBe(false);
  fixture.componentInstance.node.set(field('valid'));
  await render();
  expect(component.hasIssue()).toBe(false);
  expect(component.issue()).toBeUndefined();
});

it('returns neutral queries without a host binding', () => {
  const fixture = TestBed.createComponent(ErrorControl);
  expect(fixture.componentInstance.state.hasError('required')).toBe(false);
  expect(fixture.componentInstance.state.getError('required')).toBeUndefined();
});

it('follows silent error changes and a replaced Angular control', async () => {
  const { fixture, render, component } = await bind('formControl');
  expect(component.hasIssue()).toBe(false);
  fixture.componentInstance.control.setErrors({ issue: { message: 'Silent' } }, { emitEvent: false });
  await render();
  expect(component.issue()?.['message']).toBe('Silent');
  const oldControl = fixture.componentInstance.control;
  fixture.componentInstance.control = new FormControl('Replacement');
  await render();
  expect(component.hasIssue()).toBe(false);
  oldControl.setErrors({ issue: { message: 'Old control' } });
  expect(component.issue()).toBeUndefined();
});

it.each(['field', 'form'] as const)('observes async errors on a %s without starting extra validation', async (kind) => {
  const { fixture, render, component } = await bind('formNode');
  let finish!: (errors: { kind: string; message: string }[]) => void;
  const validate = vi.fn(() => new Promise<{ kind: string; message: string }[]>((resolve) => { finish = resolve; }));
  const validators = [asyncValidator(validate)];
  fixture.componentInstance.node.set(kind === 'field' ? field('Ada', validators) : form({ name: field('Ada') }, { validators }));
  await render();
  await vi.waitFor(() => expect(validate).toHaveBeenCalledTimes(1));
  expect(component.state.pending()).toBe(true);
  expect(component.hasIssue()).toBe(false);
  expect(component.issue()).toBeUndefined();
  expect(validate).toHaveBeenCalledTimes(1);
  finish([{ kind: 'issue', message: 'Unavailable' }]);
  await vi.waitFor(() => {
    fixture.detectChanges();
    expect(component.hasIssue()).toBe(true);
  });
  expect(component.issue()?.['message']).toBe('Unavailable');
  expect(component.state.pending()).toBe(false);
  expect(component.state.invalid()).toBe(true);
  expect(validate).toHaveBeenCalledTimes(1);
});

it.each(['field', 'form', 'nested form'] as const)('memoizes error queries on a %s without retaining replaced error objects', async (kind) => {
  const { fixture, render, component } = await bind('formNode');
  const issues = signal([{ kind: 'issue', message: 'First' }]);
  const validator = () => issues();
  const profile = form({ nested: form({ name: field('Ada') }, { validators: [validator] }) }, { validators: [validator] });
  fixture.componentInstance.node.set(kind === 'field' ? field('Ada', [validator]) : kind === 'form' ? profile : profile.nested);
  await render();
  const hasIssue = vi.fn(() => component.state.hasError('issue'));
  const missing = vi.fn(() => component.state.getError('missing'));
  const present = computed(hasIssue);
  const absent = computed(missing);
  expect(present()).toBe(true);
  expect(absent()).toBeUndefined();
  const first = component.state.getError('issue');
  issues.set([{ kind: 'issue', message: 'Second' }]);
  expect(present()).toBe(true);
  expect(absent()).toBeUndefined();
  expect(hasIssue).toHaveBeenCalledTimes(1);
  expect(missing).toHaveBeenCalledTimes(1);
  expect(component.state.getError('issue')).not.toBe(first);
  expect(component.state.getError('issue')).toBe(component.state.errors()[0]);
  issues.set([]);
  expect(present()).toBe(false);
  expect(hasIssue).toHaveBeenCalledTimes(2);
  fixture.destroy();
  expect(component.state.getError('issue')).toBeUndefined();
});
