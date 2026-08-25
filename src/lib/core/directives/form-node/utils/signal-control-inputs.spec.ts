// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import type { ValidationError } from '@angular/forms/signals';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Component, Injector, booleanAttribute, input, model, signal } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../../../primitives/form';
import { field } from '../../../primitives/field';
import { max } from '../../../validation/validators/max';
import { min } from '../../../validation/validators/min';
import { pattern } from '../../../validation/validators/pattern';
import { required } from '../../../validation/validators/required';
import { connectSignalControlInputs } from './signal-control-inputs';
import { maxLength } from '../../../validation/validators/max-length';
import { minLength } from '../../../validation/validators/min-length';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../../../../testing/register-signal-input-for-jit';

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
      disabledReasons = input<readonly unknown[]>([]);
      dirty = input(false);
      errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
      hidden = input(false);
      invalid = input(false);
      max = input<number | undefined>(undefined);
      maxLength = input<number | undefined>(undefined);
      min = input<number | undefined>(undefined);
      minLength = input<number | undefined>(undefined);
      name = input('');
      pattern = input<readonly RegExp[]>([]);
      pending = input(false);
      readonly = input(false);
      required = input(false);
      touched = input(false);
    }
    registerSignalModelForJit(AllStateControl, 'value');
    for (const name of ['disabled', 'disabledReasons', 'dirty', 'errors', 'hidden', 'invalid', 'max', 'maxLength', 'min', 'minLength', 'name', 'pattern', 'pending', 'readonly', 'required', 'touched']) {
      registerSignalInputForJit(AllStateControl, name, name);
    }

    const fixture = TestBed.createComponent(AllStateControl);
    const expectedPattern = /^[a-z]+$/;
    const profile = form({ name: field('abc', [required, min(1), max(10), minLength(2), maxLength(5), pattern(expectedPattern)] as never, { nullable: false }) });
    const connection = connectSignalControlInputs(fixture.componentInstance, () => profile.name, fixture.debugElement.injector.get(Injector));
    TestBed.flushEffects();

    expect(connection.inputNames).toContain('disabled');
    expect(connection.inputNames).toContain('required');
    expect(connection.inputNames).not.toContain('touchedAlias');
    expect(fixture.componentInstance.name()).toMatch(/\.form\d+\.name$/);
    expect(fixture.componentInstance.required()).toBe(true);
    expect(fixture.componentInstance.invalid()).toBe(false);
    expect(fixture.componentInstance.min()).toBe(1);
    expect(fixture.componentInstance.max()).toBe(10);
    expect(fixture.componentInstance.minLength()).toBe(2);
    expect(fixture.componentInstance.maxLength()).toBe(5);
    expect(fixture.componentInstance.pattern()).toEqual([expectedPattern]);
    expect(fixture.componentInstance.errors()).toHaveLength(0);
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
    expect(fixture.componentInstance.disabledReasons()).toEqual([{ sourceNode: profile.name }]);
    expect(fixture.componentInstance.hidden()).toBe(true);
    expect(fixture.componentInstance.readonly()).toBe(true);
  });

  it('ignores components without state inputs and metadata entries that are not input signals', () => {
    @Component({ standalone: true, selector: 'model-only-control', template: '' })
    class ModelOnlyControl { value = model(''); }
    registerSignalModelForJit(ModelOnlyControl, 'value');
    const modelFixture = TestBed.createComponent(ModelOnlyControl);
    const name = field('', { nullable: false });
    const modelConnection = connectSignalControlInputs(modelFixture.componentInstance, () => name, modelFixture.debugElement.injector.get(Injector));
    expect(modelConnection.inputNames).toEqual(new Set(['value']));

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
    const invalidConnection = connectSignalControlInputs(invalidFixture.componentInstance as never, () => name, invalidFixture.debugElement.injector.get(Injector));
    TestBed.flushEffects();
    expect(invalidConnection.inputNames).toEqual(new Set(['value', 'disabled', 'dirty']));
    expect(invalidFixture.componentInstance.disabled).toBe(false);
    expect(invalidFixture.componentInstance.dirty()).toBe(false);
  });
});
