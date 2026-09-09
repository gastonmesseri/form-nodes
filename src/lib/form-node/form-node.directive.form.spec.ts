// @vitest-environment jsdom

import '@angular/compiler';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { group } from '../primitives/group';
import { FormNodeDirective } from './form-node.directive';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';
import { registerSignalInputForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
registerSignalOutputForJit(FormNodeDirective, 'formNodeSubmit');
registerSignalOutputForJit(FormNodeDirective, 'formNodeSubmitBlocked');

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('FormNodeDirective on a native form', () => {
  it('binds a group without submission behavior and preserves touch and reset behavior', () => {
    @Component({
      template: `<form [formNode]="address"><input [formNode]="address.city"></form>`,
      standalone: true,
      imports: [FormNodeDirective],
    })
    class Host {
      readonly address = group({ city: field('Zurich', { debounce: 'blur' }) });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });

    input.value = 'Bern';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(fixture.componentInstance.address.city()).toBe('Zurich');

    element.dispatchEvent(submitEvent);

    expect(element.noValidate).toBe(true);
    expect(submitEvent.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.address.touched()).toBe(true);
    expect(fixture.componentInstance.address.city.touched()).toBe(true);
    expect(fixture.componentInstance.address.city()).toBe('Bern');

    const resetEvent = new Event('reset', { bubbles: true, cancelable: true });
    element.dispatchEvent(resetEvent);

    expect(resetEvent.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.address.touched()).toBe(false);
  });

  it('still rejects scalar nodes as native form roots', () => {
    @Component({
      template: `<form [formNode]="name"></form>`,
      standalone: true,
      imports: [FormNodeDirective],
    })
    class Host {
      readonly name = field('Marco');
    }

    const fixture = TestBed.createComponent(Host);
    expect(() => fixture.detectChanges())
      .toThrowError('formNode: a native form requires a form() or group() node');
  });

  it('sets novalidate and submits the bound form node', async () => {
    const action = vi.fn();

    @Component({
      template: `<form [formNode]="profile"><button type="submit">Save</button></form>`,
      standalone: true,
      imports: [FormNodeDirective],
    })
    class Host {
      readonly profile = form({ name: field('Marco') }, { onSubmit: action });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const event = new Event('submit', { bubbles: true, cancelable: true });

    element.dispatchEvent(event);
    await Promise.resolve();

    expect(element.noValidate).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(action).toHaveBeenCalledWith({ name: 'Marco' }, fixture.componentInstance.profile);
  });

  it('prevents an invalid action and resets model and interaction state from a native reset', () => {
    const action = vi.fn();

    @Component({
      template: `<form [formNode]="profile"><input [formNode]="profile.name"></form>`,
      standalone: true,
      imports: [FormNodeDirective],
    })
    class Host {
      readonly profile = form({ name: field('', [required]) }, { onSubmit: action });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(action).not.toHaveBeenCalled();
    expect(fixture.componentInstance.profile.name.touched()).toBe(true);

    input.value = 'changed';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.value = 'stale view';
    const resetEvent = new Event('reset', { bubbles: true, cancelable: true });
    element.dispatchEvent(resetEvent);

    expect(resetEvent.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.profile()).toEqual({ name: 'changed' });
    expect(input.value).toBe('changed');
    expect(fixture.componentInstance.profile.touched()).toBe(false);
    expect(fixture.componentInstance.profile.dirty()).toBe(false);
  });
});

it.each([true, false])('emits attempts then validation blocks with declared action: %s', async (declareAction) => {
  const order: string[] = [];
  const action = vi.fn();
  const declaredBlocked = vi.fn(() => order.push('declared-blocked'));
  @Component({
    template: `<form [formNode]="profile" (formNodeSubmit)="attempt($event)" (formNodeSubmitBlocked)="blocked($event)"><input [formNode]="profile.name"></form>`,
    imports: [FormNodeDirective],
  })
  class Host {
    profile = form({ name: field('', [required], { debounce: 'blur' }) }, {
      ...(declareAction ? { onSubmit: action } : {}), onSubmitBlocked: declaredBlocked,
    });
    attempt = vi.fn(() => order.push('attempt'));
    blocked = vi.fn(() => order.push('blocked'));
  }
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const element = fixture.nativeElement.querySelector('form') as HTMLFormElement;
  const event = new Event('submit', { bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  expect(order).toEqual(declareAction ? ['attempt', 'blocked', 'declared-blocked'] : ['attempt', 'blocked']);
  expect(host.attempt).toHaveBeenCalledWith({ value: { name: '' }, form: host.profile, event });
  expect(host.blocked.mock.calls[0]).toEqual(host.attempt.mock.calls[0]);
  expect(host.profile.submitted()).toBe(true);
  expect(host.profile.name.touched()).toBe(true);
  expect(action).not.toHaveBeenCalled();
  host.profile.name.set('Ada');
  element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await Promise.resolve();
  expect(host.attempt).toHaveBeenCalledTimes(2);
  expect(host.blocked).toHaveBeenCalledOnce();
  expect(action).toHaveBeenCalledTimes(declareAction ? 1 : 0);
  await host.profile.submit();
  expect(host.attempt).toHaveBeenCalledTimes(2);
});

it('flushes input before output and prevents reentrant and concurrent duplicate actions', async () => {
  let resolve!: () => void;
  const order: string[] = [];
  const action = vi.fn(() => {
    order.push('action');
    return new Promise<void>((done) => { resolve = done; });
  });
  @Component({
    template: `<form [formNode]="profile" (formNodeSubmit)="attempt()" (formNodeSubmitBlocked)="blocked()"><input [formNode]="profile.nested.name"></form>`,
    imports: [FormNodeDirective],
  })
  class Host {
    profile = form({ nested: form({ name: field('old', { debounce: 'blur' }) }) }, { onSubmit: action });
    blocked = vi.fn();
    attempt = vi.fn(() => {
      order.push('attempt');
      expect(this.profile.nested.name()).toBe('new');
      expect(this.profile.submitted()).toBe(true);
      expect(this.profile.nested.submitted()).toBe(false);
      void this.profile.submit();
    });
  }
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  input.value = 'new';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const element = fixture.nativeElement.querySelector('form') as HTMLFormElement;
  element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  expect(order).toEqual(['attempt', 'action']);
  expect(fixture.componentInstance.profile.submitting()).toBe(true);
  element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  expect(order).toEqual(['attempt', 'action', 'attempt']);
  expect(action).toHaveBeenCalledOnce();
  expect(fixture.componentInstance.blocked).not.toHaveBeenCalled();
  resolve();
  await Promise.resolve();
  expect(fixture.componentInstance.profile.submitting()).toBe(false);
});

it.each(['valid', 'not-invalid', 'always'] as const)('handles pending validation with submitWhen %s', async (submitWhen) => {
  let resolve!: (value: null) => void;
  const validation = new Promise<null>((done) => { resolve = done; });
  const validate = vi.fn(() => validation);
  @Component({
    template: `<form [formNode]="profile" (formNodeSubmit)="attempt()" (formNodeSubmitBlocked)="blocked()"></form>`,
    imports: [FormNodeDirective],
  })
  class Host {
    profile = form({ nested: form({ name: field('Ada', [asyncValidator(validate)]) }) }, { submitWhen });
    attempt = vi.fn();
    blocked = vi.fn();
  }
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  await vi.waitFor(() => expect(validate).toHaveBeenCalledOnce());
  expect(host.profile.pending()).toBe(true);
  const element = fixture.nativeElement.querySelector('form') as HTMLFormElement;
  element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  expect(host.attempt).toHaveBeenCalledOnce();
  expect(host.blocked).toHaveBeenCalledTimes(submitWhen === 'valid' ? 1 : 0);
  expect(host.profile.submitting()).toBe(false);
  resolve(null);
  await vi.waitFor(() => expect(host.profile.valid()).toBe(true));
  expect(host.attempt).toHaveBeenCalledOnce();
  element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  expect(host.attempt).toHaveBeenCalledTimes(2);
  expect(host.blocked).toHaveBeenCalledTimes(submitWhen === 'valid' ? 1 : 0);
});

it('notifies the prepared attempt before an action resets the form', () => {
  const snapshots: boolean[] = [];
  @Component({
    template: `<form [formNode]="profile" (formNodeSubmit)="attempt()"></form>`,
    imports: [FormNodeDirective],
  })
  class Host {
    profile = form({ name: field('Ada') }, { onSubmit: (_value, node) => { node.reset(); } });
    attempt() { snapshots.push(this.profile.submitted()); }
  }
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  expect(snapshots).toEqual([true]);
  expect(fixture.componentInstance.profile.submitted()).toBe(false);
});
