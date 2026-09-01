// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Component, Directive, ViewContainerRef, booleanAttribute, forwardRef, inject, input, model, output, signal } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { DefaultValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, NgControl, NumberValueAccessor, Validators, type AbstractControl, type ControlValueAccessor, type ValidationErrors, type Validator } from '@angular/forms';

import { form } from '../../primitives/form';
import { field, type Field } from '../../primitives/field';
import { array } from '../../primitives/array';
import type { Node } from '../../types/node.type';
import { max } from '../../validation/validators/max';
import { min } from '../../validation/validators/min';
import { FormNode } from './form-node.directive';
import { FormNodeNgControl } from './form-node-ng-control';
import { FORM_NODE_STATUS_CLASSES, provideFormNodeConfig } from './form-node-config';
import { provideFormNodeControl } from './form-node-control';
import { provideFormNodePassThrough } from './form-node-pass-through';
import { pattern } from '../../validation/validators/pattern';
import { maxDate } from '../../validation/validators/max-date';
import { minDate } from '../../validation/validators/min-date';
import { required } from '../../validation/validators/required';
import { maxLength } from '../../validation/validators/max-length';
import { minLength } from '../../validation/validators/min-length';
import type { FormNodeBinding } from '../../types/form-node-binding.type';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../../../tests/helpers/register-signal-input-for-jit';
import { isNativeFormNodeControl, parseNativeControlValue, readNativeControlValue, writeNativeControlValue } from './utils/native-control';

registerSignalInputForJit(FormNode, 'formNode', '_formNodeInput');

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

const dispatch = (element: HTMLElement, type: string) => {
  element.dispatchEvent(new Event(type, { bubbles: true }));
};

const accessorWithPrototype = (prototype: object): ControlValueAccessor & { writes: unknown[] } => {
  const accessor = Object.create(prototype) as ControlValueAccessor & { writes: unknown[] };
  accessor.writes = [];
  accessor.writeValue = (value: unknown) => { accessor.writes.push(value); };
  accessor.registerOnChange = () => {};
  accessor.registerOnTouched = () => {};
  accessor.setDisabledState = () => {};
  return accessor;
};

describe('FormNode', () => {
  it('lets a wrapper component accept and delegate the formNode input', () => {
    @Component({
      selector: 'delegating-control',
      template: `<input [formNode]="formNode()">`,
      imports: [FormNode],
    })
    class DelegatingControl {
      readonly formNode = input.required<Field<string>>();
    }

    registerSignalInputForJit(DelegatingControl, 'formNode', 'formNode');

    @Component({
      template: `<delegating-control [formNode]="name" />`,
      imports: [DelegatingControl, FormNode],
    })
    class PassThroughHost {
      readonly name = field('initial', { nullable: false });
    }

    const fixture = TestBed.createComponent(PassThroughHost);
    fixture.detectChanges();
    const inputElement = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(inputElement.value).toBe('initial');
    inputElement.value = 'updated';
    dispatch(inputElement, 'input');
    expect(fixture.componentInstance.name()).toBe('updated');
  });

  it('lets a directive mark its host formNode binding as pass-through explicitly', () => {
    @Directive({
      selector: '[delegatesFormNode]',
      providers: [provideFormNodePassThrough()],
    })
    class DelegatesFormNode {
      readonly formNode = input.required<Field<string>>({ alias: 'formNode' });
    }

    registerSignalInputForJit(DelegatesFormNode, 'formNode', 'formNode');

    @Component({
      template: `<div delegatesFormNode [formNode]="name"></div>`,
      imports: [DelegatesFormNode, FormNode],
    })
    class PassThroughHost {
      readonly name = field('initial', { nullable: false });
    }

    const fixture = TestBed.createComponent(PassThroughHost);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.componentInstance.name()).toBe('initial');
  });

  it('applies configured CSS classes reactively and independently', () => {
    const externalState = signal(false);
    const invalidPredicate = vi.fn((binding: FormNodeBinding) => binding.node().$api.invalid());
    const touchedPredicate = vi.fn((binding: FormNodeBinding) => binding.node().$api.touched());
    const externalPredicate = vi.fn(() => externalState());

    @Component({
      template: `<input [formNode]="name">`,
      standalone: true,
      imports: [FormNode],
      providers: [provideFormNodeConfig({
        classes: {
          'form-invalid': invalidPredicate,
          'form-touched': touchedPredicate,
          highlighted: externalPredicate,
        },
      })],
    })
    class Host {
      name = field('', [required], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const inputElement = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(inputElement.classList.contains('form-invalid')).toBe(true);
    expect(inputElement.classList.contains('form-touched')).toBe(false);
    expect(inputElement.classList.contains('highlighted')).toBe(false);
    expect(invalidPredicate).toHaveBeenCalledTimes(1);
    expect(touchedPredicate).toHaveBeenCalledTimes(1);
    expect(externalPredicate).toHaveBeenCalledTimes(1);
    const binding = invalidPredicate.mock.calls[0]![0];
    expect(binding.element).toBe(inputElement);
    expect(binding.injector.get(FormNode)).toBeInstanceOf(FormNode);
    expect(binding.node()).toBe(fixture.componentInstance.name);
    binding.focus();
    expect(document.activeElement).toBe(inputElement);

    fixture.componentInstance.name.markAsTouched();
    fixture.detectChanges();

    expect(inputElement.classList.contains('form-touched')).toBe(true);
    expect(touchedPredicate).toHaveBeenCalledTimes(2);
    expect(invalidPredicate).toHaveBeenCalledTimes(1);
    expect(externalPredicate).toHaveBeenCalledTimes(1);

    fixture.componentInstance.name.set('Marco');
    externalState.set(true);
    fixture.detectChanges();

    expect(inputElement.classList.contains('form-invalid')).toBe(false);
    expect(inputElement.classList.contains('highlighted')).toBe(true);
    expect(invalidPredicate).toHaveBeenCalledTimes(2);
    expect(touchedPredicate).toHaveBeenCalledTimes(2);
    expect(externalPredicate).toHaveBeenCalledTimes(2);
  });

  it('applies the predefined form-node status classes', () => {
    @Component({
      template: `<input [formNode]="name">`,
      standalone: true,
      imports: [FormNode],
      providers: [provideFormNodeConfig({ classes: FORM_NODE_STATUS_CLASSES })],
    })
    class Host {
      name = field('', [required], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const inputElement = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(Array.from(inputElement.classList)).toEqual(expect.arrayContaining(['ng-invalid', 'ng-pristine', 'ng-untouched']));
    expect(Array.from(inputElement.classList)).not.toEqual(expect.arrayContaining(['ng-valid', 'ng-dirty', 'ng-touched', 'ng-pending']));

    inputElement.value = 'David';
    inputElement.dispatchEvent(new Event('input'));
    inputElement.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(Array.from(inputElement.classList)).toEqual(expect.arrayContaining(['ng-valid', 'ng-dirty', 'ng-touched']));
    expect(Array.from(inputElement.classList)).not.toEqual(expect.arrayContaining(['ng-invalid', 'ng-pristine', 'ng-untouched', 'ng-pending']));
  });

  it('supports the explicit signal-control provider as a fallback', () => {
    @Component({
      selector: 'explicit-signal-control',
      template: `<span>{{ value() }}</span>`,
      standalone: true,
      providers: [provideFormNodeControl(() => ExplicitSignalControl)],
    })
    class ExplicitSignalControl {
      value = model('');
      focus = vi.fn();
    }

    @Component({
      selector: 'explicit-signal-control-host',
      template: `<explicit-signal-control [formNode]="name" />`,
      standalone: true,
      imports: [ExplicitSignalControl, FormNode],
    })
    class Host {
      name = field('Marco', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as ExplicitSignalControl;

    expect(control.value()).toBe('Marco');

    control.value.set('Lia');

    expect(fixture.componentInstance.name()).toBe('Lia');

    fixture.componentInstance.name.focus({ preventScroll: true });
    expect(control.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('preserves Angular input transforms when synchronizing signal-control state', () => {
    @Component({
      selector: 'transformed-state-control',
      template: '',
      standalone: true,
    })
    class TransformedStateControl {
      value = model('');
      disabled = input(false, { transform: booleanAttribute });
    }
    registerSignalModelForJit(TransformedStateControl, 'value');
    registerSignalInputForJit(TransformedStateControl, 'disabled', 'disabled');

    @Component({
      template: `<transformed-state-control [formNode]="name" />`,
      standalone: true,
      imports: [TransformedStateControl, FormNode],
    })
    class Host {
      readonly name = field('Marco', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as TransformedStateControl;

    expect(control.disabled()).toBe(false);

    fixture.componentInstance.name.disable();
    fixture.detectChanges();

    expect(control.disabled()).toBe(true);
  });

  it('rebinds a signal custom control to a different field', () => {
    @Component({
      selector: 'rebound-signal-control',
      template: `<button type="button" (click)="value.set('updated')">{{ value() }}</button>`,
      standalone: true,
      providers: [provideFormNodeControl(() => ReboundSignalControl)],
    })
    class ReboundSignalControl {
      value = model('');
      dirty = input(false);
      focus = vi.fn();
    }
    registerSignalInputForJit(ReboundSignalControl, 'dirty', 'dirty');

    @Component({
      template: `<rebound-signal-control [formNode]="selected()" />`,
      standalone: true,
      imports: [ReboundSignalControl, FormNode],
    })
    class Host {
      readonly first = field('first', { nullable: false });
      readonly second = field('second', { nullable: false });
      readonly selected = signal<Field<string>>(this.first);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as ReboundSignalControl;
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const { first, second, selected } = fixture.componentInstance;
    expect(button.textContent).toContain('first');

    first.markAsDirty();
    fixture.detectChanges();
    expect(control.dirty()).toBe(true);

    selected.set(second);
    fixture.detectChanges();
    expect(button.textContent).toContain('second');
    expect(control.dirty()).toBe(false);

    button.click();
    fixture.detectChanges();
    expect(first()).toBe('first');
    expect(second()).toBe('updated');

    first.focus();
    expect(control.focus).not.toHaveBeenCalled();
    second.focus({ preventScroll: true });
    expect(control.focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('rebinds an aggregate custom control without transferring node-owned debounce work', async () => {
    vi.useFakeTimers();
    try {
      type ProfileValue = { name: string };

      @Component({
        selector: 'rebound-aggregate-control',
        template: '',
        standalone: true,
      })
      class ReboundAggregateControl {
        value = model<ProfileValue>({ name: '' });
      }
      registerSignalModelForJit(ReboundAggregateControl, 'value');

      @Component({
        template: `<rebound-aggregate-control [formNode]="selected()" />`,
        standalone: true,
        imports: [ReboundAggregateControl, FormNode],
      })
      class Host {
        readonly first = form({ name: field('first', { nullable: false }) }, { debounce: 100 });
        readonly second = form({ name: field('second', { nullable: false }) }, { debounce: 100 });
        readonly selected = signal(this.first);
      }

      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const control = fixture.debugElement.children[0]!.componentInstance as ReboundAggregateControl;
      const { first, second, selected } = fixture.componentInstance;

      control.value.set({ name: 'pending first' });
      expect(first.controlValue()).toEqual({ name: 'pending first' });
      expect(first()).toEqual({ name: 'first' });

      selected.set(second);
      fixture.detectChanges();
      expect(control.value()).toEqual({ name: 'second' });

      control.value.set({ name: 'pending second' });
      expect(second.controlValue()).toEqual({ name: 'pending second' });
      expect(second()).toEqual({ name: 'second' });

      await vi.advanceTimersByTimeAsync(100);
      fixture.detectChanges();

      expect(first()).toEqual({ name: 'pending first' });
      expect(second()).toEqual({ name: 'pending second' });
      expect(control.value()).toEqual({ name: 'pending second' });
      expect(first.name.pristine()).toBe(true);
      expect(second.name.pristine()).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('restores a signal custom control when its debounced update is reset', async () => {
    vi.useFakeTimers();
    try {
      @Component({
        selector: 'reset-debounce-signal-control',
        template: `{{ value() }}`,
        standalone: true,
        providers: [provideFormNodeControl(() => ResetDebounceSignalControl)],
      })
      class ResetDebounceSignalControl {
        value = model('');
        reset = vi.fn();
      }

      @Component({
        template: `<reset-debounce-signal-control [formNode]="name" />`,
        standalone: true,
        imports: [ResetDebounceSignalControl, FormNode],
      })
      class Host {
        readonly name = field('initial', { debounce: 100, nullable: false });
      }

      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const control = fixture.debugElement.children[0]!.componentInstance as ResetDebounceSignalControl;
      const { name } = fixture.componentInstance;
      expect(control.value()).toBe('initial');

      control.value.set('pending');
      expect(name.controlValue()).toBe('pending');
      expect(name()).toBe('initial');

      name.reset();
      TestBed.flushEffects();
      expect(control.reset).toHaveBeenCalledOnce();
      expect(control.value()).toBe('initial');
      expect(name.controlValue()).toBe('initial');

      await vi.runAllTimersAsync();
      expect(name()).toBe('initial');
      expect(control.value()).toBe('initial');
    } finally {
      vi.useRealTimers();
    }
  });

  it('commits a blur-debounced signal control when it emits touch', () => {
    @Component({
      selector: 'blur-debounce-signal-control',
      template: '',
      standalone: true,
      providers: [provideFormNodeControl(() => BlurDebounceSignalControl)],
    })
    class BlurDebounceSignalControl {
      value = model('');
      touch = output<void>();
    }

    @Component({
      template: `<blur-debounce-signal-control [formNode]="name" />`,
      standalone: true,
      imports: [BlurDebounceSignalControl, FormNode],
    })
    class Host {
      readonly profile = form({ name: field('initial', { nullable: false }) }, { debounce: 'blur' });
      readonly name = this.profile.name;
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as BlurDebounceSignalControl;
    const { name } = fixture.componentInstance;

    control.value.set('pending');
    expect(name.controlValue()).toBe('pending');
    expect(name()).toBe('initial');
    expect(name.debouncing()).toBe(true);

    control.touch.emit();
    expect(name()).toBe('pending');
    expect(name.debouncing()).toBe(false);
    expect(name.touched()).toBe(true);
  });

  it('binds a FormValueControl to an aggregate form node', () => {
    type ProfileValue = { name: string | null; age: number | null };

    @Component({
      selector: 'aggregate-form-control',
      template: '',
      standalone: true,
    })
    class AggregateFormControl {
      value = model<ProfileValue>({ name: null, age: null });
      disabled = input(false);
      dirty = input(false);
      reset = vi.fn();
      focus = vi.fn();
    }
    registerSignalModelForJit(AggregateFormControl, 'value');
    registerSignalInputForJit(AggregateFormControl, 'disabled', 'disabled');
    registerSignalInputForJit(AggregateFormControl, 'dirty', 'dirty');

    @Component({
      selector: 'aggregate-form-control-host',
      template: `<aggregate-form-control [formNode]="profile" />`,
      standalone: true,
      imports: [AggregateFormControl, FormNode],
    })
    class Host {
      readonly profile = form({ name: field('David'), age: field(42) });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as AggregateFormControl;
    const { profile } = fixture.componentInstance;

    expect(control.value()).toEqual({ name: 'David', age: 42 });
    expect(control.dirty()).toBe(false);

    control.value.set({ name: 'Lia', age: 30 });
    fixture.detectChanges();
    expect(profile()).toEqual({ name: 'Lia', age: 30 });
    expect(profile.dirty()).toBe(true);
    expect(profile.name.pristine()).toBe(true);
    expect(profile.age.pristine()).toBe(true);
    expect(control.dirty()).toBe(true);

    profile.markAsPristine();
    profile.set({ name: 'Ada', age: 37 });
    fixture.detectChanges();
    expect(control.value()).toEqual({ name: 'Ada', age: 37 });
    expect(profile.pristine()).toBe(true);

    profile.focus({ preventScroll: true });
    expect(control.focus).toHaveBeenCalledWith({ preventScroll: true });

    profile.reset();
    expect(control.reset).toHaveBeenCalledOnce();
  });

  it('flushes a blur-debounced aggregate custom control when it emits touch', () => {
    type ProfileValue = { name: string };

    @Component({
      selector: 'debounced-aggregate-control',
      template: '',
      standalone: true,
    })
    class DebouncedAggregateControl {
      value = model<ProfileValue>({ name: '' });
      touch = output<void>();
      reset = vi.fn();
    }
    registerSignalModelForJit(DebouncedAggregateControl, 'value');

    @Component({
      template: `<debounced-aggregate-control [formNode]="profile" />`,
      standalone: true,
      imports: [DebouncedAggregateControl, FormNode],
    })
    class Host {
      readonly profile = form({ name: field('David', { nullable: false }) }, { debounce: 'blur' });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as DebouncedAggregateControl;
    const { profile } = fixture.componentInstance;

    control.value.set({ name: 'Lia' });

    expect(profile.controlValue()).toEqual({ name: 'Lia' });
    expect(profile()).toEqual({ name: 'David' });
    expect(profile.debouncing()).toBe(true);

    control.touch.emit();

    expect(profile()).toEqual({ name: 'Lia' });
    expect(profile.touched()).toBe(true);
    expect(profile.debouncing()).toBe(false);

    control.value.set({ name: 'pending' });
    profile.reset();
    TestBed.flushEffects();

    expect(control.reset).toHaveBeenCalledOnce();
    expect(control.value()).toEqual({ name: 'Lia' });
    expect(profile.controlValue()).toEqual({ name: 'Lia' });
    expect(profile()).toEqual({ name: 'Lia' });
    expect(profile.pristine()).toBe(true);
    expect(profile.debouncing()).toBe(false);
  });

  it('binds a FormValueControl to an aggregate array and reconciles its nodes', () => {
    type PersonValue = { name: string | null };

    @Component({
      selector: 'aggregate-array-control',
      template: '',
      standalone: true,
    })
    class AggregateArrayControl {
      value = model<PersonValue[]>([]);
      reset = vi.fn();
      focus = vi.fn();
    }
    registerSignalModelForJit(AggregateArrayControl, 'value');

    @Component({
      selector: 'aggregate-array-control-host',
      template: `<aggregate-array-control [formNode]="people" />`,
      standalone: true,
      imports: [AggregateArrayControl, FormNode],
    })
    class Host {
      readonly people = array({ name: field('') }, [{ name: 'David' }]);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as AggregateArrayControl;
    const { people } = fixture.componentInstance;
    const originalItem = people[0];

    expect(control.value()).toEqual([{ name: 'David' }]);

    control.value.set([{ name: 'Daniel' }, { name: 'Lia' }]);
    fixture.detectChanges();
    expect(people()).toEqual([{ name: 'Daniel' }, { name: 'Lia' }]);
    expect(people.length()).toBe(2);
    expect(people[0]).toBe(originalItem);
    expect(people.dirty()).toBe(true);
    expect(people[0]!.pristine()).toBe(true);

    control.value.set([]);
    fixture.detectChanges();
    expect(people()).toEqual([]);
    expect(originalItem!.parent()).toBeNull();

    people.focus({ preventScroll: true });
    expect(control.focus).toHaveBeenCalledWith({ preventScroll: true });

    people.reset();
    expect(control.reset).toHaveBeenCalledOnce();
  });

  it('rejects aggregate nodes on native controls', () => {
    @Component({
      selector: 'native-aggregate-form-node-host',
      template: `<input [formNode]="profile">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly profile = form({ name: field('David') });
    }

    const fixture = TestBed.createComponent(Host);
    expect(() => fixture.detectChanges()).toThrowError('formNode: native controls require a field node');
    fixture.destroy();
  });

  it('synchronizes native text values and interaction state in both directions', () => {
    @Component({
      selector: 'text-form-node-host',
      template: `<input [formNode]="name">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('David');

    input.value = 'Mark';
    dispatch(input, 'input');
    fixture.detectChanges();

    expect(fixture.componentInstance.name()).toBe('Mark');
    expect(fixture.componentInstance.name.dirty()).toBe(true);

    dispatch(input, 'blur');
    expect(fixture.componentInstance.name.touched()).toBe(true);

    fixture.componentInstance.name.set('Lia');
    fixture.detectChanges();
    expect(input.value).toBe('Lia');

    const binding = fixture.debugElement.children[0]!.injector.get(FormNode);
    const focus = vi.spyOn(input, 'focus');
    binding.focus({ preventScroll: true });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    fixture.componentInstance.name.focus({ preventScroll: true });
    expect(focus).toHaveBeenCalledTimes(2);

    input.value = 'pending';
    dispatch(input, 'compositionstart');
    dispatch(input, 'input');
    expect(fixture.componentInstance.name()).toBe('Lia');
    dispatch(input, 'compositionend');
    expect(fixture.componentInstance.name()).toBe('pending');

    fixture.componentInstance.name.markAsTouched();
    fixture.componentInstance.name.markAsDirty();
    binding.reset();
    expect(fixture.componentInstance.name.touched()).toBe(false);
    expect(fixture.componentInstance.name.dirty()).toBe(false);

    binding.flush();
  });

  it('focuses the first descendant binding in DOM order from forms and arrays', () => {
    @Component({
      selector: 'aggregate-focus-form-node-host',
      template: `
        <input data-second [formNode]="profile.second">
        <input data-first [formNode]="profile.first">
        <input data-item-one [formNode]="profile.items[1]!">
        <input data-item-zero [formNode]="profile.items[0]!">
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly profile = form({
        first: field('first', { nullable: false }),
        second: field('second', { nullable: false }),
        items: array(field('', { nullable: false }), 2),
      });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const second = fixture.nativeElement.querySelector('[data-second]') as HTMLInputElement;
    const itemOne = fixture.nativeElement.querySelector('[data-item-one]') as HTMLInputElement;
    const focusSecond = vi.spyOn(second, 'focus');
    const focusItemOne = vi.spyOn(itemOne, 'focus');

    fixture.componentInstance.profile.focus({ preventScroll: true });
    expect(focusSecond).toHaveBeenCalledWith({ preventScroll: true });

    fixture.componentInstance.profile.items.focus();
    expect(focusItemOne).toHaveBeenCalledOnce();
  });

  it('selects the first DOM binding for a field and unregisters destroyed bindings', () => {
    @Component({
      selector: 'multiple-focus-form-node-host',
      template: `
        <input data-first [formNode]="name">
        <input data-second [formNode]="name">
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelector('[data-first]') as HTMLInputElement;
    const second = fixture.nativeElement.querySelector('[data-second]') as HTMLInputElement;
    const focusFirst = vi.spyOn(first, 'focus');
    const focusSecond = vi.spyOn(second, 'focus');

    fixture.componentInstance.name.focus();
    expect(focusFirst).toHaveBeenCalledOnce();
    expect(focusSecond).not.toHaveBeenCalled();

    fixture.destroy();
    fixture.componentInstance.name.focus();
    expect(focusFirst).toHaveBeenCalledOnce();
  });

  it('moves focus registration when the bound field changes', () => {
    @Component({
      selector: 'dynamic-focus-form-node-host',
      template: `<input [formNode]="active()">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly first = field('first', { nullable: false });
      readonly second = field('second', { nullable: false });
      readonly active = signal(this.first);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const focus = vi.spyOn(input, 'focus');

    fixture.componentInstance.first.focus();
    expect(focus).toHaveBeenCalledOnce();

    fixture.componentInstance.active.set(fixture.componentInstance.second);
    fixture.detectChanges();
    fixture.componentInstance.first.focus();
    expect(focus).toHaveBeenCalledOnce();

    fixture.componentInstance.second.focus();
    expect(focus).toHaveBeenCalledTimes(2);
  });

  it('binds a field nested inside a form tree', () => {
    @Component({
      selector: 'nested-form-node-host',
      template: `<input [formNode]="profile.address.city">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly profile = form({
        name: field('David', { nullable: false }),
        address: form({
          city: field('Zurich', { nullable: false }),
        }),
      });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const { profile } = fixture.componentInstance;

    expect(input.value).toBe('Zurich');
    expect(input.name).toMatch(/\.form\d+\.address\.city$/);
    expect(profile.address.city.path()).toEqual(['address', 'city']);
    expect(profile.address.city.parent()).toBe(profile.address);
    expect(profile.address.city.form()).toBe(profile);

    input.value = 'Bern';
    dispatch(input, 'input');
    expect(profile()).toEqual({ name: 'David', address: { city: 'Bern' } });

    profile.patch({ address: { city: 'Geneva' } });
    fixture.detectChanges();
    expect(input.value).toBe('Geneva');
  });

  it('assigns distinct generated names to fields from different root trees', () => {
    @Component({
      selector: 'root-field-names-form-node-host',
      template: `
        <input [formNode]="first">
        <input [formNode]="second">
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly first = field('first', { nullable: false });
      readonly second = field('second', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [first, second] = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

    expect(first!.name).toMatch(/\.form\d+$/);
    expect(second!.name).toMatch(/\.form\d+$/);
    expect(second!.name).not.toBe(first!.name);
  });

  it('keeps the last valid numeric model value and contributes parse errors to its form tree', () => {
    @Component({
      selector: 'numeric-parse-form-node-host',
      template: `<input type="text" [formNode]="profile.age">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly profile = form({ age: field(23, min(30), { nullable: false }) });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const { profile } = fixture.componentInstance;

    expect(profile.age.getError('min')?.formNode).toBeUndefined();

    input.value = 'not-a-number';
    dispatch(input, 'input');
    fixture.detectChanges();

    expect(input.value).toBe('not-a-number');
    expect(profile.age()).toBe(23);
    expect(profile.age.controlValue()).toBe(23);
    expect(profile.age.dirty()).toBe(true);
    const parseError = profile.age.getError('parse');
    expect(parseError).toMatchObject({ kind: 'parse', targetNode: profile.age });
    expect(parseError?.formNode?.element).toBe(input);
    expect(parseError?.formNode?.node()).toBe(profile.age);
    expect(profile.invalid()).toBe(true);
    expect(profile.allErrors()).toContain(profile.age.getError('parse'));

    profile.age.set(30);
    fixture.detectChanges();
    expect(input.value).toBe('30');
    expect(profile.age.getError('parse')).toBeUndefined();

    input.value = '42';
    dispatch(input, 'input');
    fixture.detectChanges();

    expect(profile.age()).toBe(42);
    expect(profile.age.getError('parse')).toBeUndefined();
    expect(profile.valid()).toBe(true);
  });

  it('tracks parse errors per binding and clears stale raw input on field reset', () => {
    @Component({
      selector: 'multiple-parse-form-node-host',
      template: `
        <input data-first type="text" [formNode]="age">
        <input data-second type="text" [formNode]="age">
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly age = field(23, { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelector('[data-first]') as HTMLInputElement;
    const second = fixture.nativeElement.querySelector('[data-second]') as HTMLInputElement;
    const firstBinding = fixture.debugElement.children[0]!.injector.get(FormNode);
    const secondBinding = fixture.debugElement.children[1]!.injector.get(FormNode);
    const { age } = fixture.componentInstance;

    expect(firstBinding.node()).toBe(age);
    expect(firstBinding.errors()).toEqual([]);

    first.value = 'first-invalid';
    dispatch(first, 'input');
    second.value = 'second-invalid';
    dispatch(second, 'input');
    fixture.detectChanges();

    expect(age()).toBe(23);
    const parseErrors = age.errors().filter(error => error.kind === 'parse');
    expect(parseErrors).toHaveLength(2);
    expect(parseErrors.map(error => error.formNode?.element)).toEqual([first, second]);
    expect(parseErrors[0]!.formNode).not.toBe(parseErrors[1]!.formNode);
    expect(parseErrors[0]!.formNode).toBe(firstBinding);
    expect(parseErrors[1]!.formNode).toBe(secondBinding);
    expect(firstBinding.errors().filter(error => error.kind === 'parse')).toEqual([parseErrors[0]]);
    expect(secondBinding.errors().filter(error => error.kind === 'parse')).toEqual([parseErrors[1]]);
    expect(first.value).toBe('first-invalid');
    expect(second.value).toBe('second-invalid');

    age.reset();
    fixture.detectChanges();

    expect(age.getError('parse')).toBeUndefined();
    expect(firstBinding.errors()).toEqual([]);
    expect(secondBinding.errors()).toEqual([]);
    expect(age.pristine()).toBe(true);
    expect(first.value).toBe('23');
    expect(second.value).toBe('23');
  });

  it('exposes node errors through every binding while filtering binding-owned errors', () => {
    @Component({
      template: `
        <input type="text" [formNode]="age">
        <input type="text" [formNode]="age">
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly age = field(23, [min(30)], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelectorAll('input')[0] as HTMLInputElement;
    const firstBinding = fixture.debugElement.children[0]!.injector.get(FormNode);
    const secondBinding = fixture.debugElement.children[1]!.injector.get(FormNode);

    expect(firstBinding.errors().map(error => error.kind)).toEqual(['min']);
    expect(secondBinding.errors().map(error => error.kind)).toEqual(['min']);
    const secondErrors = secondBinding.errors();

    first.value = 'invalid';
    dispatch(first, 'input');
    fixture.detectChanges();

    expect(firstBinding.errors().map(error => error.kind)).toEqual(['min', 'parse']);
    expect(secondBinding.errors().map(error => error.kind)).toEqual(['min']);
    expect(secondBinding.errors()).toBe(secondErrors);
  });

  it('moves native parse-error ownership when the bound field changes', () => {
    @Component({
      selector: 'dynamic-parse-form-node-host',
      template: `<input type="text" [formNode]="selected()">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly first = field(23, { nullable: false });
      readonly second = field(42, { nullable: false });
      readonly selected = signal<Field<number>>(this.first);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const binding = fixture.debugElement.children[0]!.injector.get(FormNode);
    const { first, second, selected } = fixture.componentInstance;

    input.value = 'invalid';
    dispatch(input, 'input');
    fixture.detectChanges();
    expect(first.getError('parse')?.kind).toBe('parse');
    expect(binding.node()).toBe(first);
    expect(binding.errors().map(error => error.kind)).toEqual(['parse']);

    selected.set(second);
    fixture.detectChanges();
    expect(first.getError('parse')).toBeUndefined();
    expect(second.getError('parse')).toBeUndefined();
    expect(binding.node()).toBe(second);
    expect(binding.errors()).toEqual([]);
    expect(input.value).toBe('42');

    input.value = 'still-invalid';
    dispatch(input, 'input');
    fixture.detectChanges();
    expect(second.getError('parse')?.kind).toBe('parse');
    expect(binding.errors().map(error => error.kind)).toEqual(['parse']);

    fixture.destroy();
    expect(second.getError('parse')).toBeUndefined();
  });

  it('binds disabled, readonly, required, and aria-invalid state', () => {
    @Component({
      selector: 'state-form-node-host',
      template: `<input [formNode]="name">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly name = field('', [required], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    fixture.componentInstance.name.markAsReadonly();
    fixture.detectChanges();
    expect(input.readOnly).toBe(true);

    fixture.componentInstance.name.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('warns in development when a hidden field remains rendered', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @Component({
      selector: 'hidden-form-node-host',
      template: `<input [formNode]="profile.name">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly profile = form({ name: field('David', { hidden: true, nullable: false }) });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(
      'formNode: field \'name\' is hidden but is being rendered. Hidden fields should be removed from the DOM using @if.',
    );

    fixture.detectChanges();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('warns each time a rendered root field becomes hidden', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @Component({
      selector: 'reactive-hidden-form-node-host',
      template: `<input [formNode]="name">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly hidden = signal(false);
      readonly name = field('David', { hidden: () => this.hidden(), nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(warn).not.toHaveBeenCalled();

    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();
    expect(warn).toHaveBeenLastCalledWith(
      'formNode: field \'<root>\' is hidden but is being rendered. Hidden fields should be removed from the DOM using @if.',
    );

    fixture.componentInstance.hidden.set(false);
    fixture.detectChanges();
    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('does not install the rendered-hidden-field warning in production mode', () => {
    @Component({
      selector: 'production-hidden-form-node-host',
      template: `<input [formNode]="name">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly name = field('David', { hidden: true, nullable: false });
    }

    const global = globalThis as typeof globalThis & { ngDevMode: unknown };
    const previousNgDevMode = global.ngDevMode;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      global.ngDevMode = false;
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      global.ngDevMode = previousNgDevMode;
      warn.mockRestore();
    }
  });

  it('binds reactive validator constraints to applicable native properties', () => {
    @Component({
      selector: 'constraint-form-node-host',
      template: `
        <input type="number" [formNode]="age">
        <input [formNode]="code">
        <input type="date" [formNode]="date">
        <input type="month" [formNode]="month">
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly minimum = signal<number | undefined>(18);
      readonly age = field(20, [min(() => this.minimum()), max(100)], { nullable: false });
      readonly code = field('abc', [minLength(2), maxLength(5), pattern(/^[a-z]+$/), pattern(/^.{3}$/)], { nullable: false });
      readonly date = field(new Date('2026-06-01T00:00:00.000Z'), [
        minDate(new Date('2026-01-02T00:00:00.000Z')),
        maxDate(new Date('2026-12-03T00:00:00.000Z')),
      ], { nullable: false });
      readonly month = field(new Date('2026-06-01T00:00:00.000Z'), [
        minDate(new Date('2026-01-02T00:00:00.000Z')),
      ], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [age, code, date, month] = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

    expect(age!.min).toBe('18');
    expect(age!.max).toBe('100');
    expect(code!.minLength).toBe(2);
    expect(code!.maxLength).toBe(5);
    expect(code!.pattern).toBe('(?=(?:^[a-z]+$)$)(?=(?:^.{3}$)$).*');
    expect(date!.min).toBe('2026-01-02');
    expect(date!.max).toBe('2026-12-03');
    expect(month!.min).toBe('2026-01');

    fixture.componentInstance.minimum.set(undefined);
    fixture.detectChanges();
    expect(age!.min).toBe('');
  });

  it('applies min and max only to the native input types accepted by Angular Signal Forms', () => {
    @Component({
      selector: 'native-min-max-form-node-host',
      template: `
        <input data-type="number" type="number" [formNode]="value">
        <input data-type="range" type="range" [formNode]="value">
        <input data-type="date" type="date" [formNode]="value">
        <input data-type="month" type="month" [formNode]="value">
        <input data-type="text" type="text" [formNode]="value">
        <input data-type="email" type="email" [formNode]="value">
        <input data-type="time" type="time" [formNode]="value">
        <input data-type="week" type="week" [formNode]="value">
        <input data-type="datetime-local" type="datetime-local" [formNode]="value">
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly value = field(5, [min(1), max(9)], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = (type: string) => fixture.nativeElement.querySelector(`[data-type="${type}"]`) as HTMLInputElement;

    ['number', 'range', 'date', 'month'].forEach((type) => {
      expect(input(type).min).toBe('1');
      expect(input(type).max).toBe('9');
    });
    ['text', 'email', 'time', 'week', 'datetime-local'].forEach((type) => {
      expect(input(type).getAttribute('min')).toBeNull();
      expect(input(type).getAttribute('max')).toBeNull();
    });
  });

  it('applies constraints when the native input type is bound during initialization', () => {
    @Component({
      selector: 'late-bound-type-form-node-host',
      template: `
        <input data-numeric [type]="numericType()" [formNode]="amount">
        <input data-textual [type]="textualType()" [formNode]="code">
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly numericType = signal('number');
      readonly textualType = signal('email');
      readonly amount = field(15, [min(10), max(20)], { nullable: false });
      readonly code = field('abc', [minLength(2), maxLength(10)], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const numeric = fixture.nativeElement.querySelector('[data-numeric]') as HTMLInputElement;
    const textual = fixture.nativeElement.querySelector('[data-textual]') as HTMLInputElement;

    expect(numeric.type).toBe('number');
    expect(numeric.min).toBe('10');
    expect(numeric.max).toBe('20');
    expect(textual.type).toBe('email');
    expect(textual.minLength).toBe(2);
    expect(textual.maxLength).toBe(10);
  });

  it('applies length constraints to inputs and textareas but not selects', () => {
    @Component({
      selector: 'native-length-form-node-host',
      template: `
        <input type="number" [formNode]="value">
        <textarea [formNode]="value"></textarea>
        <select [formNode]="value"><option>abc</option></select>
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly value = field('abc', [minLength(2), maxLength(5)], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;

    expect(input.minLength).toBe(2);
    expect(input.maxLength).toBe(5);
    expect(textarea.minLength).toBe(2);
    expect(textarea.maxLength).toBe(5);
    expect(select.getAttribute('minlength')).toBeNull();
    expect(select.getAttribute('maxlength')).toBeNull();
  });

  it('buffers native input through the field control debounce', async () => {
    vi.useFakeTimers();
    try {
      @Component({
        selector: 'debounce-form-node-host',
        template: `<input [formNode]="name">`,
        standalone: true,
        imports: [FormNode],
      })
      class Host {
        readonly name = field('David', { debounce: 100, nullable: false });
      }

      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

      input.value = 'Mark';
      dispatch(input, 'input');

      expect(fixture.componentInstance.name.controlValue()).toBe('Mark');
      expect(fixture.componentInstance.name()).toBe('David');
      expect(fixture.componentInstance.name.debouncing()).toBe(true);

      await vi.advanceTimersByTimeAsync(100);
      expect(fixture.componentInstance.name()).toBe('Mark');
    } finally {
      vi.useRealTimers();
    }
  });

  it('commits a blur-debounced native control when it loses focus', () => {
    @Component({
      selector: 'blur-debounce-form-node-host',
      template: `<input [formNode]="name">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly name = field('initial', { debounce: 'blur', nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const inputElement = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const { name } = fixture.componentInstance;

    inputElement.value = 'pending';
    dispatch(inputElement, 'input');
    expect(name.controlValue()).toBe('pending');
    expect(name()).toBe('initial');
    expect(name.debouncing()).toBe(true);

    dispatch(inputElement, 'blur');
    expect(name()).toBe('pending');
    expect(name.debouncing()).toBe(false);
    expect(name.touched()).toBe(true);
  });

  it('restores a native control when a debounced update is reset locally or from its form', async () => {
    vi.useFakeTimers();
    try {
      @Component({
        selector: 'reset-debounce-form-node-host',
        template: `<input [formNode]="profile.name">`,
        standalone: true,
        imports: [FormNode],
      })
      class Host {
        readonly profile = form({ name: field('initial', { nullable: false }) }, { debounce: 100 });
      }

      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const inputElement = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      const { profile } = fixture.componentInstance;
      expect(inputElement.value).toBe('initial');

      inputElement.value = 'local pending';
      dispatch(inputElement, 'input');
      expect(profile.name.controlValue()).toBe('local pending');
      expect(profile.name()).toBe('initial');

      profile.name.reset();
      expect(inputElement.value).toBe('initial');
      await vi.runAllTimersAsync();
      expect(profile.name()).toBe('initial');
      expect(inputElement.value).toBe('initial');

      inputElement.value = 'form pending';
      dispatch(inputElement, 'input');
      expect(profile.name.controlValue()).toBe('form pending');

      profile.reset();
      expect(inputElement.value).toBe('initial');
      await vi.runAllTimersAsync();
      expect(profile()).toEqual({ name: 'initial' });
      expect(inputElement.value).toBe('initial');
    } finally {
      vi.useRealTimers();
    }
  });

  it('parses number and checkbox controls using their native value types', () => {
    @Component({
      selector: 'typed-native-form-node-host',
      template: `
        <input type="number" [formNode]="age">
        <input type="checkbox" [formNode]="active">
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly age = field(23, { nullable: false });
      readonly active = field(false, { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [age, active] = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

    age!.value = '42';
    dispatch(age!, 'input');
    active!.checked = true;
    dispatch(active!, 'change');

    expect(fixture.componentInstance.age()).toBe(42);
    expect(fixture.componentInstance.active()).toBe(true);
  });

  it('synchronizes a native radio group through a shared field', () => {
    @Component({
      selector: 'radio-form-node-host',
      template: `
        <input type="radio" name="city" value="Madrid" [formNode]="city">
        <input type="radio" name="city" value="Zurich" [formNode]="city">
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly city = field('Zurich', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [madrid, zurich] = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

    expect(madrid!.checked).toBe(false);
    expect(zurich!.checked).toBe(true);
    expect(madrid!.name).toMatch(/\.form\d+$/);
    expect(zurich!.name).toBe(madrid!.name);

    dispatch(madrid!, 'change');
    expect(fixture.componentInstance.city()).toBe('Zurich');

    madrid!.checked = true;
    dispatch(madrid!, 'change');
    fixture.detectChanges();

    expect(fixture.componentInstance.city()).toBe('Madrid');
    expect(madrid!.checked).toBe(true);
    expect(zurich!.checked).toBe(false);
  });

  it('supports single and multiple native selects and reapplies values after option mutations', async () => {
    @Component({
      selector: 'select-form-node-host',
      template: `
        <select [formNode]="city"><option>Madrid</option><option>Zurich</option></select>
        <select multiple [formNode]="cities"><option>Madrid</option><option>Zurich</option></select>
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly city = field('Zurich', { nullable: false });
      readonly cities = field<string[]>(['Madrid'], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [city, cities] = fixture.nativeElement.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;

    expect(city!.value).toBe('Zurich');
    expect(Array.from(cities!.selectedOptions, option => option.value)).toEqual(['Madrid']);

    cities!.options[1]!.selected = true;
    dispatch(cities!, 'change');
    expect(fixture.componentInstance.cities()).toEqual(['Madrid', 'Zurich']);

    fixture.componentInstance.city.set('Paris');
    fixture.detectChanges();
    expect(city!.value).toBe('');
    const optionMutation = new Promise<void>(resolve =>
      new MutationObserver(() => resolve()).observe(city!, { childList: true }),
    );
    city!.append(new Option('Paris'));
    await optionMutation;
    expect(city!.value).toBe('Paris');
  });

  it('integrates with a custom ControlValueAccessor and provides NgControl', () => {
    @Component({
      selector: 'test-cva',
      template: '',
      standalone: true,
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => TestCva),
        multi: true,
      }, {
        provide: NG_VALIDATORS,
        useExisting: forwardRef(() => TestCva),
        multi: true,
      }],
    })
    class TestCva implements ControlValueAccessor, Validator {
      readonly ngControl = inject(NgControl, { self: true });
      name = input('');
      value: unknown;
      disabled = false;
      rejectValue = false;
      change = (_value: unknown) => {};
      touch = () => {};
      validatorChange = () => {};
      writeValue(value: unknown) { this.value = value; }
      registerOnChange(callback: (value: unknown) => void) { this.change = callback; }
      registerOnTouched(callback: () => void) { this.touch = callback; }
      setDisabledState(disabled: boolean) { this.disabled = disabled; }
      validate(_control: AbstractControl): ValidationErrors | null {
        return this.rejectValue ? { customCva: { rejected: true } } : null;
      }
      registerOnValidatorChange(callback: () => void) { this.validatorChange = callback; }
    }
    registerSignalInputForJit(TestCva, 'name', 'name');

    @Component({
      selector: 'cva-form-node-host',
      template: `<test-cva [formNode]="active()" />`,
      standalone: true,
      imports: [FormNode, TestCva],
    })
    class Host {
      readonly name = field('David', { nullable: false });
      readonly alternative = field('Lia', { nullable: false });
      readonly active = signal(this.name);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const cva = fixture.debugElement.children[0]!.componentInstance as TestCva;

    expect(cva.value).toBe('David');
    expect(cva.name()).toMatch(/\.form\d+$/);
    const firstName = cva.name();
    cva.change('Mark');
    expect(fixture.componentInstance.name()).toBe('Mark');
    cva.touch();
    expect(fixture.componentInstance.name.touched()).toBe(true);

    fixture.componentInstance.name.disable();
    fixture.detectChanges();
    expect(cva.disabled).toBe(true);
    expect(cva.ngControl).toBe(fixture.debugElement.children[0]!.injector.get(NgControl));

    fixture.componentInstance.name.enable();
    cva.rejectValue = true;
    cva.validatorChange();
    fixture.detectChanges();
    expect(fixture.componentInstance.name.invalid()).toBe(true);
    expect(fixture.componentInstance.name.getError('customCva')).toMatchObject({
      kind: 'customCva',
      context: { rejected: true },
      targetNode: fixture.componentInstance.name,
    });

    cva.rejectValue = false;
    cva.validatorChange();
    fixture.detectChanges();
    expect(fixture.componentInstance.name.valid()).toBe(true);

    cva.rejectValue = true;
    cva.validatorChange();
    fixture.detectChanges();
    expect(fixture.componentInstance.name.invalid()).toBe(true);

    fixture.componentInstance.active.set(fixture.componentInstance.alternative);
    fixture.detectChanges();
    expect(cva.name()).toMatch(/\.form\d+$/);
    expect(cva.name()).not.toBe(firstName);
    expect(fixture.debugElement.children[0]!.injector.get(FormNode).node())
      .toBe(fixture.componentInstance.alternative);
    expect(fixture.componentInstance.name.valid()).toBe(true);
    expect(fixture.componentInstance.alternative.getError('customCva')?.targetNode)
      .toBe(fixture.componentInstance.alternative);

    fixture.destroy();
    expect(fixture.componentInstance.alternative.valid()).toBe(true);
  });

  it('commits a blur-debounced ControlValueAccessor through its touched callback', () => {
    @Component({
      selector: 'blur-debounce-cva',
      template: '',
      standalone: true,
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => BlurDebounceCva), multi: true }],
    })
    class BlurDebounceCva implements ControlValueAccessor {
      change = (_value: string) => {};
      touched = () => {};
      writeValue() {}
      registerOnChange(callback: (value: string) => void) { this.change = callback; }
      registerOnTouched(callback: () => void) { this.touched = callback; }
    }

    @Component({
      template: `<blur-debounce-cva [formNode]="name" />`,
      standalone: true,
      imports: [BlurDebounceCva, FormNode],
    })
    class Host {
      readonly name = field('initial', { debounce: 'blur', nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as BlurDebounceCva;
    const { name } = fixture.componentInstance;

    control.change('pending');
    expect(name.controlValue()).toBe('pending');
    expect(name()).toBe('initial');

    control.touched();
    expect(name()).toBe('pending');
    expect(name.debouncing()).toBe(false);
    expect(name.touched()).toBe(true);
  });

  it('rejects a host that is neither a native control nor a ControlValueAccessor', () => {
    @Component({
      selector: 'invalid-form-node-host',
      template: `<div [formNode]="name"></div>`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    expect(() => TestBed.createComponent(Host).detectChanges())
      .toThrowError('formNode: the host must be a native form control, provide a signal custom control, or provide ControlValueAccessor');
  });

  it('rejects multiple custom ControlValueAccessors on the same host', () => {
    const accessor = (): ControlValueAccessor => ({
      writeValue: () => {},
      registerOnChange: () => {},
      registerOnTouched: () => {},
    });

    @Component({
      selector: 'ambiguous-cva',
      template: '',
      standalone: true,
      providers: [
        { provide: NG_VALUE_ACCESSOR, useFactory: accessor, multi: true },
        { provide: NG_VALUE_ACCESSOR, useFactory: accessor, multi: true },
      ],
    })
    class AmbiguousCva {}

    @Component({
      selector: 'ambiguous-cva-host',
      template: `<ambiguous-cva [formNode]="name" />`,
      standalone: true,
      imports: [AmbiguousCva, FormNode],
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    expect(() => TestBed.createComponent(Host).detectChanges())
      .toThrowError('formNode: more than one custom ControlValueAccessor matches the host');
  });

  it('prefers a custom accessor over Angular built-in and default accessors', () => {
    const custom: ControlValueAccessor & { writes: unknown[] } = {
      writes: [],
      writeValue(value: unknown) { this.writes.push(value); },
      registerOnChange: () => {},
      registerOnTouched: () => {},
    };

    @Component({
      selector: 'accessor-priority-control',
      template: '',
      standalone: true,
      providers: [
        { provide: NG_VALUE_ACCESSOR, useFactory: () => Object.create(DefaultValueAccessor.prototype), multi: true },
        { provide: NG_VALUE_ACCESSOR, useFactory: () => Object.create(NumberValueAccessor.prototype), multi: true },
        { provide: NG_VALUE_ACCESSOR, useValue: custom, multi: true },
      ],
    })
    class PriorityControl {}

    @Component({
      selector: 'accessor-priority-host',
      template: `<accessor-priority-control [formNode]="name" />`,
      standalone: true,
      imports: [FormNode, PriorityControl],
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(custom.writes).toEqual(['David']);
  });

  it.each([
    ['default', DefaultValueAccessor.prototype],
    ['built-in', NumberValueAccessor.prototype],
  ])('uses a single %s accessor when no higher-priority accessor exists', (_kind, prototype) => {
    let accessor!: ReturnType<typeof accessorWithPrototype>;

    @Component({
      selector: 'single-angular-accessor',
      template: '',
      standalone: true,
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useFactory: () => (accessor = accessorWithPrototype(prototype)),
        multi: true,
      }],
      host: { 'data-accessor-kind': _kind },
    })
    class SingleAccessorControl {}

    @Component({
      selector: 'single-angular-accessor-host',
      template: `<single-angular-accessor [formNode]="name" />`,
      standalone: true,
      imports: [FormNode, SingleAccessorControl],
      host: { 'data-accessor-kind': _kind },
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(accessor.writes).toEqual(['David']);
  });

  it.each([
    ['default', DefaultValueAccessor.prototype, 'formNode: more than one default ControlValueAccessor matches the host'],
    ['built-in', NumberValueAccessor.prototype, 'formNode: more than one built-in ControlValueAccessor matches the host'],
  ])('rejects multiple %s accessors', (_kind, prototype, message) => {
    @Component({
      selector: 'duplicate-angular-accessor',
      template: '',
      standalone: true,
      providers: [
        { provide: NG_VALUE_ACCESSOR, useFactory: () => accessorWithPrototype(prototype), multi: true },
        { provide: NG_VALUE_ACCESSOR, useFactory: () => accessorWithPrototype(prototype), multi: true },
      ],
      host: { 'data-accessor-kind': _kind },
    })
    class DuplicateAccessorControl {}

    @Component({
      selector: 'duplicate-angular-accessor-host',
      template: `<duplicate-angular-accessor [formNode]="name" />`,
      standalone: true,
      imports: [DuplicateAccessorControl, FormNode],
      host: { 'data-accessor-kind': _kind },
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    expect(() => TestBed.createComponent(Host).detectChanges()).toThrowError(message);
  });

  it('reports access before its required field input is initialized', () => {
    @Component({
      selector: 'missing-field-host',
      template: `<input formNode>`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {}

    const fixture = TestBed.createComponent(Host);
    const binding = fixture.debugElement.children[0]!.injector.get(FormNode);
    expect(() => binding.node()).toThrowError('formNode: a field, form, or array node is required');
    fixture.destroy();
  });

  it('supports a minimal CVA without disabled handling or legacy validators and ignores callbacks after destroy', () => {
    @Component({
      selector: 'minimal-cva',
      template: '',
      standalone: true,
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MinimalCva), multi: true }],
    })
    class MinimalCva implements ControlValueAccessor {
      change = (_value: unknown) => {};
      touch = () => {};
      writes: unknown[] = [];
      writeValue(value: unknown) { this.writes.push(value); }
      registerOnChange(callback: (value: unknown) => void) { this.change = callback; }
      registerOnTouched(callback: () => void) { this.touch = callback; }
    }

    @Component({
      selector: 'minimal-cva-host',
      template: `<minimal-cva [formNode]="name" />`,
      standalone: true,
      imports: [FormNode, MinimalCva],
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const cva = fixture.debugElement.children[0]!.componentInstance as MinimalCva;
    fixture.destroy();
    cva.change('ignored');
    cva.touch();
    expect(fixture.componentInstance.name()).toBe('David');
    expect(fixture.componentInstance.name.touched()).toBe(false);
  });

  it('does not loop or duplicate model writes when writeValue synchronously calls onChange', () => {
    @Component({
      selector: 'echoing-cva',
      template: '',
      standalone: true,
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EchoingCva), multi: true }],
    })
    class EchoingCva implements ControlValueAccessor {
      change = (_value: unknown) => {};
      writes: unknown[] = [];
      writeValue(value: unknown) {
        this.writes.push(value);
        this.change(value);
      }
      registerOnChange(callback: (value: unknown) => void) { this.change = callback; }
      registerOnTouched() {}
    }

    @Component({
      selector: 'echoing-cva-host',
      template: `<echoing-cva [formNode]="name" />`,
      standalone: true,
      imports: [FormNode, EchoingCva],
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const cva = fixture.debugElement.children[0]!.componentInstance as EchoingCva;

    expect(cva.writes).toEqual(['David']);
    expect(fixture.componentInstance.name()).toBe('David');
    expect(fixture.componentInstance.name.dirty()).toBe(false);

    fixture.componentInstance.name.set('Mark');
    fixture.detectChanges();

    expect(cva.writes).toEqual(['David', 'Mark']);
    expect(fixture.componentInstance.name()).toBe('Mark');
  });

  it('supports a signal custom control implemented as a directive', () => {
    @Directive({
      selector: 'input[providedSignalControl]',
      standalone: true,
      providers: [provideFormNodeControl(() => ProvidedSignalControl)],
      host: {
        '[value]': 'value()',
        '(input)': 'onInput($event)',
      },
    })
    class ProvidedSignalControl {
      value = model('');
      disabled = input(false);
      required = input(false);
      onInput(event: Event) { this.value.set((event.target as HTMLInputElement).value); }
    }

    @Component({
      template: `<input providedSignalControl [formNode]="name">`,
      standalone: true,
      imports: [ProvidedSignalControl, FormNode],
    })
    class Host {
      name = field('', [required], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const inputElement = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const control = fixture.debugElement.children[0]!.injector.get(ProvidedSignalControl);
    expect(control.required()).toBe(true);
    expect(control.disabled()).toBe(false);
    expect(inputElement.required).toBe(false);

    inputElement.value = 'Mark';
    inputElement.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.name()).toBe('Mark');

    fixture.componentInstance.name.disable();
    fixture.detectChanges();
    expect(control.disabled()).toBe(true);
    expect(inputElement.disabled).toBe(false);
  });

  it('supports a signal checkbox control implemented as a directive', () => {
    @Directive({
      selector: 'input[providedSignalCheckbox]',
      standalone: true,
      providers: [provideFormNodeControl(() => ProvidedSignalCheckbox)],
      host: {
        '[checked]': 'checked()',
        '(input)': 'onInput($event)',
      },
    })
    class ProvidedSignalCheckbox {
      checked = model(false);
      required = input(false);
      onInput(event: Event) { this.checked.set((event.target as HTMLInputElement).checked); }
    }

    @Component({
      template: `<input type="checkbox" providedSignalCheckbox [formNode]="active">`,
      standalone: true,
      imports: [ProvidedSignalCheckbox, FormNode],
    })
    class Host {
      active = field(true, [required], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const inputElement = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const control = fixture.debugElement.children[0]!.injector.get(ProvidedSignalCheckbox);
    expect(inputElement.checked).toBe(true);
    expect(control.required()).toBe(true);
    expect(inputElement.required).toBe(false);

    fixture.componentInstance.active.set(false);
    fixture.detectChanges();
    expect(inputElement.checked).toBe(false);

    inputElement.checked = true;
    inputElement.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.active()).toBe(true);
  });

  it('supports an explicitly provided signal control composed as a host directive', () => {
    @Directive({
      standalone: true,
      providers: [provideFormNodeControl(() => HostedSignalControl)],
    })
    class HostedSignalControl {
      value = model('');
      touched = input(false);
    }

    @Component({
      selector: 'hosted-signal-control',
      template: `<button type="button" (click)="control.value.set('Mark')">{{ control.value() }}</button>`,
      standalone: true,
      hostDirectives: [HostedSignalControl],
    })
    class HostedControlComponent {
      readonly control = inject(HostedSignalControl);
    }

    @Component({
      template: `<hosted-signal-control [formNode]="name" />`,
      standalone: true,
      imports: [HostedControlComponent, FormNode],
    })
    class Host {
      name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const component = fixture.debugElement.children[0]!.componentInstance as HostedControlComponent;
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('David');

    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.name()).toBe('Mark');
    fixture.componentInstance.name.markAsTouched();
    fixture.detectChanges();
    expect(component.control.touched()).toBe(true);
  });

  it('supports an explicitly provided signal control through transitive host directives', () => {
    @Directive({
      standalone: true,
      providers: [provideFormNodeControl(() => TransitiveSignalControl)],
    })
    class TransitiveSignalControl {
      value = model('');
      required = input(false);
    }

    @Directive({
      standalone: true,
      hostDirectives: [TransitiveSignalControl],
    })
    class SignalControlBridge {}

    @Component({
      selector: 'transitive-signal-control',
      template: `<button type="button" (click)="control.value.set('Mark')">{{ control.value() }}</button>`,
      standalone: true,
      hostDirectives: [SignalControlBridge],
    })
    class TransitiveControlComponent {
      readonly control = inject(TransitiveSignalControl);
    }

    @Component({
      template: `<transitive-signal-control [formNode]="name" />`,
      standalone: true,
      imports: [TransitiveControlComponent, FormNode],
    })
    class Host {
      name = field('David', [required], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const component = fixture.debugElement.children[0]!.componentInstance as TransitiveControlComponent;
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('David');
    expect(component.control.required()).toBe(true);

    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.name()).toBe('Mark');
  });

  it('prefers a ControlValueAccessor over an explicit signal-control provider', () => {
    @Component({
      selector: 'combined-control',
      template: '',
      standalone: true,
      providers: [
        provideFormNodeControl(() => CombinedControl),
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CombinedControl), multi: true },
      ],
    })
    class CombinedControl implements ControlValueAccessor {
      value = model('signal initial');
      writes: unknown[] = [];
      writeValue(value: unknown) { this.writes.push(value); }
      registerOnChange() {}
      registerOnTouched() {}
    }

    @Component({
      template: `<combined-control [formNode]="name" />`,
      standalone: true,
      imports: [CombinedControl, FormNode],
    })
    class Host {
      name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as CombinedControl;
    expect(control.writes).toEqual(['David']);
    expect(control.value()).toBe('signal initial');
  });

  it('binds a native control alongside a directive that injects ViewContainerRef', () => {
    @Directive({
      selector: 'input[withViewContainer]',
      standalone: true,
    })
    class WithViewContainer {
      readonly viewContainerRef = inject(ViewContainerRef);
    }

    @Component({
      template: `<input withViewContainer [formNode]="name">`,
      standalone: true,
      imports: [WithViewContainer, FormNode],
    })
    class Host {
      name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const inputElement = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(inputElement.value).toBe('David');
    inputElement.value = 'Mark';
    inputElement.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.name()).toBe('Mark');
  });

  it('creates and binds a native control while a macrotask is active', async () => {
    let resolveCreation!: () => void;
    const creation = new Promise<void>((resolve) => { resolveCreation = resolve; });

    @Component({
      template: `<select [formNode]="country"><option value="ch">Switzerland</option></select>`,
      standalone: true,
      imports: [FormNode],
    })
    class DynamicForm {
      country = field('ch', { nullable: false });
    }

    @Component({
      template: '',
      standalone: true,
    })
    class Host {
      private readonly viewContainerRef = inject(ViewContainerRef);
      constructor() {
        creation.then(() => this.viewContainerRef.createComponent(DynamicForm));
      }
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    resolveCreation();
    await fixture.whenStable();
    const selectElement = fixture.debugElement.parent!.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(selectElement.value).toBe('ch');
  });

  it('supports a signal-based CVA without creating reactive write errors', () => {
    @Component({
      selector: 'signal-cva',
      template: '',
      standalone: true,
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SignalCva), multi: true }],
    })
    class SignalCva implements ControlValueAccessor {
      readonly value = signal<unknown>(undefined);
      readonly disabled = signal(false);
      change = (_value: unknown) => {};
      writeValue(value: unknown) { this.value.set(value); }
      registerOnChange(callback: (value: unknown) => void) { this.change = callback; }
      registerOnTouched() {}
      setDisabledState(disabled: boolean) { this.disabled.set(disabled); }
    }

    @Component({
      selector: 'signal-cva-host',
      template: `<signal-cva [formNode]="name" />`,
      standalone: true,
      imports: [FormNode, SignalCva],
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    expect(() => fixture.detectChanges()).not.toThrow();
    const cva = fixture.debugElement.children[0]!.componentInstance as SignalCva;

    expect(cva.value()).toBe('David');
    fixture.componentInstance.name.disable();
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(cva.disabled()).toBe(true);
  });

  it('cleans up and reconnects a CVA when its host is destroyed and recreated', () => {
    const instances: RecreatedCva[] = [];

    @Component({
      selector: 'recreated-cva',
      template: '',
      standalone: true,
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RecreatedCva), multi: true }],
    })
    class RecreatedCva implements ControlValueAccessor {
      change = (_value: unknown) => {};
      touch = () => {};
      writes: unknown[] = [];
      constructor() { instances.push(this); }
      writeValue(value: unknown) { this.writes.push(value); }
      registerOnChange(callback: (value: unknown) => void) { this.change = callback; }
      registerOnTouched(callback: () => void) { this.touch = callback; }
    }

    @Component({
      selector: 'recreated-cva-host',
      template: `@if (visible()) { <recreated-cva [formNode]="name" /> }`,
      standalone: true,
      imports: [FormNode, RecreatedCva],
    })
    class Host {
      readonly visible = signal(true);
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const first = instances[0]!;

    fixture.componentInstance.visible.set(false);
    fixture.detectChanges();
    first.change('ignored');
    first.touch();
    expect(fixture.componentInstance.name()).toBe('David');
    expect(fixture.componentInstance.name.touched()).toBe(false);

    fixture.componentInstance.name.set('Mark');
    fixture.componentInstance.visible.set(true);
    fixture.detectChanges();
    const second = instances[1]!;

    expect(second).not.toBe(first);
    expect(second.writes).toEqual(['Mark']);
    second.change('Lia');
    second.touch();
    expect(fixture.componentInstance.name()).toBe('Lia');
    expect(fixture.componentInstance.name.touched()).toBe(true);
  });

  it('re-evaluates object legacy validators only after their change callback is invoked', () => {
    @Component({
      selector: 'dynamic-validator-cva',
      template: '',
      standalone: true,
      providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DynamicValidatorCva), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => DynamicValidatorCva), multi: true },
      ],
    })
    class DynamicValidatorCva implements ControlValueAccessor, Validator {
      reject = false;
      validatorChange = () => {};
      writeValue() {}
      registerOnChange() {}
      registerOnTouched() {}
      validate(): ValidationErrors | null { return this.reject ? { dynamicLegacy: true } : null; }
      registerOnValidatorChange(callback: () => void) { this.validatorChange = callback; }
    }

    @Component({
      selector: 'dynamic-validator-host',
      template: `<dynamic-validator-cva [formNode]="name" />`,
      standalone: true,
      imports: [FormNode, DynamicValidatorCva],
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const cva = fixture.debugElement.children[0]!.componentInstance as DynamicValidatorCva;

    cva.reject = true;
    fixture.detectChanges();
    expect(fixture.componentInstance.name.valid()).toBe(true);

    cva.validatorChange();
    fixture.detectChanges();
    expect(fixture.componentInstance.name.getError('dynamicLegacy')?.kind).toBe('dynamicLegacy');

    cva.reject = false;
    cva.validatorChange();
    fixture.detectChanges();
    expect(fixture.componentInstance.name.valid()).toBe(true);
  });

  it('adapts function-based legacy validators', () => {
    const legacyValidator = (control: AbstractControl): ValidationErrors | null =>
      control.value === 'invalid' ? { legacyFunction: true } : null;

    @Component({
      selector: 'function-validator-cva',
      template: '',
      standalone: true,
      providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FunctionValidatorCva), multi: true },
        { provide: NG_VALIDATORS, useValue: legacyValidator, multi: true },
      ],
    })
    class FunctionValidatorCva implements ControlValueAccessor {
      change = (_value: unknown) => {};
      writeValue() {}
      registerOnChange(callback: (value: unknown) => void) { this.change = callback; }
      registerOnTouched() {}
    }

    @Component({
      selector: 'function-validator-host',
      template: `<function-validator-cva [formNode]="name" />`,
      standalone: true,
      imports: [FormNode, FunctionValidatorCva],
    })
    class Host {
      readonly name = field('valid', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const cva = fixture.debugElement.children[0]!.componentInstance as FunctionValidatorCva;
    cva.change('invalid');
    expect(fixture.componentInstance.name.getError('legacyFunction')?.kind).toBe('legacyFunction');
  });
});

describe('native control conversion', () => {
  it('recognizes only native form elements', () => {
    expect(isNativeFormNodeControl(document.createElement('input'))).toBe(true);
    expect(isNativeFormNodeControl(document.createElement('select'))).toBe(true);
    expect(isNativeFormNodeControl(document.createElement('textarea'))).toBe(true);
    expect(isNativeFormNodeControl(document.createElement('div'))).toBe(false);
  });

  it('reads text, fallback, checkbox, radio, and multiple-select values', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'notes';
    expect(readNativeControlValue(textarea, () => null)).toBe('notes');

    const email = document.createElement('input');
    email.type = 'email';
    email.value = 'a@example.com';
    expect(readNativeControlValue(email, () => null)).toBe('a@example.com');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    expect(readNativeControlValue(checkbox, () => false)).toBe(true);

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.value = 'Madrid';
    expect(readNativeControlValue(radio, () => 'Zurich')).toBe('Zurich');
    radio.checked = true;
    expect(readNativeControlValue(radio, () => 'Zurich')).toBe('Madrid');

    const select = document.createElement('select');
    select.multiple = true;
    select.append(new Option('Madrid', 'mad', true, true), new Option('Zurich', 'zrh', true, true));
    expect(readNativeControlValue(select, () => [])).toEqual(['mad', 'zrh']);
  });

  it('reads numeric controls according to the current model type', () => {
    for (const type of ['number', 'range', 'datetime-local']) {
      const input = document.createElement('input');
      input.type = type;
      input.value = type === 'datetime-local' ? '2026-08-27T12:30' : '42';
      expect(typeof readNativeControlValue(input, () => 0)).toBe('number');
      expect(readNativeControlValue(input, () => '0')).toBe(input.value);
      input.value = '';
      if (type === 'range') expect(readNativeControlValue(input, () => null)).toBe(50);
      else expect(readNativeControlValue(input, () => null)).toBeNull();
    }
  });

  it('reads date-like controls as Date, number, or string according to the model', () => {
    for (const [type, value] of [['date', '2026-08-27'], ['month', '2026-08'], ['time', '12:30'], ['week', '2026-W35']] as const) {
      const input = document.createElement('input');
      input.type = type;
      input.value = value;
      expect(readNativeControlValue(input, () => new Date())).toBeTruthy();
      expect(typeof readNativeControlValue(input, () => 0)).toBe('number');
      expect(readNativeControlValue(input, () => '')).toBe(value);
    }
  });

  it('parses numeric text while retaining the current value for invalid input', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = '42';
    expect(readNativeControlValue(input, () => 0)).toBe(42);
    expect(readNativeControlValue(input, () => '')).toBe('42');
    input.value = '';
    expect(readNativeControlValue(input, () => null)).toBeNull();
    input.value = 'invalid';
    expect(readNativeControlValue(input, () => 23)).toBe(23);
  });

  it('reports numeric text and browser bad-input parse failures', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = 'invalid';
    expect(parseNativeControlValue(input, () => 23)).toEqual({ error: { kind: 'parse' } });
    input.value = '42';
    expect(parseNativeControlValue(input, () => 23)).toEqual({ value: 42 });

    Object.defineProperty(input, 'validity', { configurable: true, value: { badInput: true } });
    expect(parseNativeControlValue(input, () => 23)).toEqual({ error: { kind: 'parse' } });
    Object.defineProperty(input, 'validity', { configurable: true, value: { badInput: false } });
    input.value = 'invalid';
    expect(parseNativeControlValue(input, () => null)).toEqual({ error: { kind: 'parse' } });
  });

  it('writes all supported native value representations', () => {
    const textarea = document.createElement('textarea');
    writeNativeControlValue(textarea, null);
    expect(textarea.value).toBe('');
    writeNativeControlValue(textarea, 'notes');
    expect(textarea.value).toBe('notes');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    writeNativeControlValue(checkbox, 1);
    expect(checkbox.checked).toBe(true);

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.value = 'Madrid';
    writeNativeControlValue(radio, 'Zurich');
    expect(radio.checked).toBe(false);
    writeNativeControlValue(radio, 'Madrid');
    expect(radio.checked).toBe(true);

    for (const type of ['number', 'range', 'datetime-local']) {
      const input = document.createElement('input');
      input.type = type;
      writeNativeControlValue(input, 42);
      expect(input.valueAsNumber).toBe(42);
      writeNativeControlValue(input, Number.NaN);
      if (type === 'range') expect(input.value).toBe('50');
      else expect(input.value).toBe('');
      writeNativeControlValue(input, null);
      if (type === 'range') expect(input.value).toBe('50');
      else expect(input.value).toBe('');
      writeNativeControlValue(input, type === 'datetime-local' ? '2026-08-27T12:30' : '12');
      expect(input.value).not.toBe('');
    }

    for (const type of ['date', 'month', 'time', 'week']) {
      const input = document.createElement('input');
      input.type = type;
      writeNativeControlValue(input, 0);
      expect(Number.isNaN(input.valueAsNumber)).toBe(false);
      writeNativeControlValue(input, null);
      expect(input.value).toBe('');
      writeNativeControlValue(input, undefined);
      expect(input.value).toBe('');
      const stringValue = type === 'date' ? '2026-08-27' : type === 'month' ? '2026-08' : type === 'time' ? '12:30' : '2026-W35';
      writeNativeControlValue(input, stringValue);
      expect(input.value).toBe(stringValue);
    }

    const email = document.createElement('input');
    email.type = 'email';
    writeNativeControlValue(email, null);
    expect(email.value).toBe('');

    const select = document.createElement('select');
    select.multiple = true;
    select.append(new Option('One', '1'), new Option('Two', '2'));
    writeNativeControlValue(select, [2]);
    expect(Array.from(select.selectedOptions, option => option.value)).toEqual(['2']);
    writeNativeControlValue(select, null);
    expect(select.selectedOptions).toHaveLength(0);
  });
});

describe('FormNodeNgControl', () => {
  it('projects field state through the Angular control compatibility surface', () => {
    const name = field('', [required], { nullable: false });
    const control = new FormNodeNgControl(() => name as Field<unknown>);

    expect(control.control).toBe(control);
    expect(control.value).toBe('');
    expect(control.valid).toBe(false);
    expect(control.invalid).toBe(true);
    expect(control.pending).toBe(false);
    expect(control.disabled).toBe(false);
    expect(control.enabled).toBe(true);
    expect(control.errors?.['required']).toMatchObject({ kind: 'required', targetNode: name });
    expect(control.pristine).toBe(true);
    expect(control.dirty).toBe(false);
    expect(control.touched).toBe(false);
    expect(control.untouched).toBe(true);
    expect(control.status).toBe('INVALID');
    expect(control.hasValidator(Validators.required)).toBe(true);
    expect(control.hasValidator(Validators.email)).toBe(false);

    name.setControlValue('David');
    name.markAsTouched();
    expect(control.value).toBe('David');
    expect(control.valid).toBe(true);
    expect(control.errors).toBeNull();
    expect(control.dirty).toBe(true);
    expect(control.pristine).toBe(false);
    expect(control.touched).toBe(true);
    expect(control.untouched).toBe(false);
    expect(control.status).toBe('VALID');

    name.disable();
    expect(control.disabled).toBe(true);
    expect(control.enabled).toBe(false);
    expect(control.status).toBe('DISABLED');
    expect(() => control.updateValueAndValidity()).not.toThrow();
  });

  it('reports pending when no terminal validation status is available', () => {
    const pendingNode = {
      $api: {
        disabled: () => false,
        valid: () => false,
        invalid: () => false,
        pending: () => true,
      },
    } as unknown as Node;
    expect(new FormNodeNgControl(() => pendingNode).status).toBe('PENDING');
  });
});
