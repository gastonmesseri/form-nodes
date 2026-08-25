// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Injector, model, output, runInInjectionContext, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { connectSignalControl } from './signal-control';
import { field, type Field } from '../../primitives/field';
import { required } from '../../validation/validators/required';

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
});
