// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import type { ValidationError } from '@angular/forms/signals';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Component, Injector, booleanAttribute, input, model, signal } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../../primitives/form';
import { field } from '../../primitives/field';
import { required } from '../../validation/validators/required';
import { connectSignalControlInputs } from './signal-control-inputs';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../../../testing/register-signal-input-for-jit';

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('connectSignalControlInputs', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());

  it('synchronizes every equivalent field state and applies input transforms', () => {
    @Component({ standalone: true, selector: 'all-state-control', template: '' })
    class AllStateControl {
      value = model('');
      disabled = input(false, { transform: booleanAttribute });
      dirty = input(false);
      errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
      hidden = input(false);
      invalid = input(false);
      name = input('');
      pending = input(false);
      readonly = input(false);
      required = input(false);
      touched = input(false);
    }
    registerSignalModelForJit(AllStateControl, 'value');
    for (const name of ['disabled', 'dirty', 'errors', 'hidden', 'invalid', 'name', 'pending', 'readonly', 'required', 'touched']) {
      registerSignalInputForJit(AllStateControl, name, name);
    }

    const fixture = TestBed.createComponent(AllStateControl);
    const profile = form({ name: field('', [required], { nullable: false }) });
    connectSignalControlInputs(fixture.componentInstance, () => profile.name, fixture.debugElement.injector.get(Injector));
    TestBed.flushEffects();

    expect(fixture.componentInstance.name()).toBe('name');
    expect(fixture.componentInstance.required()).toBe(true);
    expect(fixture.componentInstance.invalid()).toBe(true);
    expect(fixture.componentInstance.errors()).toHaveLength(1);
    expect(fixture.componentInstance.pending()).toBe(false);

    profile.name.markAsDirty();
    profile.name.markAsTouched();
    TestBed.flushEffects();
    expect(fixture.componentInstance.dirty()).toBe(true);
    expect(fixture.componentInstance.touched()).toBe(true);

    profile.name.disable();
    profile.name.hide();
    profile.name.markAsReadonly();
    TestBed.flushEffects();
    expect(fixture.componentInstance.disabled()).toBe(true);
    expect(fixture.componentInstance.hidden()).toBe(true);
    expect(fixture.componentInstance.readonly()).toBe(true);
  });

  it('ignores components without state inputs and metadata entries that are not input signals', () => {
    @Component({ standalone: true, selector: 'model-only-control', template: '' })
    class ModelOnlyControl { value = model(''); }
    registerSignalModelForJit(ModelOnlyControl, 'value');
    const modelFixture = TestBed.createComponent(ModelOnlyControl);
    const name = field('', { nullable: false });
    connectSignalControlInputs(modelFixture.componentInstance, () => name, modelFixture.debugElement.injector.get(Injector));

    @Component({ standalone: true, selector: 'non-signal-input-control', template: '' })
    class NonSignalInputControl {
      value = model('');
      disabled: unknown = false;
      dirty = signal(false);
    }
    registerSignalModelForJit(NonSignalInputControl, 'value');
    registerSignalInputForJit(NonSignalInputControl, 'disabled', 'disabled');
    registerSignalInputForJit(NonSignalInputControl, 'dirty', 'dirty');
    const invalidFixture = TestBed.createComponent(NonSignalInputControl);
    connectSignalControlInputs(invalidFixture.componentInstance as never, () => name, invalidFixture.debugElement.injector.get(Injector));
    TestBed.flushEffects();
    expect(invalidFixture.componentInstance.disabled).toBe(false);
    expect(invalidFixture.componentInstance.dirty()).toBe(false);
  });
});
