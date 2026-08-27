// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, EventEmitter, Injector, Input, Output, input, model, output, runInInjectionContext, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { connectSignalControl } from './signal-control';
import { field, type Field } from '../../primitives/field';
import { required } from '../../validation/validators/required';
import { registerSignalModelForJit } from '../../../../../testing/register-signal-input-for-jit';

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('connectSignalControl', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());

  it('synchronizes a value model, touch, focus, node access, and reset without feedback', () => {
    const reset = vi.fn();
    const focus = vi.fn();
    const injector = TestBed.inject(Injector);
    const control = runInInjectionContext(injector, () => ({
      value: model('control'),
      node: signal<Field<string> | null>(null),
      touch: output<void>(),
      reset,
      focus,
    }));
    const name = field('David', [required], { nullable: false });
    const connection = connectSignalControl(control, () => name, injector);
    TestBed.flushEffects();

    expect(control.value()).toBe('David');
    expect(control.node()).toBe(name);
    expect(name.dirty()).toBe(false);

    control.value.set('Mark');
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
    const first = field(false, { nullable: false });
    const active = signal<Field<boolean>>(first);
    const second = field(true, { nullable: false });
    const node = signal<Field<boolean> | null>(null);
    const injector = TestBed.inject(Injector);
    const control = runInInjectionContext(injector, () => ({ checked: model(false), node }));
    const connection = connectSignalControl(control, () => active(), injector);
    TestBed.flushEffects();

    expect(connection.focus).toBeUndefined();
    expect(node()).toBe(first);
    active.set(second);
    TestBed.flushEffects();
    expect(node()).toBe(second);
    expect(control.checked()).toBe(true);
  });

  it('supports separate signal and decorator input-output pairs', () => {
    @Component({
      selector: 'signal-pair-control',
      template: '',
      standalone: true,
    })
    class SignalPairControl {
      value = input('');
      valueChange = output<string>();
    }
    registerSignalModelForJit(SignalPairControl, 'value');

    @Component({
      selector: 'decorator-pair-control',
      template: '',
      standalone: true,
    })
    class DecoratorPairControl {
      // eslint-disable-next-line @angular-eslint/prefer-signals -- Exercise legacy decorator input-output interoperability.
      @Input() checked = false;
      @Output() checkedChange = new EventEmitter<boolean>();
    }

    const signalFixture = TestBed.createComponent(SignalPairControl);
    const decoratorFixture = TestBed.createComponent(DecoratorPairControl);
    const name = field('David', { nullable: false });
    const active = field(false, { nullable: false });
    connectSignalControl(signalFixture.componentInstance as never, () => name, signalFixture.debugElement.injector.get(Injector));
    connectSignalControl(decoratorFixture.componentInstance as never, () => active, decoratorFixture.debugElement.injector.get(Injector));
    TestBed.flushEffects();
    expect(signalFixture.componentInstance.value()).toBe('David');
    expect(decoratorFixture.componentInstance.checked).toBe(false);

    signalFixture.componentInstance.valueChange.emit('Mark');
    decoratorFixture.componentInstance.checkedChange.emit(true);
    expect(name()).toBe('Mark');
    expect(active()).toBe(true);

    name.set('Ada');
    active.set(false);
    TestBed.flushEffects();
    expect(signalFixture.componentInstance.value()).toBe('Ada');
    expect(decoratorFixture.componentInstance.checked).toBe(false);
  });

  it('rejects an invalid explicit signal-control provider', () => {
    const injector = TestBed.inject(Injector);
    const name = field('', { nullable: false });
    expect(() => connectSignalControl({ checked: undefined } as never, () => name, injector)).toThrowError(
      'formNode: a signal custom control requires a \'checked\' model or \'checked\'/\'checkedChange\' input-output pair',
    );
  });
});
