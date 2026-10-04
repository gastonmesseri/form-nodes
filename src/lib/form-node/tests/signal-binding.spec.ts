// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, computed, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { FormNodeDirective } from '../form-node.directive';
import { assertSignalBinding } from '../../../../tests/helpers/assert-signal-binding';
import { SignalBindingHost } from '../../../../tests/integration/signal-binding.fixture';
import { OrderedValueControl, OrderedCheckboxControl, OrderedPairControl } from '../../../../tests/integration/custom-event-order.fixture';
import { registerSignalInputForJit, registerSignalModelForJit, registerSignalOutputForJit } from '../../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
registerSignalInputForJit(FormNodeDirective, 'formNodeValue', '_formNodeValue');
registerSignalOutputForJit(FormNodeDirective, 'formNodeValueChange');
registerSignalOutputForJit(FormNodeDirective, 'formNodeControlValueChange');
registerSignalModelForJit(OrderedValueControl, 'value', 'selection');
registerSignalModelForJit(OrderedCheckboxControl, 'checked');
registerSignalInputForJit(OrderedPairControl, 'value', 'value');
registerSignalOutputForJit(OrderedPairControl, 'valueChange');
registerSignalOutputForJit(OrderedPairControl, 'touch');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

it('binds writable signals through native, model and CVA transports without feedback', () => {
  assertSignalBinding(TestBed.createComponent(SignalBindingHost));
});

it('rejects readonly signals and callable objects with set that are not Angular signals', () => {
  @Component({
    template: '<input [formNode]="source">',
    imports: [FormNodeDirective],
  })
  class Host {
    source: unknown = computed(() => 'readonly');
  }
  const fixture = TestBed.createComponent(Host);
  expect(() => fixture.detectChanges()).toThrow('a node or writable Angular signal is required');
  fixture.componentInstance.source = Object.assign(() => 'lookalike', { set: () => {} });
  expect(() => fixture.detectChanges()).toThrow('a node or writable Angular signal is required');
});

it('rejects a second value owner beside a writable signal', () => {
  @Component({
    template: '<input [formNode]="source" [formNodeValue]="\'other\'">',
    imports: [FormNodeDirective],
  })
  class Host {
    source = signal('initial');
  }
  expect(() => TestBed.createComponent(Host).detectChanges()).toThrow('cannot be combined with formNodeValue');
});

it('rejects a binding without a node, signal, or standalone value', () => {
  @Component({ template: '<input [formNode]="undefined">', imports: [FormNodeDirective] })
  class Host {}
  expect(() => TestBed.createComponent(Host).detectChanges()).toThrow('a field, form, group, or array node is required');
});

it('leaves experimental pairs inactive without explicit configuration for signal bindings', () => {
  @Component({ template: '<ordered-pair [formNode]="source" />', imports: [FormNodeDirective, OrderedPairControl] })
  class Host {
    source = signal('initial');
  }
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const pair = fixture.debugElement.children[0]!.componentInstance as OrderedPairControl;
  pair.valueChange.emit('ignored');
  pair.touch.emit();
  expect(fixture.componentInstance.source()).toBe('initial');
});
