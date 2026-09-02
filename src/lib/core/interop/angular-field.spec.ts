// @vitest-environment jsdom

import '@angular/compiler';
import { Component, Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField } from '@angular/forms/signals';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field } from '../primitives/field';
import { form } from '../primitives/form';
import { array } from '../primitives/array';
import { required } from '../validation/validators/required';

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('Angular Signal Forms field adapter', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());
  it('exposes one stable Angular field tree for a form and its children', () => {
    const injector = TestBed.inject(Injector);
    const profile = runInInjectionContext(injector, () => form({
      name: field('David'),
      age: field(30),
    }));

    expect(profile.$field.name).toBe(profile.name.$field);
    expect(profile.$field.name().value()).toBe('David');
    expect(profile.name.$field).toBe(profile.name.$field);
  });

  it('synchronizes values in both directions', () => {
    const injector = TestBed.inject(Injector);
    const profile = runInInjectionContext(injector, () => form({ name: field('David') }));

    profile.name.set('Ana');
    TestBed.flushEffects();
    expect(profile.name.$field().value()).toBe('Ana');

    profile.name.$field().value.set('Mark');
    TestBed.flushEffects();
    expect(profile.name()).toBe('Mark');
  });

  it('mirrors availability, required, validation, and interaction state', () => {
    const injector = TestBed.inject(Injector);
    const name = runInInjectionContext(injector, () => field('', [required]));
    const angularState = name.$field();

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

  it('maps existing array item nodes into the shared Angular tree', () => {
    const injector = TestBed.inject(Injector);
    const tags = runInInjectionContext(injector, () => array(field(''), {
      initialValue: ['angular'],
    }));

    expect(tags[0]!.$field).toBe(tags.$field[0]);
    expect(tags.$field[0]!().value()).toBe('angular');
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
});
