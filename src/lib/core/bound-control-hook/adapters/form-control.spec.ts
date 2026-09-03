// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, effect, forwardRef } from '@angular/core';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, type ControlValueAccessor } from '@angular/forms';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { injectFormControlBoundControl } from './form-control';

@Component({
  selector: 'reactive-adapter-control',
  template: '',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ReactiveAdapterControl), multi: true }],
})
class ReactiveAdapterControl implements ControlValueAccessor {
  state = injectFormControlBoundControl<string>();
  observedValues: string[] = [];
  constructor() {
    effect(() => {
      if (!this.state.connected()) return;
      const value = this.state.value();
      if (value !== undefined) this.observedValues.push(value);
    });
  }
  writeValue() {}
  registerOnChange() {}
  registerOnTouched() {}
}

@Component({
  template: `<reactive-adapter-control [formControl]="name" />`,
  standalone: true,
  imports: [ReactiveAdapterControl, ReactiveFormsModule],
})
class Host {
  name = new FormControl('', { nonNullable: true });
}

const createBoundControl = async () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const state = (fixture.debugElement.children[0]!.componentInstance as ReactiveAdapterControl).state;
  return { component: fixture.debugElement.children[0]!.componentInstance as ReactiveAdapterControl, control: fixture.componentInstance.name, fixture, state };
};

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('formControl bound-control adapter', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());

  it('connects to a same-host FormControlDirective', async () => {
    const { state } = await createBoundControl();
    expect(state.source).toBe('formControl');
    expect(state.connected()).toBe(true);
  });

  it('tracks value changes', async () => {
    const { control, state } = await createBoundControl();
    expect(state.value()).toBe('');
    control.setValue('Marco');
    expect(state.value()).toBe('Marco');
  });

  it('notifies an asynchronous effect of value changes', async () => {
    const { component, control } = await createBoundControl();
    expect(component.observedValues).toEqual(['']);

    control.setValue('Marco');
    TestBed.flushEffects();
    expect(component.observedValues).toEqual(['', 'Marco']);
  });

  it('tracks disabled changes', async () => {
    const { control, state } = await createBoundControl();
    expect(state.disabled()).toBe(false);
    control.disable();
    expect(state.disabled()).toBe(true);
    control.enable();
    expect(state.disabled()).toBe(false);
  });

  it('tracks dirty changes', async () => {
    const { control, state } = await createBoundControl();
    expect(state.dirty()).toBe(false);
    control.markAsDirty();
    expect(state.dirty()).toBe(true);
    control.markAsPristine();
    expect(state.dirty()).toBe(false);
  });

  it('tracks and normalizes error changes', async () => {
    const { control, state } = await createBoundControl();
    expect(state.errors()).toEqual([]);
    control.setErrors({ object: { reason: 'taken' }, flag: true, primitive: 'reason' });
    expect(state.errors()).toEqual([
      { kind: 'object', reason: 'taken' },
      { kind: 'flag' },
      { kind: 'primitive', value: 'reason' },
    ]);
    control.setErrors(null);
    expect(state.errors()).toEqual([]);
  });

  it('tracks invalid changes', async () => {
    const { control, state } = await createBoundControl();
    expect(state.invalid()).toBe(false);
    control.setErrors({ custom: true });
    expect(state.invalid()).toBe(true);
    control.setErrors(null);
    expect(state.invalid()).toBe(false);
  });

  it('tracks pending changes', async () => {
    const { control, state } = await createBoundControl();
    expect(state.pending()).toBe(false);
    control.markAsPending();
    expect(state.pending()).toBe(true);
    control.updateValueAndValidity();
    expect(state.pending()).toBe(false);
  });

  it('tracks touched changes', async () => {
    const { control, state } = await createBoundControl();
    expect(state.touched()).toBe(false);
    control.markAsTouched();
    expect(state.touched()).toBe(true);
    control.markAsUntouched();
    expect(state.touched()).toBe(false);
  });

  it('provides neutral values for state unavailable from FormControl', async () => {
    const { state } = await createBoundControl();
    expect(state.disabledReasons()).toEqual([]);
    expect(state.hidden()).toBe(false);
    expect(state.max()).toBeUndefined();
    expect(state.maxLength()).toBeUndefined();
    expect(state.min()).toBeUndefined();
    expect(state.minLength()).toBeUndefined();
    expect(state.name()).toBeUndefined();
    expect(state.pattern()).toEqual([]);
    expect(state.readonly()).toBe(false);
    expect(state.required()).toBe(false);
  });

  it('disconnects when its component is destroyed', async () => {
    const { fixture, state } = await createBoundControl();
    expect(state.connected()).toBe(true);
    fixture.destroy();
    expect(state.connected()).toBe(false);
  });
});
