// @vitest-environment jsdom

import '@angular/compiler';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { FormNodeDirective } from './form-node.directive';
import { assertCustomEventOrder, assertDirectBindingEventOrder } from '../../../tests/helpers/assert-custom-event-order';
import { registerSignalInputForJit, registerSignalModelForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';
import { CustomEventOrderHost, DirectBindingControl, DirectBindingHost, DirectDirectiveControl, DirectPairControl, OrderedValueControl, OrderedCheckboxControl, OrderedPairControl } from '../../../tests/integration/custom-event-order.fixture';

registerSignalInputForJit(FormNodeDirective, 'formNode', '_formNodeInput');
registerSignalModelForJit(DirectBindingControl, 'value');
registerSignalModelForJit(DirectDirectiveControl, 'checked');
registerSignalInputForJit(DirectPairControl, 'value', 'value');
registerSignalOutputForJit(DirectPairControl, 'valueChange');
registerSignalModelForJit(OrderedValueControl, 'value', 'selection');
registerSignalModelForJit(OrderedCheckboxControl, 'checked');
registerSignalInputForJit(OrderedPairControl, 'value', 'value');
registerSignalOutputForJit(OrderedPairControl, 'valueChange');
for (const type of [OrderedValueControl, OrderedCheckboxControl, OrderedPairControl, DirectBindingControl, DirectDirectiveControl, DirectPairControl]) registerSignalOutputForJit(type, 'touch');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

it('commits custom value, checked, pair and touch outputs before consumer handlers', () => {
  assertCustomEventOrder(TestBed.createComponent(CustomEventOrderHost));
});

it('updates before output handlers with direct constructor injection of FORM_NODE or its directive', () => {
  const fixture = TestBed.createComponent(DirectBindingHost);
  fixture.detectChanges();
  const element = fixture.debugElement.query(By.directive(DirectBindingControl));
  const control = element.componentInstance as DirectBindingControl;
  expect(control.binding).toBe(element.injector.get(FormNodeDirective));
  assertDirectBindingEventOrder(fixture);
});
