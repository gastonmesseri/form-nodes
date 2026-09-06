// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { FormField } from '@angular/forms/signals';
import { Component, forwardRef, model } from '@angular/core';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { FormControl, FormGroup, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators, type ControlValueAccessor } from '@angular/forms';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { array } from '../primitives/array';
import { group } from '../primitives/group';
import { useControlState } from './control-state';
import { max } from '../validation/validators/max';
import { min } from '../validation/validators/min';
import { pattern } from '../validation/validators/pattern';
import { FormNode } from '../form-node/form-node.directive';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';
import { maxLength } from '../validation/validators/max-length';
import { minLength } from '../validation/validators/min-length';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import { hasControlStateConsumer, registerControlStateBinding } from './adapters/form-node';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../tests/helpers/register-signal-input-for-jit';

// Plain Vitest transpilation does not emit signal-input metadata for the directive.
registerSignalInputForJit(FormNode, 'formNode', '_formNodeInput');

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('useControlState', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());

  it.each(['field', 'form', 'group', 'array'] as const)('reads current committed %s values independently of public equality and pending control input', (kind) => {
    const name = field.strict<string>('Marco', kind === 'field' ? {
      equal: (a, b) => a.toLowerCase() === b.toLowerCase(),
      debounce: 'blur',
    } : {});
    const objectOptions = { equal: (a: { name: string }, b: { name: string }) => a.name.toLowerCase() === b.name.toLowerCase(), debounce: 'blur' as const };
    const target = kind === 'field' ? name : kind === 'form' ? form({ name }, objectOptions)
      : kind === 'group' ? group({ name }, objectOptions)
        : array(() => group({ name }), { initialValue: 1, debounce: 'blur', equal: (a, b) => a[0]!.name.toLowerCase() === b[0]!.name.toLowerCase() });
    const expected = (value: string) => {
      return kind === 'field' ? value : kind === 'array' ? [{ name: value }] : { name: value };
    };
    @Component({ selector: 'equality-state-control', template: '' })
    class EqualityStateControl {
      value = model<unknown>(null);
      state = useControlState();
    }
    registerSignalModelForJit(EqualityStateControl, 'value');
    @Component({ template: `<equality-state-control [formNode]="target" />`, imports: [EqualityStateControl, FormNode] })
    class Host {
      target = target;
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as EqualityStateControl;
    const initial = target();
    expect(control.state.value()).toEqual(expected('Marco'));
    name.set('MARCO');
    fixture.detectChanges();
    expect(target()).toBe(initial);
    expect(control.value()).toEqual(expected('MARCO'));
    expect(control.state.value()).toEqual(expected('MARCO'));
    control.value.set(expected('marco'));
    fixture.detectChanges();
    expect(target.debouncing()).toBe(true);
    expect(control.state.value()).toEqual(expected('MARCO'));
    expect(control.value()).toEqual(expected('marco'));
    control.state.markAsTouched();
    fixture.detectChanges();
    expect(target.debouncing()).toBe(false);
    expect(control.state.value()).toEqual(expected('marco'));
    expect(target()).toBe(initial);
    expect(control.state.dirty()).toBe(true);
    expect(control.state.touched()).toBe(true);
    target.reset();
    fixture.detectChanges();
    expect(control.state.value()).toEqual(expected('marco'));
    expect(control.state.dirty()).toBe(false);
    expect(control.state.touched()).toBe(false);
    fixture.destroy();
    expect(control.state.connected()).toBe(false);
    expect(control.state.value()).toBeUndefined();
  });

  it('does not let an older host registration disconnect a newer one', () => {
    const element = document.createElement('div');
    const first = {} as FormNodeBinding;
    const second = {} as FormNodeBinding;
    expect(hasControlStateConsumer(element)).toBe(false);
    const disconnectFirst = registerControlStateBinding(element, first);
    const disconnectSecond = registerControlStateBinding(element, second);

    expect(disconnectFirst).not.toThrow();
    expect(disconnectSecond).not.toThrow();
  });

  it('exposes reactive normalized state from a formNode binding', () => {
    @Component({
      selector: 'bound-state-control',
      template: `{{ controlState.disabled() }}`,
      standalone: true,
    })
    class BoundStateControl {
      value = model<string | null>(null);
      controlState = useControlState<string | null>();
    }
    registerSignalModelForJit(BoundStateControl, 'value');

    @Component({
      template: `<bound-state-control [formNode]="name" />`,
      standalone: true,
      imports: [BoundStateControl, FormNode],
    })
    class Host {
      name = field.strict('', [required, minLength(3), maxLength(20), pattern(/^[a-z]+$/i)]);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as BoundStateControl;
    const state = control.controlState;

    expect(hasControlStateConsumer(fixture.debugElement.children[0]!.nativeElement)).toBe(true);
    expect(state.connected()).toBe(true);
    expect(state.source()).toBe('formNode');
    expect(state.value()).toBe('');
    expect(state.required()).toBe(true);
    expect(state.minLength()).toBe(3);
    expect(state.maxLength()).toBe(20);
    expect(state.pattern()).toEqual([/^[a-z]+$/i]);
    expect(state.errors()).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'required' })]));
    expect(state.name()).toMatch(/\.form\d+$/);
    state.markAsTouched();
    expect(fixture.componentInstance.name.touched()).toBe(true);
    fixture.componentInstance.name.markAsUntouched();

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
      controlState = useControlState<number>();
    }
    registerSignalModelForJit(BoundNumberControl, 'value');

    @Component({
      template: `<bound-number-control [formNode]="amount" />`,
      standalone: true,
      imports: [BoundNumberControl, FormNode],
    })
    class Host {
      amount = field.strict(5, [min(1), max(10), asyncValidator(() => new Promise<null>(() => {}))]);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const state = (fixture.debugElement.children[0]!.componentInstance as BoundNumberControl).controlState;

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
      controlState = useControlState<string>();
    }

    const fixture = TestBed.createComponent(UnboundControl);
    const state = fixture.componentInstance.controlState;

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
    expect(() => state.markAsTouched()).not.toThrow();
  });

  it('normalizes state from a formControl binding', async () => {
    @Component({
      selector: 'reactive-control-state',
      template: '',
      standalone: true,
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ReactiveControlState), multi: true }],
    })
    class ReactiveControlState implements ControlValueAccessor {
      controlState = useControlState<string>();
      writeValue() {}
      registerOnChange() {}
      registerOnTouched() {}
    }

    @Component({
      template: `<reactive-control-state [formControl]="name" />`,
      standalone: true,
      imports: [ReactiveControlState, ReactiveFormsModule],
    })
    class Host {
      name = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const state = (fixture.debugElement.children[0]!.componentInstance as ReactiveControlState).controlState;

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

  it('selects the formField adapter', async () => {
    @Component({
      selector: 'signal-forms-control-state',
      template: '',
      standalone: true,
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SignalFormsControlState), multi: true }],
    })
    class SignalFormsControlState implements ControlValueAccessor {
      controlState = useControlState<string>();
      writeValue() {}
      registerOnChange() {}
      registerOnTouched() {}
    }

    @Component({
      template: `<signal-forms-control-state [formField]="name.$field" />`,
      standalone: true,
      imports: [SignalFormsControlState, FormField],
    })
    class Host {
      name = field.strict('Marco');
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const state = (fixture.debugElement.children[0]!.componentInstance as SignalFormsControlState).controlState;

    expect(state.source()).toBe('formField');
    expect(state.value()).toBe('Marco');
  });

  it('selects the formControlName adapter', async () => {
    @Component({
      selector: 'control-name-control-state',
      template: '',
      standalone: true,
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ControlNameControlState), multi: true }],
    })
    class ControlNameControlState implements ControlValueAccessor {
      controlState = useControlState<string>();
      writeValue() {}
      registerOnChange() {}
      registerOnTouched() {}
    }

    @Component({
      template: `<form [formGroup]="form"><control-name-control-state formControlName="name" /></form>`,
      standalone: true,
      imports: [ControlNameControlState, ReactiveFormsModule],
    })
    class Host {
      form = new FormGroup({ name: new FormControl('Marco', { nonNullable: true }) });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const state = (fixture.debugElement.children[0]!.children[0]!.componentInstance as ControlNameControlState).controlState;

    expect(state.source()).toBe('formControlName');
    expect(state.value()).toBe('Marco');
  });

  it('selects the ngModel adapter', async () => {
    @Component({
      selector: 'ng-model-control-state',
      template: '',
      standalone: true,
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NgModelControlState), multi: true }],
    })
    class NgModelControlState implements ControlValueAccessor {
      controlState = useControlState<string>();
      writeValue() {}
      registerOnChange() {}
      registerOnTouched() {}
    }

    @Component({
      template: `<ng-model-control-state [(ngModel)]="name" [ngModelOptions]="{ standalone: true }" />`,
      standalone: true,
      imports: [FormsModule, NgModelControlState],
    })
    class Host {
      name = 'Marco';
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const state = (fixture.debugElement.children[0]!.componentInstance as NgModelControlState).controlState;

    expect(state.source()).toBe('ngModel');
    expect(state.value()).toBe('Marco');
  });
});
