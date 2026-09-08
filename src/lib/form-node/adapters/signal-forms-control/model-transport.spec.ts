// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, input, model, output, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../../../primitives/form';
import { field } from '../../../primitives/field';
import { findModelTransport } from './model-transport';
import type { AnyNode } from '../../../types/node.type';
import { FormNodeDirective } from '../../form-node.directive';
import { registerSignalInputForJit, registerSignalModelForJit, registerSignalOutputForJit } from '../../../../../tests/helpers/register-signal-input-for-jit';

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());
registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');

@Component({ selector: 'aliased-model-control', template: '' })
class AliasedControl {
  value = Object.assign(signal('internal'), { subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })) });

  actualValue = model<unknown>(null, { alias: 'value' });
}
registerSignalModelForJit(AliasedControl, 'value', 'actualValue');

@Component({ template: '<aliased-model-control [formNode]="node()" />', imports: [FormNodeDirective, AliasedControl] })
class Host {
  node = signal<AnyNode>(field(''));
}

describe('declared model transport', () => {
  it.each(['field', 'form'] as const)('binds an aliased value model to a %s without touching an internal signal', (kind) => {
    const profile = form({ name: field('Ada') });
    const node = kind === 'field' ? profile.name : profile;
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.node.set(node);
    fixture.detectChanges();
    const component = fixture.debugElement.children[0]!.componentInstance as AliasedControl;
    expect(component.actualValue()).toEqual(node());
    expect(component.value()).toBe('internal');
    expect(component.value.subscribe).not.toHaveBeenCalled();
    expect(node.dirty()).toBe(false);
    const edited = kind === 'field' ? 'Grace' : { name: 'Grace' };
    component.actualValue.set(edited);
    expect(node()).toEqual(edited);
    expect(node.dirty()).toBe(true);
    profile.name.set('Lin');
    fixture.detectChanges();
    expect(component.actualValue()).toEqual(node());
    fixture.componentInstance.node.set(field('Replacement'));
    fixture.detectChanges();
    expect(component.actualValue()).toBe('Replacement');
    expect(component.value()).toBe('internal');
  });

  it('resolves an aliased checked model', () => {
    @Component({ template: '' })
    class Checkbox {
      checked = signal(false);

      selection = model(false, { alias: 'checked' });
    }
    registerSignalModelForJit(Checkbox, 'checked', 'selection');
    const control = TestBed.createComponent(Checkbox).componentInstance;
    expect(findModelTransport(control as never)).toBe(control.selection);
  });

  it('does not treat an input and separate output as a model even when the input has set and subscribe', () => {
    @Component({ template: '' })
    class Pair {
      value = Object.assign(signal('internal'), { subscribe: vi.fn() });

      valueChange = output<string>();
    }
    registerSignalInputForJit(Pair, 'value', 'value');
    registerSignalOutputForJit(Pair, 'valueChange');
    const control = TestBed.createComponent(Pair).componentInstance;
    expect(findModelTransport(control as never)).toBeUndefined();
  });

  it('rejects ordinary signals, read-only inputs, and malformed declared models', () => {
    @Component({ template: '' })
    class Control {
      value = signal('internal');

      checked = input(false);
    }
    registerSignalModelForJit(Control, 'value');
    registerSignalModelForJit(Control, 'checked');
    const control = TestBed.createComponent(Control).componentInstance;
    expect(findModelTransport(control as never)).toBeUndefined();
    Object.assign(control, { value: 'not callable' });
    expect(findModelTransport(control as never)).toBeUndefined();
    expect(findModelTransport({ value: signal('undeclared') } as never)).toBeUndefined();
  });
});
