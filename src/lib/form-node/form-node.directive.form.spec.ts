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
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', '_formNodeInput');

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
