import '@angular/compiler';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, lengthBetween, FormNodeDirective } from '../../public-api';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

@Component({
  selector: 'native-length-between-test-host',
  template: `<input [formNode]="profile.name" />`,
  imports: [FormNodeDirective],
})
class Host {
  minimum = signal<number | undefined>(2);

  maximum = signal<number | undefined>(5);

  active = signal(true);

  profile = form({ name: field('Ada', [lengthBetween(this.minimum, this.maximum, { when: this.active })]) });
}

describe('native lengthBetween', () => {
  it('synchronizes both constraints, user validation, reactive limits, and conditional removal', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;
    expect(input.minLength).toBe(2);
    expect(input.maxLength).toBe(5);
    expect(input.required).toBe(false);

    input.value = 'A';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.profile.name()).toBe('A');
    expect(host.profile.name.hasError('minLength')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    host.minimum.set(undefined);
    host.maximum.set(3);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.hasAttribute('minlength')).toBe(false);
    expect(input.maxLength).toBe(3);
    expect(host.profile.valid()).toBe(true);
    host.profile.name.set('Grace');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.value).toBe('Grace');
    expect(host.profile.name.hasError('maxLength')).toBe(true);

    host.active.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.hasAttribute('minlength')).toBe(false);
    expect(input.hasAttribute('maxlength')).toBe(false);
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(host.profile.valid()).toBe(true);

    host.active.set(true);
    host.minimum.set(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.minLength).toBe(2);
    expect(input.maxLength).toBe(3);
    expect(host.profile.invalid()).toBe(true);
  });
});
