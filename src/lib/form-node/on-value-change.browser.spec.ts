import '@angular/compiler';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { FormNodeDirective } from './form-node.directive';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

it('reports committed input after blur and complete programmatic resets without extra view notifications', () => {
  const changed = vi.fn();
  const parentChanged = vi.fn();
  @Component({ template: '<input [formNode]="profile.name" />', imports: [FormNodeDirective] })
  class Host {
    profile = form({ name: field('Ada', { debounce: 'blur', onValueChange: changed }) }, { onValueChange: parentChanged });
  }
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const profile = fixture.componentInstance.profile;
  expect(changed).not.toHaveBeenCalled();
  input.value = 'Grace';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
  expect(profile.name()).toBe('Ada');
  expect(changed).not.toHaveBeenCalled();
  input.dispatchEvent(new Event('blur'));
  fixture.detectChanges();
  expect(changed).toHaveBeenCalledExactlyOnceWith('Grace', profile.name);
  expect(parentChanged).toHaveBeenCalledExactlyOnceWith({ name: 'Grace' }, profile);
  profile.resetToInitial();
  fixture.detectChanges();
  expect(changed).toHaveBeenCalledTimes(2);
  expect(parentChanged).toHaveBeenCalledTimes(2);
  expect(input.value).toBe('Ada');
  fixture.destroy();
  profile.name.set('Lin');
  expect(changed).toHaveBeenCalledTimes(3);
});
