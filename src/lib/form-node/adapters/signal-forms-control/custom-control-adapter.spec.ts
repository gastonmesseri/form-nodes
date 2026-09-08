// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, Injector, model, output, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, type FieldNode } from '../../../primitives/field';
import { required } from '../../../validation/validators/required';
import { connectCustomControlAdapter } from './custom-control-adapter';
import { registerSignalModelForJit, registerSignalOutputForJit } from '../../../../../tests/helpers/register-signal-input-for-jit';

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('connectCustomControlAdapter', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());

  it('synchronizes a value model, touch, focus, node access, and reset without feedback', () => {
    const reset = vi.fn();
    const focus = vi.fn();
    const injector = TestBed.inject(Injector);
    @Component({ template: '' })
    class Control {
      value = model('control');

      node = signal<FieldNode<string> | null>(null);

      touch = output<void>();

      reset = reset;

      focus = focus;
    }
    registerSignalModelForJit(Control, 'value');
    const control = TestBed.createComponent(Control).componentInstance;
    const name = field.strict('David', [required]);
    const connection = connectCustomControlAdapter(control, () => name, injector);
    TestBed.flushEffects();

    expect(control.value()).toBe('David');
    expect(control.node()).toBe(name);
    expect(name.dirty()).toBe(false);

    control.value.set('Mark');
    connection.customEvents?.valueChange?.('Mark');
    expect(name()).toBe('Mark');
    expect(name.dirty()).toBe(true);

    control.touch.emit();
    expect(name.touched()).toBe(true);

    connection.focus?.({ preventScroll: true });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });

    name.reset();
    expect(reset).toHaveBeenCalledOnce();
  });

  it('supports a checked model and follows dynamically rebound fields', () => {
    const first = field.strict(false);
    const active = signal<FieldNode<boolean>>(first);
    const second = field.strict(true);
    const node = signal<FieldNode<boolean> | null>(null);
    const injector = TestBed.inject(Injector);
    @Component({ template: '' })
    class Control {
      checked = model(false);

      node = node;
    }
    registerSignalModelForJit(Control, 'checked');
    const control = TestBed.createComponent(Control).componentInstance;
    const connection = connectCustomControlAdapter(control, () => active(), injector);
    TestBed.flushEffects();

    expect(connection.focus).toBeUndefined();
    expect(node()).toBe(first);
    active.set(second);
    TestBed.flushEffects();
    expect(node()).toBe(second);
    expect(control.checked()).toBe(true);
  });

  it('rejects an input whose declared output cannot subscribe', () => {
    @Component({ template: '' })
    class Control {
      value = model('');

      valueChange = undefined;
    }
    registerSignalModelForJit(Control, 'value');
    registerSignalOutputForJit(Control, 'valueChange');
    const fixture = TestBed.createComponent(Control);
    Object.assign(fixture.componentInstance, { value: 'plain input' });
    expect(() => connectCustomControlAdapter(fixture.componentInstance as never, () => field(''), fixture.debugElement.injector)).toThrow('matching input-output pair');
  });

  it('keeps paired output updates available when an incompatible input writer fails', () => {
    @Component({ template: '' })
    class Control {
      // Simulate a component whose signal-input metadata no longer matches its runtime shape.
      value = 'owned';

      valueChange = output<string>();
    }
    registerSignalModelForJit(Control, 'value');
    registerSignalOutputForJit(Control, 'valueChange');
    const fixture = TestBed.createComponent(Control);
    const name = field('node', { bindInputOutputPairs: true });
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const connection = connectCustomControlAdapter(fixture.componentInstance as never, () => name, fixture.debugElement.injector);
      TestBed.flushEffects();
      expect(fixture.componentInstance.value).toBe('owned');
      expect(warning).toHaveBeenCalledOnce();
      fixture.componentInstance.valueChange.emit('edited');
      connection.customEvents?.valueChange?.('edited');
      TestBed.flushEffects();
      expect(name()).toBe('edited');
      expect(warning).toHaveBeenCalledOnce();
    } finally {
      warning.mockRestore();
    }
  });

  it('rejects an invalid signal-control shape', () => {
    const injector = TestBed.inject(Injector);
    const name = field.strict('');
    expect(() => connectCustomControlAdapter({ checked: undefined } as never, () => name, injector)).toThrowError(
      'formNode: a custom control requires a \'value\' or \'checked\' model, or a matching input-output pair',
    );
  });
});
