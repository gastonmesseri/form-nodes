// @vitest-environment jsdom

import '@angular/compiler';
import { Component, Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form as createAngularForm, provideSignalFormsConfig } from '@angular/forms/signals';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { array } from '../primitives/array';
import { field } from '../primitives/field';
import { getAngularField } from './angular-field';
import type { InternalNode } from '../types/node.type';
import { required } from '../validation/validators/required';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import { provideFormNodeConfig } from '../directives/form-node/form-node-config';

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
