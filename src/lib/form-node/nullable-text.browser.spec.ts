import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, required, FormNodeDirective, type AnyNode } from '../../public-api';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

@Component({
  selector: 'nullable-text-binding-host',
  template: `<input [formNode]="selected()" />`,
  imports: [FormNodeDirective],
})
class Host {
  selected = signal<AnyNode>(field<string>(null));
}

const setup = (node: AnyNode) => {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.selected.set(node);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const type = (value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  };
  return { fixture, input, type };
};

describe('nullable native text binding', () => {
  for (const location of ['standalone', 'nested'] as const) {
    it.each([null, undefined])(`preserves text from a ${location} field initialized to %s`, (initial) => {
      const name = field<string | undefined>(initial, [required]);
      const profile = location === 'nested' ? form({ account: form({ name }) }) : null;
      const { fixture, input, type } = setup(name);
      expect(input.value).toBe('');
      expect(name.invalid()).toBe(true);
      expect(name.pristine()).toBe(true);
      type('Ada');
      expect(name()).toBe('Ada');
      expect(name.getError('parse')).toBeUndefined();
      expect(name.valid()).toBe(true);
      expect(name.dirty()).toBe(true);
      expect(name.untouched()).toBe(true);
      if (profile) {
        expect(profile()).toEqual({ account: { name: 'Ada' } });
        expect(profile.valid()).toBe(true);
        expect(profile.dirty()).toBe(true);
      }
      input.dispatchEvent(new Event('blur'));
      expect(name.touched()).toBe(true);
      type('007');
      expect(name()).toBe('007');
      type('   ');
      expect(name()).toBe('   ');
      type('');
      expect(name()).toBe('');
      expect(name.hasError('required')).toBe(true);
      if (profile) profile.reset({ account: { name: null } });
      else name.reset(null);
      fixture.detectChanges();
      expect(name()).toBeNull();
      expect(name.pristine()).toBe(true);
      expect(name.untouched()).toBe(true);
      type('Grace');
      expect(name()).toBe('Grace');
      expect(name.valid()).toBe(true);
      expect(input.getAttribute('aria-invalid')).toBe('false');
    });
  }

  it('buffers nullable text and commits it through inherited blur debounce', () => {
    const profile = form({ name: field<string>(null, [required]) }, { debounce: 'blur' });
    const { fixture, input, type } = setup(profile.name);
    type('Ada');
    expect(profile.name()).toBeNull();
    expect(profile.name.value.control()).toBe('Ada');
    expect(profile.name.hasError('parse')).toBe(false);
    expect(profile.debouncing()).toBe(true);
    expect(profile.dirty()).toBe(true);
    expect(profile.invalid()).toBe(true);
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(profile()).toEqual({ name: 'Ada' });
    expect(profile.valid()).toBe(true);
    expect(profile.touched()).toBe(true);
    type('Grace');
    profile.reset({ name: null });
    fixture.detectChanges();
    expect(input.value).toBe('');
    expect(profile.debouncing()).toBe(false);
    type('007');
    profile.flush();
    expect(profile.name()).toBe('007');
  });

  it('preserves established numeric parsing through clearing and reset but releases it on rebinding', () => {
    const age = field<number>(23);
    const { fixture, input, type } = setup(age);
    type('');
    expect(age()).toBeNull();
    type('invalid');
    expect(age()).toBeNull();
    expect(age.hasError('parse')).toBe(true);
    expect(input.value).toBe('invalid');
    type('42');
    expect(age()).toBe(42);
    expect(age.valid()).toBe(true);
    age.reset(null);
    fixture.detectChanges();
    expect(age.pristine()).toBe(true);
    type('7');
    expect(age()).toBe(7);
    const name = field<string>(null);
    fixture.componentInstance.selected.set(name);
    fixture.detectChanges();
    type('Ada');
    expect(name()).toBe('Ada');
    expect(name.valid()).toBe(true);
    expect(age()).toBe(7);
  });

  it('switches representation after an explicit string value on the same binding', () => {
    const value = field<string | number>(23);
    const { fixture, type } = setup(value);
    value.set('text');
    fixture.detectChanges();
    value.reset(null);
    fixture.detectChanges();
    type('007');
    expect(value()).toBe('007');
    expect(value.valid()).toBe(true);
  });

  it('keeps numeric input types numeric when initialized to null', () => {
    TestBed.overrideComponent(Host, { set: { template: `<input type="number" [formNode]="selected()" />` } });
    const age = field<number>(null);
    const { type } = setup(age);
    type('42');
    expect(age()).toBe(42);
    type('');
    expect(age()).toBeNull();
    type('7');
    expect(age()).toBe(7);
  });
});
