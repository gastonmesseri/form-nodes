import '@angular/compiler';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, minLength, FormNodeDirective } from '../../public-api';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

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
  profile = form({ name: field<string>(null, [minLength(1)]) });
}

describe('native minimum length for empty text', () => {
  it('reflects empty-string errors and optional conditions without making the input required', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    const profile = fixture.componentInstance.profile;
    const name = profile.name;
    expect(input.value).toBe('');
    expect(input.minLength).toBe(1);
    expect(input.required).toBe(false);
    expect(name()).toBeNull();
    expect(profile.valid()).toBe(true);

    for (const value of ['A', '']) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(name()).toBe(value);
      expect(profile.invalid()).toBe(value === '');
      expect(input.getAttribute('aria-invalid')).toBe(String(value === ''));
      expect(input.required).toBe(false);
    }
    expect(name.getError('minLength')).toMatchObject({ minLength: 1, actual: 0 });
    expect(name.dirty()).toBe(true);

    name.setValidators([minLength(1, { when: ({ value }) => value() !== '' })]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(profile.valid()).toBe(true);
    expect(input.hasAttribute('minlength')).toBe(false);
    expect(input.getAttribute('aria-invalid')).toBe('false');

    profile.resetToInitial();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(name()).toBeNull();
    expect(input.value).toBe('');
    expect(input.minLength).toBe(1);
    expect(profile.valid()).toBe(true);
    expect(name.pristine()).toBe(true);
  });
});
