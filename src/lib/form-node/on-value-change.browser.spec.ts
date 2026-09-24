import '@angular/compiler';
import { Component, input } from '@angular/core';
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

it.each([0, 'blur', 25] as const)('starts listening after ngOnInit initialization with debounce %s', async (debounce) => {
  const changed = vi.fn();
  @Component({
    selector: `test-initial-value-subscription-${debounce}`,
    template: '<input [formNode]="form.username" /><input [formNode]="form.email" />',
    imports: [FormNodeDirective],
  })
  class Host {
    username = input.required<string>();

    email = input.required<string>();

    form = form({ username: field(''), email: field('') }, { debounce });

    ngOnInit() {
      this.form.patch({ username: this.username(), email: this.email() });
      this.form.onValueChange(changed);
      expect(changed).not.toHaveBeenCalled();
    }
  }
  registerSignalInputForJit(Host, 'username', 'username');
  registerSignalInputForJit(Host, 'email', 'email');
  const fixture = TestBed.createComponent(Host);
  try {
    fixture.componentRef.setInput('username', 'manolo');
    fixture.componentRef.setInput('email', 'manolo@lama.com');
    fixture.detectChanges();
    const node = fixture.componentInstance.form;
    expect(node()).toEqual({ username: 'manolo', email: 'manolo@lama.com' });
    expect(changed).not.toHaveBeenCalled();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 50));
    fixture.detectChanges();
    expect(changed).not.toHaveBeenCalled();
    expect(node.pristine()).toBe(true);
    expect(node.untouched()).toBe(true);

    fixture.componentRef.setInput('username', 'later input');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(node.username()).toBe('manolo');
    expect(changed).not.toHaveBeenCalled();

    node.patch({ username: 'ana', email: 'ana@lama.com' });
    expect(changed).toHaveBeenCalledExactlyOnceWith({ username: 'ana', email: 'ana@lama.com' }, node, { index: null });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(changed).toHaveBeenCalledOnce();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('ana');
    input.value = 'lucia';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    if (debounce !== 0) expect(changed).toHaveBeenCalledOnce();
    if (debounce === 'blur') input.dispatchEvent(new Event('blur'));
    await vi.waitFor(() => expect(changed).toHaveBeenCalledTimes(2));
    expect(changed).toHaveBeenLastCalledWith({ username: 'lucia', email: 'ana@lama.com' }, node, { index: null });
    expect(node.dirty()).toBe(true);
  } finally {
    fixture.destroy();
  }
});

it('cleans up component-owned subscriptions without stopping a shared form or its construction callback', () => {
  const configured = vi.fn();
  const shared = form({ name: field('Ada', { onValueChange: configured }) });
  const fieldChanged = vi.fn();
  const formChanged = vi.fn();
  @Component({ selector: 'test-value-subscription-consumer', template: '' })
  class Consumer {
    constructor() {
      shared.name.onValueChange(fieldChanged);
      shared.onValueChange(formChanged);
    }
  }
  const fixture = TestBed.createComponent(Consumer);
  fixture.detectChanges();
  shared.name.set('Grace');
  expect(fieldChanged).toHaveBeenCalledExactlyOnceWith('Grace', shared.name, { index: null });
  expect(formChanged).toHaveBeenCalledExactlyOnceWith({ name: 'Grace' }, shared, { index: null });
  fixture.destroy();
  shared.name.set('Lin');
  expect(fieldChanged).toHaveBeenCalledOnce();
  expect(formChanged).toHaveBeenCalledOnce();
  expect(configured).toHaveBeenCalledTimes(2);
});

it('uses the captured component owner when a listener is registered later outside injection context', () => {
  @Component({ selector: 'test-value-subscription-owner', template: '' })
  class Host {
    profile = form({ name: field('Ada') });
  }
  const fixture = TestBed.createComponent(Host);
  const profile = fixture.componentInstance.profile;
  const notify = vi.fn();
  profile.onValueChange(notify);
  profile.name.set('Grace');
  fixture.destroy();
  profile.name.set('Lin');
  expect(notify).toHaveBeenCalledExactlyOnceWith({ name: 'Grace' }, profile, { index: null });
});

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
  expect(changed).toHaveBeenCalledExactlyOnceWith('Grace', profile.name, { index: null });
  expect(parentChanged).toHaveBeenCalledExactlyOnceWith({ name: 'Grace' }, profile, { index: null });
  profile.resetToInitial();
  fixture.detectChanges();
  expect(changed).toHaveBeenCalledTimes(2);
  expect(parentChanged).toHaveBeenCalledTimes(2);
  expect(input.value).toBe('Ada');
  fixture.destroy();
  profile.name.set('Lin');
  expect(changed).toHaveBeenCalledTimes(3);
});

it('debounces committed input notifications and cancels pending delivery on component destruction', async () => {
  const changed = vi.fn();
  @Component({
    selector: 'test-debounced-value-subscription',
    template: '<input [formNode]="form.username" />',
    imports: [FormNodeDirective],
  })
  class Host {
    form = form({ username: field('') });

    ngOnInit() {
      this.form.patch({ username: 'initial' });
      this.form.onValueChange(changed, { debounce: 30 });
    }
  }
  const fixture = TestBed.createComponent(Host);
  try {
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(changed).not.toHaveBeenCalled();
    const node = fixture.componentInstance.form;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    for (const value of ['A', 'Ad', 'Ada']) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    expect(node.username()).toBe('Ada');
    expect(node.dirty()).toBe(true);
    expect(changed).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(changed).toHaveBeenCalledExactlyOnceWith({ username: 'Ada' }, node, { index: null }));
    input.value = 'Grace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(node.username()).toBe('Grace');
    fixture.destroy();
    node.patch({ username: 'after destruction' });
    await new Promise(resolve => setTimeout(resolve, 60));
    expect(changed).toHaveBeenCalledOnce();
  } finally {
    if (!fixture.componentRef.hostView.destroyed) fixture.destroy();
  }
});
