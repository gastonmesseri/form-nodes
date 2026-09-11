import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, pattern, required, FormNodeDirective } from '../../public-api';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

@Component({
  selector: 'native-pattern-test-host',
  template: `
    <form>
      <input [formNode]="profile.name" />
      <button type="submit">Save</button>
    </form>
  `,
  imports: [FormNodeDirective],
})
class Host {
  profile = form({ name: field('', [required]) });
}

const setup = () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    profile: fixture.componentInstance.profile,
    native: element.querySelector('form')!,
    input: element.querySelector('input')!,
  };
};

describe('native pattern constraints', () => {
  it('allows valid text to reach an application submit handler without a pattern validator', async () => {
    const { fixture, profile, native, input } = setup();
    const submit = vi.fn((event: Event) => {
      expect(event.defaultPrevented).toBe(false);
      event.preventDefault();
    });
    native.addEventListener('submit', submit);
    expect(input.hasAttribute('pattern')).toBe(false);
    expect(input.validity.valueMissing).toBe(true);
    native.requestSubmit();
    expect(submit).not.toHaveBeenCalled();
    profile.name.set('Ada');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.value).toBe('Ada');
    expect(input.checkValidity()).toBe(true);
    expect(profile.name.valid()).toBe(true);
    expect(profile.valid()).toBe(true);
    native.requestSubmit();
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it.each(['remove', 'disable'] as const)('clears the last native pattern restriction on %s', async (operation) => {
    const { fixture, profile, input } = setup();
    const expression = signal<RegExp | undefined>(/^[0-9]+$/);
    profile.name.set('Ada');
    profile.name.setValidators([required, pattern(() => expression())]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.validity.patternMismatch).toBe(true);
    expect(profile.name.getError('pattern')).toBeDefined();
    expect(profile.invalid()).toBe(true);
    if (operation === 'remove') profile.name.setValidators([required]);
    else expression.set(undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.hasAttribute('pattern')).toBe(false);
    expect(input.checkValidity()).toBe(true);
    expect(profile.name.getError('pattern')).toBeUndefined();
    expect(profile.valid()).toBe(true);
    expect(profile.name()).toBe('Ada');
    expect(profile.name.pristine()).toBe(true);
    expect(profile.name.untouched()).toBe(true);
    profile.name.set('');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.validity.valueMissing).toBe(true);
    expect(profile.name.getError('required')).toBeDefined();
    expect(profile.invalid()).toBe(true);
  });
});
