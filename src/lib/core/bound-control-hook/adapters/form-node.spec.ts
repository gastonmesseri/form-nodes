// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_ID, Component, DestroyRef, ElementRef, inject, model, signal, type Type } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field } from '../../primitives/field';
import { asyncValidator } from '../../validation/async-validator';
import { max } from '../../validation/validators/max';
import { min } from '../../validation/validators/min';
import { required } from '../../validation/validators/required';
import { pattern } from '../../validation/validators/pattern';
import { FormNode } from '../../directives/form-node/form-node.directive';
import { maxLength } from '../../validation/validators/max-length';
import { minLength } from '../../validation/validators/min-length';
import { injectFormNodeBoundControl } from './form-node';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../../../tests/helpers/register-signal-input-for-jit';

@Component({ selector: 'form-node-adapter-control', template: '', standalone: true })
class FormNodeAdapterControl {
  value = model<unknown>(null);
  state = injectFormNodeBoundControl<unknown>(
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
    inject(DestroyRef),
    inject(APP_ID),
  );
}

@Component({
  template: `<form-node-adapter-control [formNode]="name" />`,
  standalone: true,
  imports: [FormNodeAdapterControl, FormNode],
})
class StringHost {
  minimumLength = signal<number | undefined>(3);
  maximumLength = signal<number | undefined>(20);
  expression = signal<RegExp | undefined>(/^[a-z]+$/i);
  name = field('', [
    required,
    minLength(() => this.minimumLength()),
    maxLength(() => this.maximumLength()),
    pattern(() => this.expression()),
  ], { nullable: false });
}

@Component({
  template: `<form-node-adapter-control [formNode]="amount" />`,
  standalone: true,
  imports: [FormNodeAdapterControl, FormNode],
})
class NumericHost {
  minimum = signal<number | undefined>(1);
  maximum = signal<number | undefined>(10);
  amount = field(5, [min(() => this.minimum()), max(() => this.maximum())], { nullable: false });
}

@Component({
  template: `<form-node-adapter-control [formNode]="amount" />`,
  standalone: true,
  imports: [FormNodeAdapterControl, FormNode],
})
class PendingHost {
  resolveValidation: (() => void) | undefined;
  amount = field(5, [asyncValidator(() => new Promise<null>((resolve) => {
    this.resolveValidation = () => resolve(null);
  }))], { nullable: false });
}

registerSignalInputForJit(FormNode, 'formNode', '_formNodeInput');
registerSignalModelForJit(FormNodeAdapterControl, 'value');

const createBoundControl = <THost>(host: Type<THost>) => {
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  const state = (fixture.debugElement.children[0]!.componentInstance as FormNodeAdapterControl).state;
  return { fixture, state };
};

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('formNode bound-control adapter', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());

  it('connects to a same-host FormNode directive', () => {
    const { state } = createBoundControl(StringHost);
    expect(state.source).toBe('formNode');
    expect(state.connected()).toBe(true);
  });

  it('tracks value changes', () => {
    const { fixture, state } = createBoundControl(StringHost);
    expect(state.value()).toBe('');
    fixture.componentInstance.name.set('Marco');
    expect(state.value()).toBe('Marco');
  });

  it('tracks disabled changes', () => {
    const { fixture, state } = createBoundControl(StringHost);
    expect(state.disabled()).toBe(false);
    fixture.componentInstance.name.disable();
    expect(state.disabled()).toBe(true);
    fixture.componentInstance.name.enable();
    expect(state.disabled()).toBe(false);
  });

  it('tracks disabled reason changes', () => {
    const { fixture, state } = createBoundControl(StringHost);
    expect(state.disabledReasons()).toEqual([]);
    fixture.componentInstance.name.disable('maintenance');
    expect(state.disabledReasons()).toEqual([{ message: 'maintenance' }]);
    fixture.componentInstance.name.enable();
    expect(state.disabledReasons()).toEqual([]);
    fixture.componentInstance.name.disable();
    expect(state.disabledReasons()).toEqual([{}]);
  });

  it('tracks dirty changes', () => {
    const { fixture, state } = createBoundControl(StringHost);
    expect(state.dirty()).toBe(false);
    fixture.componentInstance.name.markAsDirty();
    expect(state.dirty()).toBe(true);
    fixture.componentInstance.name.markAsPristine();
    expect(state.dirty()).toBe(false);
  });

  it('tracks error changes', () => {
    const { fixture, state } = createBoundControl(StringHost);
    expect(state.errors()).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'required' })]));
    fixture.componentInstance.name.set('Marco');
    expect(state.errors()).toEqual([]);
    fixture.componentInstance.name.set('1');
    expect(state.errors()).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'minLength' }), expect.objectContaining({ kind: 'pattern' })]));
  });

  it('tracks hidden changes', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { fixture, state } = createBoundControl(StringHost);
    expect(state.hidden()).toBe(false);
    fixture.componentInstance.name.hide();
    expect(state.hidden()).toBe(true);
    fixture.componentInstance.name.show();
    expect(state.hidden()).toBe(false);
    warning.mockRestore();
  });

  it('tracks invalid changes', () => {
    const { fixture, state } = createBoundControl(StringHost);
    expect(state.invalid()).toBe(true);
    fixture.componentInstance.name.set('Marco');
    expect(state.invalid()).toBe(false);
    fixture.componentInstance.name.set('1');
    expect(state.invalid()).toBe(true);
  });

  it('tracks maximum constraint changes', () => {
    const { fixture, state } = createBoundControl(NumericHost);
    expect(state.max()).toBe(10);
    fixture.componentInstance.maximum.set(20);
    expect(state.max()).toBe(20);
    fixture.componentInstance.maximum.set(undefined);
    expect(state.max()).toBeUndefined();
  });

  it('tracks maximum-length constraint changes', () => {
    const { fixture, state } = createBoundControl(StringHost);
    expect(state.maxLength()).toBe(20);
    fixture.componentInstance.maximumLength.set(30);
    expect(state.maxLength()).toBe(30);
    fixture.componentInstance.maximumLength.set(undefined);
    expect(state.maxLength()).toBeUndefined();
  });

  it('tracks minimum constraint changes', () => {
    const { fixture, state } = createBoundControl(NumericHost);
    expect(state.min()).toBe(1);
    fixture.componentInstance.minimum.set(2);
    expect(state.min()).toBe(2);
    fixture.componentInstance.minimum.set(undefined);
    expect(state.min()).toBeUndefined();
  });

  it('tracks minimum-length constraint changes', () => {
    const { fixture, state } = createBoundControl(StringHost);
    expect(state.minLength()).toBe(3);
    fixture.componentInstance.minimumLength.set(5);
    expect(state.minLength()).toBe(5);
    fixture.componentInstance.minimumLength.set(undefined);
    expect(state.minLength()).toBeUndefined();
  });

  it('exposes the generated name', () => {
    const { state } = createBoundControl(StringHost);
    expect(state.name()).toMatch(/^a\.form\d+$/);
  });

  it('tracks pattern constraint changes', () => {
    const { fixture, state } = createBoundControl(StringHost);
    expect(state.pattern()).toEqual([/^[a-z]+$/i]);
    fixture.componentInstance.expression.set(/^\d+$/);
    expect(state.pattern()).toEqual([/^\d+$/]);
    fixture.componentInstance.expression.set(undefined);
    expect(state.pattern()).toEqual([]);
  });

  it('tracks pending changes', async () => {
    const { fixture, state } = createBoundControl(PendingHost);
    expect(state.pending()).toBe(true);
    await Promise.resolve();
    expect(fixture.componentInstance.resolveValidation).toBeTypeOf('function');
    fixture.componentInstance.resolveValidation?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(state.pending()).toBe(false);
  });

  it('tracks readonly changes', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { fixture, state } = createBoundControl(StringHost);
    expect(state.readonly()).toBe(false);
    fixture.componentInstance.name.markAsReadonly();
    expect(state.readonly()).toBe(true);
    fixture.componentInstance.name.markAsWritable();
    expect(state.readonly()).toBe(false);
    warning.mockRestore();
  });

  it('exposes required state', () => {
    const { state } = createBoundControl(StringHost);
    expect(state.required()).toBe(true);
  });

  it('tracks touched changes', () => {
    const { fixture, state } = createBoundControl(StringHost);
    expect(state.touched()).toBe(false);
    fixture.componentInstance.name.markAsTouched();
    expect(state.touched()).toBe(true);
    fixture.componentInstance.name.markAsUntouched();
    expect(state.touched()).toBe(false);
  });

  it('disconnects when its component is destroyed', () => {
    const { fixture, state } = createBoundControl(StringHost);
    expect(state.connected()).toBe(true);
    fixture.destroy();
    expect(state.connected()).toBe(false);
  });
});
