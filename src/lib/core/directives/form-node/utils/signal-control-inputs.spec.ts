// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import type { ValidationError } from '@angular/forms/signals';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Component, Injector, Input, booleanAttribute, input, model, signal, type OnChanges, type SimpleChanges } from '@angular/core';
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
import { isInputSignal, warnFailedInputWrite, writeComponentInput, writeInputSignal } from '../angular-internals/component-input-writer';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../../../../tests/helpers/register-signal-input-for-jit';

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('connectSignalControlInputs', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());

  it('synchronizes every equivalent field state and applies input transforms', () => {
    @Component({
      selector: 'all-state-control',
      template: '',
      standalone: true,
    })
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
    const profile = form({ name: field.strict('abc', [required, min(1), max(10), minLength(2), maxLength(5), pattern(expectedPattern)] as never) });
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
    @Component({
      selector: 'model-only-control',
      template: '',
      standalone: true,
    })
    class ModelOnlyControl { value = model(''); }
    registerSignalModelForJit(ModelOnlyControl, 'value');
    const modelFixture = TestBed.createComponent(ModelOnlyControl);
    const name = field.strict('');
    const modelConnection = connectSignalControlInputs(modelFixture.componentInstance, () => name, modelFixture.debugElement.injector.get(Injector));
    expect(modelConnection.inputNames).toEqual(new Set(['value']));

    @Component({
      selector: 'non-signal-input-control',
      template: '',
      standalone: true,
    })
    class NonSignalInputControl {
      value = model('');
      disabled: unknown = false;
      dirty = signal(false);
    }
    registerSignalModelForJit(NonSignalInputControl, 'value');
    registerSignalInputForJit(NonSignalInputControl, 'disabled', 'disabled');
    registerSignalInputForJit(NonSignalInputControl, 'dirty', 'dirty');
    const invalidFixture = TestBed.createComponent(NonSignalInputControl);
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const invalidConnection = connectSignalControlInputs(invalidFixture.componentInstance as never, () => name, invalidFixture.debugElement.injector.get(Injector));
    TestBed.flushEffects();
    expect(invalidConnection.inputNames).toEqual(new Set(['value', 'disabled', 'dirty']));
    expect(invalidFixture.componentInstance.disabled).toBe(false);
    expect(invalidFixture.componentInstance.dirty()).toBe(false);
    expect(writeComponentInput({}, 'disabled', true, invalidFixture.debugElement.injector.get(Injector))).toBe(false);
    warning.mockRestore();
  });

  it('resolves aliases, applies signal transforms, and preserves ngOnChanges', () => {
    @Component({
      selector: 'aliased-state-control',
      template: '',
      standalone: true,
    })
    class AliasedStateControl implements OnChanges {
      value = model('');
      internalDisabled = input(false, { alias: 'disabled', transform: booleanAttribute });
      changes: SimpleChanges[] = [];

      ngOnChanges(changes: SimpleChanges) {
        this.changes.push(changes);
      }
    }
    registerSignalModelForJit(AliasedStateControl, 'value');
    registerSignalInputForJit(AliasedStateControl, 'disabled', 'internalDisabled');

    const fixture = TestBed.createComponent(AliasedStateControl);
    const wrote = writeComponentInput(
      fixture.componentInstance,
      'disabled',
      '',
      fixture.debugElement.injector.get(Injector),
    );
    fixture.detectChanges();

    expect(wrote).toBe(true);
    expect(fixture.componentInstance.internalDisabled()).toBe(true);
    expect(fixture.componentInstance.changes).toHaveLength(1);
    expect(fixture.componentInstance.changes[0]?.['internalDisabled']).toMatchObject({
      currentValue: true,
      firstChange: true,
    });

    const definition = (AliasedStateControl as unknown as {
      ɵcmp: { setInput: ((...args: unknown[]) => void) | null };
    }).ɵcmp;
    const originalSetInput = definition.setInput;
    definition.setInput = () => { throw new Error('Changed Angular internal'); };
    try {
      expect(writeComponentInput(
        fixture.componentInstance,
        'disabled',
        false,
        fixture.debugElement.injector.get(Injector),
      )).toBe(true);
      expect(fixture.componentInstance.internalDisabled()).toBe(false);
    } finally {
      definition.setInput = originalSetInput;
    }
  });

  it('writes aliased decorator inputs with transforms', () => {
    @Component({ selector: 'decorator-state-control', template: '', standalone: true })
    class DecoratorStateControl {
      // eslint-disable-next-line @angular-eslint/prefer-signals -- Compatibility coverage for decorator inputs is intentional.
      @Input({ alias: 'disabled', transform: booleanAttribute }) internalDisabled = false;
    }

    const fixture = TestBed.createComponent(DecoratorStateControl);
    const wrote = writeComponentInput(
      fixture.componentInstance,
      'disabled',
      '',
      fixture.debugElement.injector.get(Injector),
    );

    expect(wrote).toBe(true);
    expect(fixture.componentInstance.internalDisabled).toBe(true);
  });

  it('degrades safely when Angular input-signal internals are missing or throw', () => {
    const throwingWriter = () => undefined;
    Object.defineProperty(throwingWriter, Symbol('node'), {
      value: {
        applyValueToInputSignal: () => { throw new Error('Changed Angular internal'); },
      },
    });
    expect(isInputSignal(throwingWriter)).toBe(true);
    expect(writeInputSignal(throwingWriter, true)).toBe(false);

    const unreadableSignal = () => undefined;
    Object.defineProperty(unreadableSignal, Symbol('node'), {
      get: () => { throw new Error('Changed Angular internal'); },
    });
    expect(isInputSignal(unreadableSignal)).toBe(false);
    expect(writeInputSignal(unreadableSignal, true)).toBe(false);

    const uninspectableSignal = new Proxy(() => undefined, {
      ownKeys: () => { throw new Error('Changed Angular internal'); },
    });
    expect(isInputSignal(uninspectableSignal)).toBe(false);
  });

  it('keeps component input failures from breaking the binding', () => {
    const name = field.strict('');
    const unreadableComponent = Object.defineProperty({}, 'constructor', {
      get: () => { throw new Error('Changed Angular internal'); },
    });
    const injector = TestBed.inject(Injector);

    expect(writeComponentInput(unreadableComponent, 'disabled', true, injector)).toBe(false);
    expect(connectSignalControlInputs(unreadableComponent, () => name, injector).inputNames).toEqual(new Set());

    @Component({ selector: 'fragile-state-control', template: '', standalone: true })
    class FragileStateControl {
      disabled = input(false);
    }
    registerSignalInputForJit(FragileStateControl, 'disabled', 'disabled');
    const fixture = TestBed.createComponent(FragileStateControl);

    Object.defineProperty(fixture.componentInstance, 'disabled', {
      configurable: true,
      get: () => { throw new Error('Changed Angular internal'); },
    });
    expect(writeComponentInput(fixture.componentInstance, 'disabled', true, injector)).toBe(false);

    const throwingWriter = () => undefined;
    Object.defineProperty(throwingWriter, Symbol('node'), {
      value: {
        applyValueToInputSignal: () => { throw new Error('Changed Angular internal'); },
      },
    });
    Object.defineProperty(fixture.componentInstance, 'disabled', {
      configurable: true,
      value: throwingWriter,
    });
    expect(writeComponentInput(fixture.componentInstance, 'disabled', true, injector)).toBe(false);
  });

  it('keeps a successful input write when change detection lookup fails', () => {
    @Component({ selector: 'mark-for-check-control', template: '', standalone: true })
    class MarkForCheckControl {
      // eslint-disable-next-line @angular-eslint/prefer-signals -- A writable decorator input isolates the markForCheck fallback.
      @Input() disabled = false;
    }
    const fixture = TestBed.createComponent(MarkForCheckControl);
    const unavailableInjector = {
      get: () => { throw new Error('Unavailable ChangeDetectorRef'); },
    } as unknown as Injector;

    expect(writeComponentInput(fixture.componentInstance, 'disabled', true, unavailableInjector)).toBe(true);
    expect(fixture.componentInstance.disabled).toBe(true);
  });

  it('warns once when a recognized optional state input cannot be written', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const disabled = () => false;
    Object.defineProperty(disabled, Symbol('node'), {
      value: {
        applyValueToInputSignal: () => { throw new Error('Changed Angular internal'); },
      },
    });
    const control = { disabled };
    const name = field.strict('');

    connectSignalControlInputs(control, () => name, TestBed.inject(Injector));
    TestBed.flushEffects();
    name.disable();
    TestBed.flushEffects();

    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining(
      'formNode: could not synchronize the \'disabled\' input',
    ));
    expect(warning).toHaveBeenCalledWith(expect.stringContaining(
      'Prefer useControlState() to consume bound state without writable state inputs',
    ));
    warning.mockRestore();
  });

  it('uses a generic name when a failed control cannot be inspected', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const control = new Proxy({}, {
      get: () => { throw new Error('Unreadable control'); },
    });

    warnFailedInputWrite(control, 'required');

    expect(warning).toHaveBeenCalledWith(expect.stringContaining(
      'could not synchronize the \'required\' input on custom control',
    ));
    warning.mockRestore();
  });

  it('does not recommend useControlState when the component already uses it', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});

    warnFailedInputWrite({}, 'readonly', true);

    expect(warning).toHaveBeenCalledWith(expect.not.stringContaining('Prefer useControlState()'));
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('could not synchronize the \'readonly\' input'));
    warning.mockRestore();
  });
});
