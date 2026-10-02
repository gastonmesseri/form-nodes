import '@angular/compiler';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, minLength, FormNodeDirective } from '../../../public-api';
import { registerSignalInputForJit } from '../../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

@Component({
  selector: 'native-min-length-test-host',
  template: `<input [formNode]="profile.name" />`,
  imports: [FormNodeDirective],
})
class Host {
  profile = form({ name: field<string>(null, [minLength(3)]) });
}

describe('native minimum length for empty text', () => {
  it('accepts cleared text, retains constraints, and supports explicit empty-string validation', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    const profile = fixture.componentInstance.profile;
    const name = profile.name;
    expect(input.value).toBe('');
    expect(input.minLength).toBe(3);
    expect(input.required).toBe(false);
    expect(name()).toBeNull();
    expect(profile.valid()).toBe(true);

    for (const value of ['Ada', 'A', '']) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(name()).toBe(value);
      expect(profile.invalid()).toBe(value === 'A');
      expect(input.getAttribute('aria-invalid')).toBe(String(value === 'A'));
      expect(input.required).toBe(false);
    }
    expect(name.errors()).toEqual([]);
    expect(input.minLength).toBe(3);
    expect(name.dirty()).toBe(true);

    name.setValidators([minLength(3, { allowEmptyString: false })]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(profile.invalid()).toBe(true);
    expect(name.getError('minLength')).toMatchObject({ minLength: 3, actual: 0 });
    expect(input.minLength).toBe(3);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    profile.resetToInitial();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(name()).toBeNull();
    expect(input.value).toBe('');
    expect(input.minLength).toBe(3);
    expect(profile.valid()).toBe(true);
    expect(name.pristine()).toBe(true);
  });
});
