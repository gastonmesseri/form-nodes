// @vitest-environment jsdom

import '@angular/compiler';
import { Component, Injector, input, model, output, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form as createAngularForm, provideSignalFormsConfig, transformedValue, type FormValueControl } from '@angular/forms/signals';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { array } from '../primitives/array';
import { field } from '../primitives/field';
import { max } from '../validation/validators/max';
import { min } from '../validation/validators/min';
import { getAngularField } from './angular-field';
import type { InternalNode } from '../types/node.type';
import { required } from '../validation/validators/required';
import { maxDate } from '../validation/validators/max-date';
import { minDate } from '../validation/validators/min-date';
import { pattern } from '../validation/validators/pattern';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import { maxLength } from '../validation/validators/max-length';
import { minLength } from '../validation/validators/min-length';
import { provideFormNodeConfig } from '../directives/form-node/form-node-config';
import { registerSignalInputForJit, registerSignalModelForJit, registerSignalOutputForJit } from '../../../../tests/helpers/register-signal-input-for-jit';

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('Angular Signal Forms field adapter', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });
  it('exposes one stable Angular field tree for a form and its children', () => {
    const injector = TestBed.inject(Injector);
    const profile = runInInjectionContext(injector, () => form({
      name: field('David'),
      age: field(30),
    }));

    expect(getAngularField<{ name: string | null; age: number | null }>(profile).name).toBe(getAngularField(profile.name));
    expect(getAngularField<{ name: string | null; age: number | null }>(profile).name().value()).toBe('David');
    expect(profile.name.$field).toBe(profile.name.$field);
  });

  it('synchronizes values in both directions', () => {
    const injector = TestBed.inject(Injector);
    const profile = runInInjectionContext(injector, () => form({ name: field('David') }));

    profile.name.set('Ana');
    TestBed.flushEffects();
    expect(getAngularField<string | null>(profile.name)().value()).toBe('Ana');

    getAngularField<string | null>(profile.name)().value.set('Mark');
    TestBed.flushEffects();
    expect(profile.name()).toBe('Mark');
  });

  it('gives a bound control edit deterministic precedence over a simultaneous node write', () => {
    @Component({
      template: `<input [formField]="name.$field">`,
      imports: [FormField],
    })
    class Host {
      name = field('David');
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const name = fixture.componentInstance.name;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const internalName = name as unknown as InternalNode;
    const setControlValue = vi.spyOn(internalName.$api, '_setControlValue');

    name.set('Programmatic');
    input.value = 'Control edit';
    input.dispatchEvent(new Event('input'));
    TestBed.flushEffects();

    expect(name()).toBe('Control edit');
    expect(name.controlValue()).toBe('Control edit');
    expect(input.value).toBe('Control edit');
    expect(setControlValue).toHaveBeenCalledTimes(1);
    expect(setControlValue).toHaveBeenCalledWith('Control edit');

    TestBed.flushEffects();
    fixture.detectChanges();

    expect(name()).toBe('Control edit');
    expect(input.value).toBe('Control edit');
    expect(setControlValue).toHaveBeenCalledTimes(1);

    input.value = 'Later control edit';
    input.dispatchEvent(new Event('input'));
    name.set('Later programmatic write');
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(name()).toBe('Later control edit');
    expect(input.value).toBe('Later control edit');
    expect(setControlValue).toHaveBeenCalledTimes(2);

    TestBed.flushEffects();
    expect(setControlValue).toHaveBeenCalledTimes(2);
  });

  it('mirrors availability, required, validation, and interaction state', () => {
    const injector = TestBed.inject(Injector);
    const name = runInInjectionContext(injector, () => field('', [required]));
    const angularState = getAngularField<string | null>(name)();

    expect(angularState.required()).toBe(true);
    expect(angularState.invalid()).toBe(true);
    name.disable('Unavailable');
    expect(angularState.disabled()).toBe(true);
    name.enable();

    angularState.markAsTouched();
    angularState.markAsDirty();
    TestBed.flushEffects();
    expect(name.touched()).toBe(true);
    expect(name.dirty()).toBe(true);

    name.markAsUntouched();
    name.markAsPristine();
    TestBed.flushEffects();
    expect(angularState.touched()).toBe(false);
    expect(angularState.dirty()).toBe(false);

    name.markAsTouched();
    name.markAsDirty();
    TestBed.flushEffects();
    expect(angularState.touched()).toBe(true);
    expect(angularState.dirty()).toBe(true);
  });

  it('synchronizes touched and dirty independently in both directions', () => {
    const injector = TestBed.inject(Injector);
    const name = runInInjectionContext(injector, () => field('David'));
    const angularState = getAngularField<string | null>(name)();

    angularState.markAsTouched();
    TestBed.flushEffects();
    expect(name.touched()).toBe(true);
    expect(name.dirty()).toBe(false);

    angularState.markAsDirty();
    TestBed.flushEffects();
    expect(name.touched()).toBe(true);
    expect(name.dirty()).toBe(true);

    angularState.reset();
    TestBed.flushEffects();
    expect(name.touched()).toBe(false);
    expect(name.dirty()).toBe(false);

    name.markAsTouched();
    name.markAsDirty();
    TestBed.flushEffects();
    expect(angularState.touched()).toBe(true);
    expect(angularState.dirty()).toBe(true);

    name.markAsUntouched();
    TestBed.flushEffects();
    expect(angularState.touched()).toBe(false);
    expect(angularState.dirty()).toBe(true);

    name.markAsTouched();
    name.markAsPristine();
    TestBed.flushEffects();
    expect(angularState.touched()).toBe(true);
    expect(angularState.dirty()).toBe(false);
  });

  it('synchronizes aggregate interaction state across ancestors and descendants', () => {
    const injector = TestBed.inject(Injector);
    const profile = runInInjectionContext(injector, () => form({
      name: field('David'),
      address: {
        city: field('Zurich'),
      },
    }));
    const angularProfile = getAngularField<{
      name: string | null;
      address: { city: string | null };
    }>(profile);

    angularProfile.address.city().markAsTouched();
    angularProfile.address.city().markAsDirty();
    TestBed.flushEffects();

    expect(profile.address.city.touched()).toBe(true);
    expect(profile.address.touched()).toBe(true);
    expect(profile.touched()).toBe(true);
    expect(profile.address.city.dirty()).toBe(true);
    expect(profile.address.dirty()).toBe(true);
    expect(profile.dirty()).toBe(true);

    profile.reset();
    TestBed.flushEffects();

    expect(angularProfile().touched()).toBe(false);
    expect(angularProfile.address().touched()).toBe(false);
    expect(angularProfile.address.city().touched()).toBe(false);
    expect(angularProfile().dirty()).toBe(false);
    expect(angularProfile.address().dirty()).toBe(false);
    expect(angularProfile.address.city().dirty()).toBe(false);

    profile.markAsTouched();
    TestBed.flushEffects();

    expect(angularProfile().touched()).toBe(true);
    expect(angularProfile.name().touched()).toBe(true);
    expect(angularProfile.address().touched()).toBe(true);
    expect(angularProfile.address.city().touched()).toBe(true);

    profile.reset();
    profile.markAsTouched({ skipDescendants: true });
    profile.markAsDirty();
    TestBed.flushEffects();

    expect(angularProfile().touched()).toBe(true);
    expect(angularProfile.name().touched()).toBe(false);
    expect(angularProfile.address().touched()).toBe(false);
    expect(angularProfile().dirty()).toBe(true);
    expect(angularProfile.name().dirty()).toBe(false);

    profile.reset();
    TestBed.flushEffects();
    angularProfile().markAsTouched();
    angularProfile().markAsDirty();
    TestBed.flushEffects();

    expect(profile.touched()).toBe(true);
    expect(profile.name.touched()).toBe(true);
    expect(profile.address.touched()).toBe(true);
    expect(profile.address.city.touched()).toBe(true);
    expect(profile.dirty()).toBe(true);
    expect(profile.name.dirty()).toBe(false);
  });

  it('preserves interaction state across non-interactive transitions and existing array items', () => {
    const injector = TestBed.inject(Injector);
    const tags = runInInjectionContext(injector, () => array(field(''), {
      initialValue: ['angular', 'signals'],
    }));
    const angularTags = getAngularField<(string | null)[]>(tags);

    angularTags[1]!().markAsTouched();
    angularTags[1]!().markAsDirty();
    TestBed.flushEffects();

    expect(tags[1]!.touched()).toBe(true);
    expect(tags[1]!.dirty()).toBe(true);
    expect(tags.touched()).toBe(true);
    expect(tags.dirty()).toBe(true);

    tags[1]!.disable('Unavailable');
    TestBed.flushEffects();
    expect(angularTags[1]!().touched()).toBe(false);
    expect(angularTags[1]!().dirty()).toBe(false);

    tags[1]!.enable();
    tags[1]!.markAsReadonly();
    TestBed.flushEffects();
    expect(angularTags[1]!().touched()).toBe(false);
    expect(angularTags[1]!().dirty()).toBe(false);

    tags[1]!.markAsWritable();
    tags[1]!.hide();
    TestBed.flushEffects();
    expect(angularTags[1]!().touched()).toBe(false);
    expect(angularTags[1]!().dirty()).toBe(false);

    tags[1]!.show();
    TestBed.flushEffects();
    expect(angularTags[1]!().touched()).toBe(true);
    expect(angularTags[1]!().dirty()).toBe(true);

    angularTags().reset();
    TestBed.flushEffects();
    expect(tags.touched()).toBe(false);
    expect(tags.dirty()).toBe(false);
    expect(tags[1]!.touched()).toBe(false);
    expect(tags[1]!.dirty()).toBe(false);
  });

  it('keeps availability derived from the library node', () => {
    const injector = TestBed.inject(Injector);
    const name = runInInjectionContext(injector, () => field('David'));
    const angularState = getAngularField<string | null>(name)();

    name.disable('Unavailable');
    expect(angularState.disabled()).toBe(true);
    name.enable();
    expect(angularState.disabled()).toBe(false);

    name.markAsReadonly();
    expect(angularState.readonly()).toBe(true);
    name.markAsWritable();
    expect(angularState.readonly()).toBe(false);

    name.hide();
    expect(angularState.hidden()).toBe(true);
    name.show();
    expect(angularState.hidden()).toBe(false);
  });

  it('mirrors reactive numeric, date, length, and pattern constraints without duplicating errors', () => {
    const minimum = signal(2);
    const maximum = signal(10);
    const minimumLength = signal(2);
    const activePattern = signal<RegExp | undefined>(/^[a-z]+$/);
    const firstDate = new Date('2026-01-01T00:00:00.000Z');
    const lastDate = new Date('2026-12-31T00:00:00.000Z');
    const injector = TestBed.inject(Injector);
    const profile = runInInjectionContext(injector, () => form({
      amount: field(5, [min(() => minimum()), max(() => maximum())]),
      code: field('abc', [minLength(() => minimumLength()), maxLength(8), pattern(() => activePattern()), pattern(/^.{3}$/)]),
      departure: field<Date>(null, [minDate(firstDate), maxDate(lastDate)]),
    }));
    const angularProfile = getAngularField<{
      amount: number | null;
      code: string | null;
      departure: Date | null;
    }>(profile);

    expect(angularProfile.amount().min!()).toBe(2);
    expect(angularProfile.amount().max!()).toBe(10);
    expect(angularProfile.code().minLength!()).toBe(2);
    expect(angularProfile.code().maxLength!()).toBe(8);
    expect(angularProfile.code().pattern()).toEqual([/^[a-z]+$/, /^.{3}$/]);
    expect(angularProfile.departure().min!()).toEqual(firstDate);
    expect(angularProfile.departure().max!()).toEqual(lastDate);
    expect(angularProfile.amount().errors()).toEqual([]);

    minimum.set(6);
    maximum.set(9);
    minimumLength.set(4);
    activePattern.set(undefined);

    expect(angularProfile.amount().min!()).toBe(6);
    expect(angularProfile.amount().max!()).toBe(9);
    expect(angularProfile.code().minLength!()).toBe(4);
    expect(angularProfile.code().pattern()).toEqual([/^.{3}$/]);
    expect(angularProfile.amount().errors().map(error => error.kind)).toEqual(['min']);
  });

  it('provides Gem constraints to formField custom-control inputs', () => {
    @Component({
      selector: 'constraint-control',
      template: '',
    })
    class ConstraintControl {
      value = input<string | null>('');
      valueChange = output<string | null>();
      minLength = input<number | undefined>();
      maxLength = input<number | undefined>();
      pattern = input<readonly RegExp[]>([]);
    }
    registerSignalModelForJit(ConstraintControl, 'value');
    registerSignalInputForJit(ConstraintControl, 'minLength', 'minLength');
    registerSignalInputForJit(ConstraintControl, 'maxLength', 'maxLength');
    registerSignalInputForJit(ConstraintControl, 'pattern', 'pattern');

    const minimumLength = signal(2);
    const expression = signal<RegExp | undefined>(/^[a-z]+$/);
    @Component({
      template: `<constraint-control [formField]="code.$field" />`,
      imports: [ConstraintControl, FormField],
    })
    class Host {
      code = field('abc', [minLength(() => minimumLength()), maxLength(8), pattern(() => expression())]);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as ConstraintControl;

    expect(control.minLength()).toBe(2);
    expect(control.maxLength()).toBe(8);
    expect(control.pattern()).toEqual([/^[a-z]+$/]);

    minimumLength.set(3);
    expression.set(undefined);
    fixture.detectChanges();

    expect(control.minLength()).toBe(3);
    expect(control.maxLength()).toBe(8);
    expect(control.pattern()).toEqual([]);
  });

  it('maps existing array item nodes into the shared Angular tree', () => {
    const injector = TestBed.inject(Injector);
    const tags = runInInjectionContext(injector, () => array(field(''), {
      initialValue: ['angular'],
    }));

    expect(getAngularField(tags[0]!)).toBe(getAngularField<(string | null)[]>(tags)[0]);
    expect(getAngularField<(string | null)[]>(tags)[0]!().value()).toBe('angular');
  });

  it('remains lazy and reports how to opt in outside Angular injection', () => {
    const name = field('David');

    expect(name()).toBe('David');
    expect(() => name.$field).toThrow(/injection context|injector/);
  });

  it('binds naturally through the Angular formField directive', () => {
    @Component({
      template: `<input [formField]="profile.name.$field">`,
      imports: [FormField],
    })
    class Host {
      profile = form({ name: field('David') });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('David');
    input.value = 'Ana';
    input.dispatchEvent(new Event('input'));
    TestBed.flushEffects();
    expect(host.profile.name()).toBe('Ana');

    host.profile.name.set('Mark');
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(input.value).toBe('Mark');
  });

  it('propagates native parsing errors into node validation and removes binding-owned errors', () => {
    @Component({
      template: `
        <input id="first" [formField]="age.$field">
        @if (showSecond()) {
          <input id="second" [formField]="age.$field">
        }
      `,
      imports: [FormField],
    })
    class Host {
      age = field(5);
      showSecond = signal(true);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const first = fixture.nativeElement.querySelector('#first') as HTMLInputElement;
    const second = fixture.nativeElement.querySelector('#second') as HTMLInputElement;

    first.value = 'invalid';
    first.dispatchEvent(new Event('input'));
    second.value = 'also invalid';
    second.dispatchEvent(new Event('input'));
    TestBed.flushEffects();

    const parseErrors = host.age.errors().filter(error => error.kind === 'parse');
    expect(host.age()).toBe(5);
    expect(host.age.invalid()).toBe(true);
    expect(host.age.allErrors()).toHaveLength(2);
    expect(parseErrors).toHaveLength(2);
    expect(parseErrors.map(error => error.formNode?.element)).toEqual([first, second]);

    host.showSecond.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.age.errors().filter(error => error.kind === 'parse')).toHaveLength(1);

    first.value = '12';
    first.dispatchEvent(new Event('input'));
    TestBed.flushEffects();
    expect(host.age()).toBe(12);
    expect(host.age.errors().filter(error => error.kind === 'parse')).toEqual([]);
    expect(host.age.valid()).toBe(true);
  });

  it('propagates custom-control parsing and touch through formField', async () => {
    @Component({
      selector: 'numeric-control',
      template: `<input [value]="rawValue()" (input)="updateRawValue($event)" (blur)="touch.emit()">`,
    })
    class NumericControl implements FormValueControl<number | null> {
      value = model<number | null>(null);
      valueChange = output<number | null>();
      touch = output<void>();
      protected rawValue = transformedValue(this.value, {
        parse: (rawValue) => {
          const value = Number(rawValue);
          return Number.isNaN(value)
            ? { error: { kind: 'parse', message: `${rawValue} is not numeric` } }
            : { value };
        },
        format: value => value?.toString() ?? '',
      });

      updateRawValue(event: Event) {
        this.rawValue.set((event.target as HTMLInputElement).value);
        if (this.rawValue.parseErrors().length === 0) this.valueChange.emit(this.value());
      }
    }
    registerSignalModelForJit(NumericControl, 'value');
    registerSignalOutputForJit(NumericControl, 'touch');

    const action = vi.fn();
    @Component({
      template: `<numeric-control [formField]="profile.age.$field" />`,
      imports: [NumericControl, FormField],
    })
    class Host {
      profile = form({
        age: field(5),
      }, {
        submission: { action },
      });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const inputElement = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    inputElement.value = 'invalid';
    inputElement.dispatchEvent(new Event('input'));
    inputElement.dispatchEvent(new Event('blur'));
    TestBed.flushEffects();

    expect(fixture.componentInstance.profile.age()).toBe(5);
    expect(fixture.componentInstance.profile.age.touched()).toBe(true);
    expect(fixture.componentInstance.profile.age.getError('parse')?.message).toBe('invalid is not numeric');
    expect(await fixture.componentInstance.profile.submit()).toBe(false);
    expect(action).not.toHaveBeenCalled();

    inputElement.value = '18';
    inputElement.dispatchEvent(new Event('input'));
    TestBed.flushEffects();
    expect(fixture.componentInstance.profile.age()).toBe(18);
    expect(fixture.componentInstance.profile.age.getError('parse')).toBeUndefined();
    expect(await fixture.componentInstance.profile.submit()).toBe(true);
    expect(action).toHaveBeenCalledOnce();
  });

  it('registers formField controls for node focus in DOM order and unregisters destroyed bindings', () => {
    @Component({
      template: `
        @if (showFirst()) {
          <input class="first" [formField]="name.$field">
        }
        <input class="second" [formField]="name.$field">
      `,
      imports: [FormField],
    })
    class Host {
      name = field('David');
      showFirst = signal(true);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    const host = fixture.componentInstance;
    const first = fixture.nativeElement.querySelector('.first') as HTMLInputElement;
    const second = fixture.nativeElement.querySelector('.second') as HTMLInputElement;

    host.name.focus({ preventScroll: true });
    expect(document.activeElement).toBe(first);

    host.showFirst.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    host.name.focus();

    expect(document.activeElement).toBe(second);
  });

  it('moves focus registration when a formField binding is rebound to another node', () => {
    @Component({
      template: `<input [formField]="selected().$field">`,
      imports: [FormField],
    })
    class Host {
      first = field('First');
      second = field('Second');
      selected = signal(this.first);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    const host = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    host.first.focus();
    expect(document.activeElement).toBe(input);
    input.blur();

    host.selected.set(host.second);
    fixture.detectChanges();
    TestBed.flushEffects();
    host.first.focus();
    expect(document.activeElement).not.toBe(input);

    host.second.focus();
    expect(document.activeElement).toBe(input);
  });

  it('preserves the custom focus implementation exposed through Angular formField', () => {
    @Component({
      selector: 'custom-control',
      template: '',
    })
    class CustomControl {
      value = input<string | null>('');
      valueChange = output<string | null>();
      focus = vi.fn<(options?: FocusOptions) => void>();
    }
    registerSignalModelForJit(CustomControl, 'value');

    @Component({
      template: `<custom-control [formField]="name.$field" />`,
      imports: [CustomControl, FormField],
    })
    class Host {
      name = field('David');
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    const control = fixture.debugElement.children[0]!.componentInstance as CustomControl;
    const options = { preventScroll: true };

    fixture.componentInstance.name.focus(options);

    expect(control.focus).toHaveBeenCalledOnce();
    expect(control.focus).toHaveBeenCalledWith(options);
  });

  it('propagates node subtree resets to control hooks and cancels pending debounce', () => {
    @Component({
      selector: 'resettable-control',
      template: '',
    })
    class ResettableControl {
      value = input<string | null>('');
      valueChange = output<string | null>();
      reset = vi.fn<() => void>();
    }
    registerSignalModelForJit(ResettableControl, 'value');

    @Component({
      template: `<resettable-control [formField]="profile.name.$field" />`,
      imports: [ResettableControl, FormField],
    })
    class Host {
      profile = form({
        name: field('David', { debounce: 'blur' }),
      });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    const profile = fixture.componentInstance.profile;
    const control = fixture.debugElement.children[0]!.componentInstance as ResettableControl;
    const angularProfile = getAngularField<{ name: string | null }>(profile);

    control.valueChange.emit('Pending');
    TestBed.flushEffects();
    expect(profile.name()).toBe('David');
    expect(profile.name.controlValue()).toBe('Pending');
    expect(profile.name.debouncing()).toBe(true);

    profile.reset({ name: 'Library reset' });
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(profile.name()).toBe('Library reset');
    expect(profile.name.controlValue()).toBe('Library reset');
    expect(profile.name.debouncing()).toBe(false);
    expect(angularProfile.name().value()).toBe('Library reset');
    expect(angularProfile.name().controlValue()).toBe('Library reset');
    expect(control.value()).toBe('Library reset');
    expect(control.reset).toHaveBeenCalledTimes(1);

    control.valueChange.emit('Another pending value');
    TestBed.flushEffects();
    expect(profile.name.debouncing()).toBe(true);

    profile.name.reset();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(profile.name()).toBe('Library reset');
    expect(profile.name.controlValue()).toBe('Library reset');
    expect(profile.name.debouncing()).toBe(false);
    expect(control.value()).toBe('Library reset');
    expect(control.reset).toHaveBeenCalledTimes(2);
  });

  it('routes formField input through numeric node debounce', () => {
    vi.useFakeTimers();

    @Component({
      template: `<input [formField]="name.$field">`,
      imports: [FormField],
    })
    class Host {
      name = field('David', { debounce: 100 });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const name = fixture.componentInstance.name;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'Ana';
    input.dispatchEvent(new Event('input'));
    TestBed.flushEffects();

    expect(name()).toBe('David');
    expect(name.controlValue()).toBe('Ana');
    expect(name.debouncing()).toBe(true);
    expect(name.dirty()).toBe(true);
    expect(input.value).toBe('Ana');

    vi.advanceTimersByTime(100);
    TestBed.flushEffects();

    expect(name()).toBe('Ana');
    expect(name.debouncing()).toBe(false);

    input.value = 'Lea';
    input.dispatchEvent(new Event('input'));
    TestBed.flushEffects();
    name.flush();
    TestBed.flushEffects();
    expect(name()).toBe('Lea');

    input.value = 'Mia';
    input.dispatchEvent(new Event('input'));
    TestBed.flushEffects();
    name.set('Mark');
    TestBed.flushEffects();
    fixture.detectChanges();
    vi.advanceTimersByTime(100);

    expect(name()).toBe('Mark');
    expect(name.controlValue()).toBe('Mark');
    expect(name.debouncing()).toBe(false);
    expect(input.value).toBe('Mark');
  });

  it('routes formField input through blur node debounce', () => {
    @Component({
      template: `<input [formField]="name.$field">`,
      imports: [FormField],
    })
    class Host {
      name = field('David', { debounce: 'blur' });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const name = fixture.componentInstance.name;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'Ana';
    input.dispatchEvent(new Event('input'));
    TestBed.flushEffects();

    expect(name()).toBe('David');
    expect(name.controlValue()).toBe('Ana');
    expect(name.debouncing()).toBe(true);

    input.dispatchEvent(new Event('blur'));
    TestBed.flushEffects();

    expect(name()).toBe('Ana');
    expect(name.debouncing()).toBe(false);
    expect(name.touched()).toBe(true);
  });

  it('applies provideFormNodeConfig classes only to formField bindings backed by $field', () => {
    const invalidPredicate = vi.fn((binding: FormNodeBinding) => binding.node().$api.invalid());
    const touchedPredicate = vi.fn((binding: FormNodeBinding) => binding.node().$api.touched());

    @Component({
      template: `
        <input class="adapted" [formField]="name.$field">
        <input class="angular form-invalid" [formField]="angularName">
      `,
      imports: [FormField],
      providers: [provideFormNodeConfig({
        classes: {
          'form-invalid': invalidPredicate,
          'form-touched': touchedPredicate,
        },
      })],
    })
    class Host {
      name = field('', [required]);
      angularName = createAngularForm(signal(''));
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const adaptedInput = fixture.nativeElement.querySelector('.adapted') as HTMLInputElement;
    const angularInput = fixture.nativeElement.querySelector('.angular') as HTMLInputElement;

    expect(adaptedInput.classList.contains('form-invalid')).toBe(true);
    expect(adaptedInput.classList.contains('form-touched')).toBe(false);
    expect(angularInput.classList.contains('form-invalid')).toBe(true);
    expect(angularInput.classList.contains('form-touched')).toBe(false);
    expect(invalidPredicate).toHaveBeenCalledTimes(1);
    expect(touchedPredicate).toHaveBeenCalledTimes(1);
    const adaptedBinding = invalidPredicate.mock.calls[0]![0];
    expect(adaptedBinding.element).toBe(adaptedInput);
    expect(adaptedBinding.node()).toBe(fixture.componentInstance.name);
    expect(adaptedBinding.errors()).toHaveLength(1);
    adaptedBinding.focus({ preventScroll: true });
    expect(document.activeElement).toBe(adaptedInput);
    adaptedBinding.flush();

    fixture.componentInstance.name.markAsTouched();
    fixture.detectChanges();

    expect(adaptedInput.classList.contains('form-touched')).toBe(true);
    expect(touchedPredicate).toHaveBeenCalledTimes(2);
    expect(invalidPredicate).toHaveBeenCalledTimes(1);

    adaptedBinding.reset();
    fixture.detectChanges();

    expect(fixture.componentInstance.name.touched()).toBe(false);
    expect(adaptedInput.classList.contains('form-touched')).toBe(false);
  });

  it('uses classes configured directly through provideSignalFormsConfig', () => {
    @Component({
      template: `<input [formField]="name.$field">`,
      imports: [FormField],
      providers: [provideSignalFormsConfig({
        classes: {
          'angular-invalid': binding => binding.state().invalid(),
          'angular-touched': binding => binding.state().touched(),
        },
      })],
    })
    class Host {
      name = field('', [required]);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.classList.contains('angular-invalid')).toBe(true);
    expect(input.classList.contains('angular-touched')).toBe(false);

    fixture.componentInstance.name.set('David');
    fixture.componentInstance.name.markAsTouched();
    fixture.detectChanges();

    expect(input.classList.contains('angular-invalid')).toBe(false);
    expect(input.classList.contains('angular-touched')).toBe(true);
  });
});
