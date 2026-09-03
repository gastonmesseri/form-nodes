// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, input, output, resource, signal, type Type } from '@angular/core';
import { FormField, disabled, form as createAngularForm, validateAsync } from '@angular/forms/signals';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field } from '../../primitives/field';
import { max } from '../../validation/validators/max';
import { min } from '../../validation/validators/min';
import { required } from '../../validation/validators/required';
import { pattern } from '../../validation/validators/pattern';
import { maxLength } from '../../validation/validators/max-length';
import { minLength } from '../../validation/validators/min-length';
import { injectFormFieldControlStateAdapter } from './form-field';
import { registerSignalModelForJit } from '../../../../../tests/helpers/register-signal-input-for-jit';

@Component({ selector: 'form-field-adapter-control', template: '', standalone: true })
class FormFieldAdapterControl {
  value = input<unknown>(null);
  valueChange = output<unknown>();
  state = injectFormFieldControlStateAdapter<unknown>();
}

@Component({
  template: `<form-field-adapter-control [formField]="name.$field" />`,
  standalone: true,
  imports: [FormFieldAdapterControl, FormField],
})
class StringHost {
  minimumLength = signal<number | undefined>(3);
  maximumLength = signal<number | undefined>(20);
  expression = signal<RegExp | undefined>(/^[a-z]+$/i);
  name = field('', [
    required,
    minLength(() => this.minimumLength()),
    maxLength(() => this.maximumLength()),
    pattern(() => this.expression()),
  ], { nullable: false });
}

@Component({
  template: `<form-field-adapter-control [formField]="amount.$field" />`,
  standalone: true,
  imports: [FormFieldAdapterControl, FormField],
})
class NumericHost {
  minimum = signal<number | undefined>(1);
  maximum = signal<number | undefined>(10);
  amount = field(5, [min(() => this.minimum()), max(() => this.maximum())], { nullable: false });
}

@Component({
  template: `<form-field-adapter-control [formField]="amount" />`,
  standalone: true,
  imports: [FormFieldAdapterControl, FormField],
})
class PendingHost {
  resolveValidation: (() => void) | undefined;
  validationRuns = 0;
  value = signal(5);
  amount = createAngularForm(this.value, (path) => {
    validateAsync(path, {
      params: ({ value }) => value(),
      factory: params => resource({
        params,
        loader: () => {
          if (this.validationRuns++ === 0) return Promise.resolve(null);
          return new Promise<null>((resolve) => {
            this.resolveValidation = () => resolve(null);
          });
        },
      }),
      onSuccess: () => null,
      onError: () => null,
    });
  });
}

@Component({
  template: `<form-field-adapter-control [formField]="name" />`,
  standalone: true,
  imports: [FormFieldAdapterControl, FormField],
})
class DisabledReasonHost {
  value = signal('');
  name = createAngularForm(this.value, (path) => {
    disabled(path, { when: () => 'maintenance' });
  });
}

registerSignalModelForJit(FormFieldAdapterControl, 'value');

const createControlState = async <THost>(host: Type<THost>) => {
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const state = (fixture.debugElement.children[0]!.componentInstance as FormFieldAdapterControl).state;
  return { fixture, state };
};

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('formField control-state adapter', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());

  it('connects to a same-host FormField directive', async () => {
    const { state } = await createControlState(StringHost);
    expect(state.source).toBe('formField');
    expect(state.connected()).toBe(true);
  });

  it('tracks value changes', async () => {
    const { fixture, state } = await createControlState(StringHost);
    expect(state.value()).toBe('');
    fixture.componentInstance.name.set('Marco');
    TestBed.flushEffects();
    expect(state.value()).toBe('Marco');
  });

  it('tracks disabled changes', async () => {
    const { fixture, state } = await createControlState(StringHost);
    expect(state.disabled()).toBe(false);
    fixture.componentInstance.name.disable();
    expect(state.disabled()).toBe(true);
    fixture.componentInstance.name.enable();
    expect(state.disabled()).toBe(false);
  });

  it('tracks normalized disabled reason changes', async () => {
    const { fixture, state } = await createControlState(StringHost);
    expect(state.disabledReasons()).toEqual([]);
    fixture.componentInstance.name.disable('maintenance');
    expect(state.disabledReasons()).toEqual([{}]);
    fixture.componentInstance.name.enable();
    expect(state.disabledReasons()).toEqual([]);

    const angularBinding = await createControlState(DisabledReasonHost);
    expect(angularBinding.state.disabledReasons()).toEqual([{ message: 'maintenance' }]);
  });

  it('tracks dirty changes', async () => {
    const { fixture, state } = await createControlState(StringHost);
    expect(state.dirty()).toBe(false);
    fixture.componentInstance.name.markAsDirty();
    TestBed.flushEffects();
    expect(state.dirty()).toBe(true);
    fixture.componentInstance.name.markAsPristine();
    TestBed.flushEffects();
    expect(state.dirty()).toBe(false);
  });

  it('tracks and normalizes error changes', async () => {
    const { fixture, state } = await createControlState(StringHost);
    expect(state.errors()).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'required' })]));
    expect(state.errors()[0]).not.toHaveProperty('fieldTree');
    expect(state.errors()[0]).not.toHaveProperty('formField');
    fixture.componentInstance.name.set('Marco');
    TestBed.flushEffects();
    expect(state.errors()).toEqual([]);
  });

  it('tracks hidden changes', async () => {
    const { fixture, state } = await createControlState(StringHost);
    expect(state.hidden()).toBe(false);
    fixture.componentInstance.name.hide();
    expect(state.hidden()).toBe(true);
    fixture.componentInstance.name.show();
    expect(state.hidden()).toBe(false);
  });

  it('tracks invalid changes', async () => {
    const { fixture, state } = await createControlState(StringHost);
    expect(state.invalid()).toBe(true);
    fixture.componentInstance.name.set('Marco');
    TestBed.flushEffects();
    expect(state.invalid()).toBe(false);
  });

  it('tracks maximum constraint changes', async () => {
    const { fixture, state } = await createControlState(NumericHost);
    expect(state.max()).toBe(10);
    fixture.componentInstance.maximum.set(20);
    expect(state.max()).toBe(20);
    fixture.componentInstance.maximum.set(undefined);
    expect(state.max()).toBeUndefined();
  });

  it('tracks maximum-length constraint changes', async () => {
    const { fixture, state } = await createControlState(StringHost);
    expect(state.maxLength()).toBe(20);
    fixture.componentInstance.maximumLength.set(30);
    expect(state.maxLength()).toBe(30);
    fixture.componentInstance.maximumLength.set(undefined);
    expect(state.maxLength()).toBeUndefined();
  });

  it('tracks minimum constraint changes', async () => {
    const { fixture, state } = await createControlState(NumericHost);
    expect(state.min()).toBe(1);
    fixture.componentInstance.minimum.set(2);
    expect(state.min()).toBe(2);
    fixture.componentInstance.minimum.set(undefined);
    expect(state.min()).toBeUndefined();
  });

  it('tracks minimum-length constraint changes', async () => {
    const { fixture, state } = await createControlState(StringHost);
    expect(state.minLength()).toBe(3);
    fixture.componentInstance.minimumLength.set(5);
    expect(state.minLength()).toBe(5);
    fixture.componentInstance.minimumLength.set(undefined);
    expect(state.minLength()).toBeUndefined();
  });

  it('exposes the generated name', async () => {
    const { state } = await createControlState(StringHost);
    expect(state.name()).toMatch(/^a\.form\d+$/);
  });

  it('tracks pattern constraint changes', async () => {
    const { fixture, state } = await createControlState(StringHost);
    expect(state.pattern()).toEqual([/^[a-z]+$/i]);
    fixture.componentInstance.expression.set(/^\d+$/);
    expect(state.pattern()).toEqual([/^\d+$/]);
    fixture.componentInstance.expression.set(undefined);
    expect(state.pattern()).toEqual([]);
  });

  it('tracks pending changes', async () => {
    const { fixture, state } = await createControlState(PendingHost);
    expect(state.pending()).toBe(false);
    fixture.componentInstance.value.set(6);
    await Promise.resolve();
    expect(state.pending()).toBe(true);
    fixture.destroy();
  });

  it('tracks readonly changes', async () => {
    const { fixture, state } = await createControlState(StringHost);
    expect(state.readonly()).toBe(false);
    fixture.componentInstance.name.markAsReadonly();
    expect(state.readonly()).toBe(true);
    fixture.componentInstance.name.markAsWritable();
    expect(state.readonly()).toBe(false);
  });

  it('exposes required state', async () => {
    const { state } = await createControlState(StringHost);
    expect(state.required()).toBe(true);
  });

  it('tracks touched changes', async () => {
    const { fixture, state } = await createControlState(StringHost);
    expect(state.touched()).toBe(false);
    fixture.componentInstance.name.markAsTouched();
    TestBed.flushEffects();
    expect(state.touched()).toBe(true);
    fixture.componentInstance.name.markAsUntouched();
    TestBed.flushEffects();
    expect(state.touched()).toBe(false);
  });

  it('marks the field as touched', async () => {
    const { fixture, state } = await createControlState(StringHost);
    expect(fixture.componentInstance.name.touched()).toBe(false);
    state.markAsTouched();
    TestBed.flushEffects();
    expect(fixture.componentInstance.name.touched()).toBe(true);
    expect(state.touched()).toBe(true);
  });

  it('disconnects when its component is destroyed', async () => {
    const { fixture, state } = await createControlState(StringHost);
    expect(state.connected()).toBe(true);
    fixture.destroy();
    expect(state.connected()).toBe(false);
  });
});
