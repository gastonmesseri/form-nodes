// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Component, forwardRef, model } from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators, type ControlValueAccessor } from '@angular/forms';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field } from '../primitives/field';
import { asyncValidator } from '../validation/async-validator';
import { max } from '../validation/validators/max';
import { min } from '../validation/validators/min';
import { required } from '../validation/validators/required';
import { pattern } from '../validation/validators/pattern';
import { FormNode } from '../directives/form-node/form-node.directive';
import { maxLength } from '../validation/validators/max-length';
import { minLength } from '../validation/validators/min-length';
import { injectBoundControl } from './bound-control';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import { hasBoundControlConsumer, registerBoundControlBinding } from './adapters/form-node';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../../tests/helpers/register-signal-input-for-jit';

// Plain Vitest transpilation does not emit signal-input metadata for the directive.
registerSignalInputForJit(FormNode, 'formNode', '_formNodeInput');

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('injectBoundControl', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());

  it('does not let an older host registration disconnect a newer one', () => {
    const element = document.createElement('div');
    const first = {} as FormNodeBinding;
    const second = {} as FormNodeBinding;
    expect(hasBoundControlConsumer(element)).toBe(false);
    const disconnectFirst = registerBoundControlBinding(element, first);
    const disconnectSecond = registerBoundControlBinding(element, second);

    expect(disconnectFirst).not.toThrow();
    expect(disconnectSecond).not.toThrow();
  });

  it('exposes reactive normalized state from a formNode binding', () => {
    @Component({
      selector: 'bound-state-control',
      template: `{{ boundControl.disabled() }}`,
      standalone: true,
    })
    class BoundStateControl {
      value = model<string | null>(null);
      boundControl = injectBoundControl<string | null>();
    }
    registerSignalModelForJit(BoundStateControl, 'value');

    @Component({
      template: `<bound-state-control [formNode]="name" />`,
      standalone: true,
      imports: [BoundStateControl, FormNode],
    })
    class Host {
      name = field('', [required, minLength(3), maxLength(20), pattern(/^[a-z]+$/i)], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as BoundStateControl;
    const state = control.boundControl;

    expect(hasBoundControlConsumer(fixture.debugElement.children[0]!.nativeElement)).toBe(true);
    expect(state.connected()).toBe(true);
    expect(state.source()).toBe('formNode');
    expect(state.value()).toBe('');
    expect(state.required()).toBe(true);
    expect(state.minLength()).toBe(3);
    expect(state.maxLength()).toBe(20);
    expect(state.pattern()).toEqual([/^[a-z]+$/i]);
    expect(state.errors()).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'required' })]));
    expect(state.name()).toContain('.form0');

    fixture.componentInstance.name.set('Marco');
    fixture.componentInstance.name.markAsTouched();
    fixture.detectChanges();

    expect(state.touched()).toBe(true);

    fixture.componentInstance.name.markAsDirty();
    fixture.detectChanges();
    expect(state.dirty()).toBe(true);

    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fixture.componentInstance.name.markAsReadonly();
    fixture.componentInstance.name.hide();
    fixture.detectChanges();

    expect(state.readonly()).toBe(true);
    expect(state.hidden()).toBe(true);
    warning.mockRestore();

    fixture.componentInstance.name.disable('maintenance');
    fixture.detectChanges();

    expect(state.value()).toBe('Marco');
    expect(state.disabled()).toBe(true);
    expect(state.disabledReasons()).toHaveLength(1);
    expect(state.touched()).toBe(false);
    expect(state.invalid()).toBe(false);
    expect(state.errors()).toEqual([]);

    fixture.destroy();
    expect(state.connected()).toBe(false);
    expect(state.source()).toBeNull();
  });

  it('exposes numeric field constraints and pending validation', async () => {
    @Component({
      selector: 'bound-number-control',
      template: '',
      standalone: true,
    })
    class BoundNumberControl {
      value = model(0);
      boundControl = injectBoundControl<number>();
    }
    registerSignalModelForJit(BoundNumberControl, 'value');

    @Component({
      template: `<bound-number-control [formNode]="amount" />`,
      standalone: true,
      imports: [BoundNumberControl, FormNode],
    })
    class Host {
      amount = field(5, [min(1), max(10), asyncValidator(() => new Promise<null>(() => {}))], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const state = (fixture.debugElement.children[0]!.componentInstance as BoundNumberControl).boundControl;

    expect(state.min()).toBe(1);
    expect(state.max()).toBe(10);
    expect(state.pattern()).toEqual([]);
    await Promise.resolve();
    expect(state.pending()).toBe(true);
  });

  it('returns neutral signals when the component has no supported binding', () => {
    @Component({
      template: '',
      standalone: true,
    })
    class UnboundControl {
      boundControl = injectBoundControl<string>();
    }

    const fixture = TestBed.createComponent(UnboundControl);
    const state = fixture.componentInstance.boundControl;

    expect(state.connected()).toBe(false);
    expect(state.source()).toBeNull();
    expect(state.value()).toBeUndefined();
    expect(state.disabled()).toBe(false);
    expect(state.disabledReasons()).toEqual([]);
    expect(state.dirty()).toBe(false);
    expect(state.errors()).toEqual([]);
    expect(state.hidden()).toBe(false);
    expect(state.invalid()).toBe(false);
    expect(state.max()).toBeUndefined();
    expect(state.maxLength()).toBeUndefined();
    expect(state.min()).toBeUndefined();
    expect(state.minLength()).toBeUndefined();
    expect(state.pattern()).toEqual([]);
    expect(state.pending()).toBe(false);
    expect(state.readonly()).toBe(false);
    expect(state.required()).toBe(false);
    expect(state.touched()).toBe(false);
    expect(state.name()).toBeUndefined();
  });

  it('normalizes state from a formControl binding', async () => {
    @Component({
      selector: 'reactive-bound-control',
      template: '',
      standalone: true,
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ReactiveBoundControl), multi: true }],
    })
    class ReactiveBoundControl implements ControlValueAccessor {
      boundControl = injectBoundControl<string>();
      writeValue() {}
      registerOnChange() {}
      registerOnTouched() {}
    }

    @Component({
      template: `<reactive-bound-control [formControl]="name" />`,
      standalone: true,
      imports: [ReactiveBoundControl, ReactiveFormsModule],
    })
    class Host {
      name = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const state = (fixture.debugElement.children[0]!.componentInstance as ReactiveBoundControl).boundControl;

    expect(state.source()).toBe('formControl');
    expect(state.value()).toBe('');
    expect(state.errors()).toEqual([{ kind: 'required' }]);

    fixture.componentInstance.name.setErrors({ custom: 'reason' });
    expect(state.invalid()).toBe(true);
    expect(state.errors()).toEqual([{ kind: 'custom', value: 'reason' }]);
    fixture.componentInstance.name.markAsPending();
    expect(state.pending()).toBe(true);

    fixture.componentInstance.name.setValue('a');
    expect(state.errors()).toEqual([{ kind: 'minlength', requiredLength: 3, actualLength: 1 }]);

    fixture.componentInstance.name.setValue('Marco');
    fixture.componentInstance.name.markAsDirty();
    fixture.componentInstance.name.markAsTouched();
    fixture.componentInstance.name.disable();

    expect(state.value()).toBe('Marco');
    expect(state.dirty()).toBe(true);
    expect(state.touched()).toBe(true);
    expect(state.disabled()).toBe(true);
    expect(state.errors()).toEqual([]);
  });
});
