// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, VERSION, forwardRef, signal } from '@angular/core';
import { FormField, form as angularForm } from '@angular/forms/signals';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { FormControl, FormGroup, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators, type ControlValueAccessor } from '@angular/forms';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { required } from '../validation/validators/required';
import { provideFormNodeStateErrors } from './control-errors';
import { asyncValidator } from '../validation/async-validator';
import { FormNodeDirective } from '../form-node/form-node.directive';
import { useFormNodeState, type FormNodeStateOptions } from './form-node-state';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());
afterEach(() => TestBed.resetTestingModule());

type ErrorResult = ReturnType<NonNullable<FormNodeStateOptions['errors']>>;

@Component({
  selector: 'error-control',
  template: '<input [value]="value ?? \'\'" (input)="input($any($event.target).value)" (blur)="touch()" />',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ErrorControl), multi: true }],
})
class ErrorControl implements ControlValueAccessor {
  value: unknown = null;

  issue = signal<ErrorResult>(null);

  otherIssue = signal<ErrorResult>(null);

  evaluate = vi.fn(() => this.issue());

  state = useFormNodeState({ errors: this.evaluate });

  otherState = useFormNodeState({ errors: () => this.otherIssue() });

  change = (_value: unknown) => {};

  touch = () => {};

  writeValue(value: unknown) {
    this.value = value;
    this.issue.set(null);
  }

  registerOnChange(callback: (value: unknown) => void) {
    this.change = callback;
  }

  registerOnTouched(callback: () => void) {
    this.touch = callback;
  }

  input(value: string) {
    this.issue.set(value === 'invalid' ? { kind: 'invalidDate', message: 'Enter a valid date.' } : null);
    this.change(null);
  }
}

it.each(['field', 'form'] as const)('owns reactive errors on a bound %s through edits, suppression, rebinding, and destruction', async (kind) => {
  const create = () => {
    return kind === 'field' ? field<string>(null, required) : form({ date: field<string>(null, required) }, { validators: () => ({ kind: 'business' }) });
  };
  const first = create();
  const second = create();
  const root = form({ nested: form({ date: first }) });
  @Component({
    template: '<error-control [formNode]="node" />',
    imports: [ErrorControl, FormNodeDirective],
  })
  class Host {
    get node() { return this.target(); }

    target = signal(first);
  }
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const control = fixture.debugElement.children[0]!.componentInstance as ErrorControl;
  const calls = control.evaluate.mock.calls.length;
  control.issue.set({ kind: 'invalidDate', message: 'Enter a valid date.' });
  fixture.detectChanges();
  expect(control.evaluate).toHaveBeenCalledTimes(calls + 1);
  expect(first.hasError('invalidDate')).toBe(true);
  expect(first.hasError(kind === 'field' ? 'required' : 'business')).toBe(true);
  expect(root.invalid()).toBe(true);
  expect(root.allErrors().some(error => error.kind === 'invalidDate')).toBe(true);
  expect(first.dirty()).toBe(false);
  expect(first.touched()).toBe(false);
  expect(first.pending()).toBe(false);
  first.errors();
  control.state.errors();
  expect(control.evaluate).toHaveBeenCalledTimes(calls + 1);
  control.otherIssue.set('Another problem');
  fixture.detectChanges();
  control.issue.set(undefined);
  fixture.detectChanges();
  expect(first.hasError('invalidDate')).toBe(false);
  expect(first.errors().find(error => error.kind === 'custom')?.message).toBe('Another problem');
  first.disable();
  fixture.detectChanges();
  expect(first.errors()).toEqual([]);
  first.enable();
  fixture.detectChanges();
  expect(first.hasError('custom')).toBe(true);
  first.markAsReadonly();
  fixture.detectChanges();
  expect(first.errors()).toEqual([]);
  first.markAsWritable();
  first.hide();
  expect(first.errors()).toEqual([]);
  first.show();
  fixture.detectChanges();
  expect(first.hasError('custom')).toBe(true);
  control.issue.set({ kind: 'invalidDate' });
  fixture.detectChanges();
  first.resetToInitial();
  fixture.detectChanges();
  expect(first.hasError('invalidDate')).toBe(false);
  expect(first.hasError('custom')).toBe(true);
  fixture.componentInstance.target.set(second);
  fixture.changeDetectorRef.markForCheck();
  fixture.detectChanges();
  await fixture.whenStable();
  expect(first.hasError('custom')).toBe(false);
  expect(second.hasError('custom')).toBe(true);
  fixture.destroy();
  expect(second.hasError('custom')).toBe(false);
  expect(control.state.connected()).toBe(false);
});

it.each<ErrorResult>([null, undefined, [], 'Message', '', { kind: 'invalidDate', message: 'Invalid date' }, ['First', { kind: 'second' }]])('normalizes the supported result %j', (result) => {
  @Component({
    template: '<error-control [formNode]="node" />',
    imports: [ErrorControl, FormNodeDirective],
  })
  class Host {
    node = field<string>(null);
  }
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const control = fixture.debugElement.children[0]!.componentInstance as ErrorControl;
  control.issue.set(result);
  fixture.detectChanges();
  const expected = (result === null || result === undefined) ? [] : (Array.isArray(result) ? result : [result]).map(item => typeof item === 'string' ? { kind: 'custom', message: item } : item);
  expect(fixture.componentInstance.node.errors().map(({ targetNode, formNode, ...error }) => error)).toEqual(expected);
  expect(fixture.componentInstance.node.valid()).toBe(expected.length === 0);
});

it.each(['formControl', 'formControlName', 'ngModel'] as const)('contributes independently owned validators through %s', async (binding) => {
  @Component({
    template: binding === 'formControl' ? '<error-control [formControl]="control" />'
      : binding === 'formControlName' ? '<div [formGroup]="group"><error-control formControlName="date" /></div>'
        : '<error-control [(ngModel)]="value" required />',
    imports: [ErrorControl, FormsModule, ReactiveFormsModule],
  })
  class Host {
    value = null;

    target = signal(new FormControl(null, Validators.required));

    get control() { return this.target(); }

    group = new FormGroup({ date: this.control });
  }
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const debugControl = binding === 'formControlName' ? fixture.debugElement.children[0]!.children[0]! : fixture.debugElement.children[0]!;
  const control = debugControl.componentInstance as ErrorControl;
  control.issue.set({ kind: 'invalidDate', message: 'Invalid date' });
  control.otherIssue.set({ kind: 'other' });
  fixture.detectChanges();
  expect(control.state.hasError('invalidDate')).toBe(true);
  expect(control.state.hasError('required')).toBe(true);
  expect(control.state.invalid()).toBe(true);
  expect(control.state.dirty()).toBe(false);
  expect(control.state.touched()).toBe(false);
  control.issue.set(null);
  fixture.detectChanges();
  expect(control.state.hasError('invalidDate')).toBe(false);
  expect(control.state.hasError('other')).toBe(true);
  expect(control.state.hasError('required')).toBe(true);
  if (binding !== 'ngModel') {
    const first = fixture.componentInstance.control;
    expect(first.errors).toHaveProperty('other');
    first.disable();
    fixture.detectChanges();
    expect(control.state.disabled()).toBe(true);
    expect(control.state.invalid()).toBe(false);
    expect(control.state.errors()).toEqual([]);
    first.enable();
    fixture.detectChanges();
    expect(control.state.invalid()).toBe(true);
    expect(fixture.componentInstance.group.invalid).toBe(true);
    const second = new FormControl(null, Validators.required);
    fixture.componentInstance.target.set(second);
    fixture.componentInstance.group.setControl('date', second);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    fixture.detectChanges();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(first.errors).toEqual({ required: true });
    expect(second.errors).toHaveProperty('other');
    fixture.destroy();
    expect(second.errors).toEqual({ required: true });
  } else fixture.destroy();
});

it('does not evaluate disconnected error sources', () => {
  const fixture = TestBed.createComponent(ErrorControl);
  fixture.detectChanges();
  fixture.componentInstance.issue.set('Invalid');
  fixture.detectChanges();
  expect(fixture.componentInstance.evaluate).not.toHaveBeenCalled();
  expect(fixture.componentInstance.state.errors()).toEqual([]);
  expect(fixture.componentInstance.state.invalid()).toBe(false);
});

it.each(['field', 'form'] as const)('preserves %s component errors when pending asynchronous validation completes', async (kind) => {
  let complete!: (result: null) => void;
  const validate = vi.fn(() => new Promise<null>((resolve) => { complete = resolve; }));
  @Component({
    template: '<error-control [formNode]="node" />',
    imports: [ErrorControl, FormNodeDirective],
  })
  class Host {
    node = kind === 'field' ? field<string>(null, asyncValidator(validate))
      : form({ date: field<string>(null) }, { validators: asyncValidator(validate) });
  }
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const node = fixture.componentInstance.node;
  const control = fixture.debugElement.children[0]!.componentInstance as ErrorControl;
  expect(node.pending()).toBe(true);
  await fixture.whenStable();
  expect(validate).toHaveBeenCalledTimes(1);
  control.issue.set('Invalid');
  fixture.detectChanges();
  expect(node.hasError('custom')).toBe(true);
  expect(node.pending()).toBe(true);
  expect(validate).toHaveBeenCalledTimes(1);
  complete(null);
  await Promise.resolve();
  fixture.detectChanges();
  expect(node.hasError('custom')).toBe(true);
  expect(node.invalid()).toBe(true);
  expect(node.pending()).toBe(false);
  control.issue.set(null);
  fixture.detectChanges();
  expect(node.valid()).toBe(true);
  expect(validate).toHaveBeenCalledTimes(1);
});

it('uses the public CVA validator bridge with Angular Signal Forms or reports its minimum version', async () => {
  TestBed.overrideComponent(ErrorControl, { add: { providers: [provideFormNodeStateErrors()] } });
  @Component({
    template: '<error-control [formField]="target()" />',
    imports: [ErrorControl, FormField],
  })
  class Host {
    first = angularForm(signal({ date: null }));

    second = angularForm(signal({ date: null }));

    target = signal(this.first.date);
  }
  const fixture = TestBed.createComponent(Host);
  if (Number(VERSION.major) < 22) {
    expect(() => { fixture.detectChanges(); fixture.detectChanges(); }).toThrow(/requires Angular 22/);
    return;
  }
  fixture.detectChanges();
  fixture.detectChanges();
  const control = fixture.debugElement.children[0]!.componentInstance as ErrorControl;
  control.issue.set({ kind: 'invalidDate' });
  fixture.detectChanges();
  expect(fixture.componentInstance.first().invalid()).toBe(true);
  expect(control.state.hasError('invalidDate')).toBe(true);
  control.issue.set(null);
  fixture.detectChanges();
  expect(fixture.componentInstance.first().valid()).toBe(true);
  control.otherIssue.set('Persistent local error');
  fixture.detectChanges();
  expect(fixture.componentInstance.first().invalid()).toBe(true);
  fixture.componentInstance.target.set(fixture.componentInstance.second.date);
  fixture.detectChanges();
  await fixture.whenStable();
  expect(fixture.componentInstance.first().valid()).toBe(true);
  expect(fixture.componentInstance.second().invalid()).toBe(true);
  fixture.destroy();
  expect(fixture.componentInstance.second().valid()).toBe(true);
});

it('propagates invalid input with an unchanged null value, blocks submission, and recovers on reset', async () => {
  const submit = vi.fn();
  @Component({
    template: '<error-control [formNode]="profile.nested.date" />',
    imports: [ErrorControl, FormNodeDirective],
  })
  class Host {
    profile = form({ nested: form({ date: field<string>(null) }) }, { onSubmit: submit });
  }
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const profile = fixture.componentInstance.profile;
  const control = fixture.debugElement.children[0]!.componentInstance as ErrorControl;
  expect(profile.valid()).toBe(true);
  input.value = 'invalid';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
  expect(profile.nested.date()).toBeNull();
  expect(profile.nested.date.hasError('invalidDate')).toBe(true);
  expect(profile.nested.invalid()).toBe(true);
  expect(profile.invalid()).toBe(true);
  expect(profile.touched()).toBe(false);
  input.dispatchEvent(new Event('blur'));
  fixture.detectChanges();
  expect(profile.touched()).toBe(true);
  expect(await profile.submit()).toBe(false);
  expect(submit).not.toHaveBeenCalled();
  profile.resetToInitial();
  fixture.detectChanges();
  expect(control.issue()).toBeNull();
  expect(profile.valid()).toBe(true);
  expect(profile.touched()).toBe(false);
  expect(profile.dirty()).toBe(false);
  expect(await profile.submit()).toBe(true);
  expect(submit).toHaveBeenCalledTimes(1);
});
