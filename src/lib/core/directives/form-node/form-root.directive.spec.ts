// @vitest-environment jsdom

import '@angular/compiler';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../../primitives/form';
import { field } from '../../primitives/field';
import { FormNode } from './form-node.directive';
import { required } from '../../validation/validators/required';
import { registerSignalInputForJit } from '../../../../../testing/register-signal-input-for-jit';

registerSignalInputForJit(FormNode, 'formNode', '_formNodeInput');

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('FormNode on a native form', () => {
  it('sets novalidate and submits the bound form node', async () => {
    const action = vi.fn();

    @Component({
      template: `<form [formNode]="profile"><button type="submit">Save</button></form>`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly profile = form({ name: field('Marco') }, { submission: { action } });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const event = new Event('submit', { bubbles: true, cancelable: true });

    element.dispatchEvent(event);
    await Promise.resolve();

    expect(element.noValidate).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(action).toHaveBeenCalledWith(fixture.componentInstance.profile, { name: 'Marco' });
  });

  it('prevents an invalid action and resets model and interaction state from a native reset', () => {
    const action = vi.fn();

    @Component({
      template: `<form [formNode]="profile"><input [formNode]="profile.name"></form>`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly profile = form({ name: field('', [required]) }, { submission: { action } });
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
