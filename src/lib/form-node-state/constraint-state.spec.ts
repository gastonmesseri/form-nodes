// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, forwardRef, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { FormControl, FormGroup, FormsModule, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule, Validators, type ControlValueAccessor } from '@angular/forms';

import { useFormNodeState } from './form-node-state';

@Component({
  selector: 'input[constraint-state-control]',
  template: '',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ConstraintControl), multi: true }],
})
class ConstraintControl implements ControlValueAccessor {
  state = useFormNodeState();

  writeValue() {}

  registerOnChange() {}

  registerOnTouched() {}
}

@Component({ template: '', imports: [ConstraintControl, FormsModule, ReactiveFormsModule] })
class Host {
  control = new FormControl('Ada', { nonNullable: true });

  profile = new FormGroup({ name: this.control });

  name = 'Ada';

  min = signal<string | number | null>('1.5');

  max = signal<string | number | null>('9.5');

  minLength = signal<string | number | null>('2');

  maxLength = signal<string | number | null>('8');

  pattern = signal<string | RegExp>('A.*');
}

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

const bindings = {
  formControl: '[formControl]="control"',
  formControlName: 'formControlName="name"',
  ngModel: '[(ngModel)]="name" [ngModelOptions]="{ standalone: true }"',
};

const bind = async (source: keyof typeof bindings, numeric: boolean) => {
  const attributes = numeric ? 'type="number" [min]="min()" [max]="max()"' : 'type="text" [minlength]="minLength()" [maxlength]="maxLength()" [pattern]="pattern()"';
  const input = `<input constraint-state-control ${bindings[source]} ${attributes} />`;
  TestBed.overrideComponent(Host, { set: { template: source === 'formControlName' ? `<form [formGroup]="profile">${input}</form>` : input } });
  const fixture = TestBed.createComponent(Host);
  const render = async () => {
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  await render();
  const element = source === 'formControlName' ? fixture.debugElement.children[0]!.children[0]! : fixture.debugElement.children[0]!;
  return { fixture, render, state: (element.componentInstance as ConstraintControl).state, control: element.injector.get(NgControl).control! };
};

describe.each(['formControl', 'formControlName', 'ngModel'] as const)('useFormNodeState constraints with %s', (source) => {
  it('reads length and pattern directives while valid and follows changes and removal', async () => {
    const { fixture, render, state, control } = await bind(source, false);
    expect(state.minLength()).toBe(2);
    expect(state.maxLength()).toBe(8);
    expect(state.pattern()).toEqual([/^A.*$/]);
    expect(state.errors()).toEqual([]);
    const firstPatterns = state.pattern();
    await render();
    expect(state.pattern()).toBe(firstPatterns);
    fixture.componentInstance.minLength.set(1);
    fixture.componentInstance.maxLength.set('10');
    const expression = /Ada/i;
    fixture.componentInstance.pattern.set(expression);
    await render();
    expect(state.minLength()).toBe(1);
    expect(state.maxLength()).toBe(10);
    expect(state.pattern()).toEqual([expression]);
    expect(state.pattern()[0]).toBe(expression);
    expect(state.errors()).toEqual([]);
    control.disable();
    expect(state.minLength()).toBe(1);
    expect(state.pattern()).toEqual([expression]);
    fixture.componentInstance.minLength.set(null);
    fixture.componentInstance.maxLength.set(null);
    fixture.componentInstance.pattern.set('');
    await render();
    expect(state.minLength()).toBeUndefined();
    expect(state.maxLength()).toBeUndefined();
    expect(state.pattern()).toEqual([]);
    fixture.destroy();
    expect(state.connected()).toBe(false);
    expect(state.pattern()).toEqual([]);
  });

  it('reads numeric bounds without probing validator functions', async () => {
    const { fixture, render, state, control } = await bind(source, true);
    control.setValue(5);
    expect(state.min()).toBe(1.5);
    expect(state.max()).toBe(9.5);
    expect(state.errors()).toEqual([]);
    fixture.componentInstance.min.set(0);
    fixture.componentInstance.max.set('10.25');
    await render();
    expect(state.min()).toBe(0);
    expect(state.max()).toBe(10.25);
    expect(state.errors()).toEqual([]);
    fixture.componentInstance.min.set(null);
    fixture.componentInstance.max.set(null);
    await render();
    control.addValidators([Validators.min(2), Validators.max(8)]);
    control.updateValueAndValidity();
    expect(state.min()).toBeUndefined();
    expect(state.max()).toBeUndefined();
    fixture.componentInstance.min.set('not-a-number');
    await render();
    expect(state.min()).toBeUndefined();
  });
});
