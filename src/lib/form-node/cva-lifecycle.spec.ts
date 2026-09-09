// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Component, forwardRef } from '@angular/core';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { array, field, form, FormNodeDirective, type AnyNode } from '../../../src/public-api';
import { registerSignalInputForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
registerSignalOutputForJit(FormNodeDirective, 'formNodeValueChange');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

@Component({
  selector: 'lifecycle-cva',
  template: '',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Control), multi: true }],
})
class Control {
  view: unknown;

  writes: unknown[] = [];

  disabledWrites: boolean[] = [];

  change = (_value: unknown) => {};

  touch = () => {};

  writeValue(value: unknown) {
    this.view = value;
    this.writes.push(value);
    // A misbehaving accessor must not turn model writes into user edits.
    this.change(value);
  }

  setDisabledState(value: boolean) { this.disabledWrites.push(value); }

  registerOnChange(fn: (value: unknown) => void) { this.change = fn; }

  registerOnTouched(fn: () => void) { this.touch = fn; }
}

@Component({
  template: '<lifecycle-cva [formNode]="node" (formNodeValueChange)="events.push($event)" />',
  imports: [Control, FormNodeDirective],
})
class Host {
  profile = form({
    name: field('Ada'),
    nested: form({ name: field('Ada') }),
    address: { city: field('Zurich') },
    names: array(field('Ada'), { initialValue: 1 }),
  });

  node: AnyNode = this.profile.name;

  events: unknown[] = [];
}

it.each(['field', 'form', 'nested', 'group', 'array'] as const)('forces CVA writes on %s resets without duplicate effects or user events', (kind) => {
  const fixture = TestBed.createComponent(Host);
  const host = fixture.componentInstance;
  const nodes = { field: host.profile.name, form: host.profile, nested: host.profile.nested, group: host.profile.address, array: host.profile.names };
  host.node = nodes[kind];
  fixture.detectChanges();
  const control = fixture.debugElement.children[0]!.componentInstance as Control;
  const value = host.node();
  expect(control.writes).toEqual([value]);
  for (const reset of [() => host.node.$api.reset(), () => host.profile.reset(), () => host.node.$api.resetToInitial()]) {
    const count = control.writes.length;
    control.view = 'uncommitted draft';
    host.node.$api.markAsTouched();
    host.node.$api.markAsDirty();
    reset();
    expect(control.view).toEqual(host.node());
    expect(control.writes).toHaveLength(count + 1);
    expect(host.node.$api.touched()).toBe(false);
    expect(host.node.$api.dirty()).toBe(false);
    fixture.detectChanges();
    expect(control.writes).toHaveLength(count + 1);
    expect(host.events).toEqual([]);
  }
  fixture.destroy();
});

it('rewrites equal-valued bindings, routes user changes to the new node and releases old reset listeners', () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const previous = host.profile.name;
  const next = field('Ada');
  const control = fixture.debugElement.children[0]!.componentInstance as Control;
  control.view = 'old draft';
  host.node = next;
  fixture.changeDetectorRef.markForCheck();
  fixture.detectChanges();
  expect(fixture.debugElement.children[0]!.injector.get(FormNodeDirective).node()).toBe(next);
  expect(control.view).toBe('Ada');
  expect(control.writes).toEqual(['Ada', 'Ada']);
  expect(control.disabledWrites).toEqual([false, false]);
  previous.reset();
  previous.set('Previous');
  fixture.detectChanges();
  expect(control.writes).toEqual(['Ada', 'Ada']);
  control.change('New');
  expect(next()).toBe('New');
  expect(previous()).toBe('Previous');
  fixture.detectChanges();
  expect(control.writes).toEqual(['Ada', 'Ada']);
  expect(host.events).toEqual(['New']);
  fixture.destroy();
  next.reset();
  control.change('ignored');
  expect(next()).toBe('New');
  expect(control.writes).toEqual(['Ada', 'Ada']);
});

it('restores committed input synchronously on reset and cancels a pending CVA edit', () => {
  const fixture = TestBed.createComponent(Host);
  const host = fixture.componentInstance;
  const name = field('Ada', { debounce: 'blur' });
  host.node = name;
  fixture.detectChanges();
  const control = fixture.debugElement.children[0]!.componentInstance as Control;
  control.view = 'Pending';
  control.change('Pending');
  expect(name()).toBe('Ada');
  expect(name.debouncing()).toBe(true);
  name.reset();
  expect(control.view).toBe('Ada');
  expect(name.debouncing()).toBe(false);
  control.touch();
  fixture.detectChanges();
  expect(name()).toBe('Ada');
  expect(control.writes).toEqual(['Ada', 'Ada']);
  expect(host.events).toEqual([]);
  fixture.destroy();
});
