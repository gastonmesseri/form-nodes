// @vitest-environment jsdom

import '@angular/compiler';
import type { Injector } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { FormNodeDirective } from './form-node.directive';
import { assertCustomEventOrder } from '../../../tests/helpers/assert-custom-event-order';
import { prepareCustomControlEvents } from './adapters/signal-forms-control/custom-control-events';
import { registerSignalInputForJit, registerSignalModelForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';
import { CustomEventOrderHost, DirectBindingControl, DirectBindingHost, OrderedValueControl, OrderedCheckboxControl, OrderedPairControl } from '../../../tests/integration/custom-event-order.fixture';

registerSignalInputForJit(FormNodeDirective, 'formNode', '_formNodeInput');
registerSignalModelForJit(DirectBindingControl, 'value');
registerSignalModelForJit(OrderedValueControl, 'value', 'selection');
registerSignalModelForJit(OrderedCheckboxControl, 'checked');
registerSignalInputForJit(OrderedPairControl, 'value', 'value');
registerSignalOutputForJit(OrderedPairControl, 'valueChange');
for (const type of [OrderedValueControl, OrderedCheckboxControl, OrderedPairControl]) registerSignalOutputForJit(type, 'touch');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

it('commits custom value, checked, pair and touch outputs before consumer handlers', () => {
  assertCustomEventOrder(TestBed.createComponent(CustomEventOrderHost));
});

it('preserves direct constructor injection of FORM_NODE and its existing output timing', () => {
  const fixture = TestBed.createComponent(DirectBindingHost);
  fixture.detectChanges();
  const element = fixture.debugElement.query(By.directive(DirectBindingControl));
  const control = element.componentInstance as DirectBindingControl;
  expect(control.binding).toBe(element.injector.get(FormNodeDirective));
  expect(control.binding.node()).toBe(fixture.componentInstance.name);
  control.value.set('updated');
  expect(fixture.componentInstance.observed).toBe('initial');
  expect(fixture.componentInstance.name()).toBe('updated');
  fixture.destroy();
});

it('propagates unexpected component resolution errors instead of treating them as reentrant injection', () => {
  const fixture = TestBed.createComponent(CustomEventOrderHost);
  fixture.detectChanges();
  const element = fixture.nativeElement.querySelector('#value') as HTMLElement;
  const failure = new Error('Component resolution failed');
  const injector = { get() { throw failure; } } as unknown as Injector;
  expect(() => prepareCustomControlEvents(element, injector)).toThrow(failure);
  fixture.destroy();
});
