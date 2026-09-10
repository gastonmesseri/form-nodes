// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Component, inject, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { injectFormFieldControlStateAdapter } from './adapters/form-field';
import { CONTROL_ERRORS_BRIDGE, provideFormNodeStateErrors } from './control-errors';

// Exercise adapter capability checks on the Angular 21 baseline; real integration also runs on Angular 22.
vi.mock('@angular/core', async (original) => {
  const core = await original<typeof import('@angular/core')>();
  return { ...core, VERSION: { ...core.VERSION, major: '22' } };
});

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());
afterEach(() => TestBed.resetTestingModule());

it('merges independent bridge sources, notifies Angular, and restores colliding errors on cleanup', () => {
  @Component({
    template: '',
    providers: [provideFormNodeStateErrors(), { provide: NG_VALUE_ACCESSOR, useValue: {}, multi: true }],
  })
  class Host {
    bridge = inject(CONTROL_ERRORS_BRIDGE);

    adapter = injectFormFieldControlStateAdapter();
  }
  const fixture = TestBed.createComponent(Host);
  const { adapter, bridge } = fixture.componentInstance;
  expect(bridge.validate()).toBeNull();
  const first = signal([{ kind: 'invalidDate', message: 'First' }]);
  const removeFirst = adapter.registerErrors!(first);
  const changed = vi.fn();
  bridge.registerOnValidatorChange(changed);
  const second = signal([{ kind: 'invalidDate', message: 'Second' }]);
  const removeSecond = adapter.registerErrors!(second);
  expect(changed).toHaveBeenCalledTimes(1);
  expect(bridge.validate()).toEqual({ invalidDate: { kind: 'invalidDate', message: 'Second' } });
  second.set([]);
  adapter.refreshErrors!();
  expect(changed).toHaveBeenCalledTimes(2);
  expect(bridge.validate()).toEqual({ invalidDate: { kind: 'invalidDate', message: 'First' } });
  removeSecond();
  removeFirst();
  expect(bridge.validate()).toBeNull();
  expect(changed).toHaveBeenCalledTimes(4);
});

it('requires the provider when a Signal Forms control contributes errors', () => {
  @Component({ template: '' })
  class Host {
    adapter = injectFormFieldControlStateAdapter();
  }
  const fixture = TestBed.createComponent(Host);
  expect(() => fixture.componentInstance.adapter.registerErrors!(signal([]))).toThrow(/provideFormNodeStateErrors/);
  expect(() => fixture.componentInstance.adapter.refreshErrors!()).not.toThrow();
});

it('requires a CVA for the Signal Forms bridge', () => {
  @Component({ template: '', providers: [provideFormNodeStateErrors()] })
  class Host {
    adapter = injectFormFieldControlStateAdapter();
  }
  const fixture = TestBed.createComponent(Host);
  expect(() => fixture.componentInstance.adapter.registerErrors!(signal([]))).toThrow(/ControlValueAccessor/);
});
