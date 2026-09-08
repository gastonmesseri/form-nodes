// @vitest-environment jsdom

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterAll, beforeAll, afterEach, describe, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, FormNodesModule, FormNodeDirective } from '../public-api';
import { registerSignalInputForJit } from '../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');

@Component({
  selector: 'form-nodes-module-test',
  template: '<input [formNode]="profile.name" />',
  imports: [FormNodesModule],
})
class ModuleHost {
  profile = form({ name: field('Marco') });
}

describe('FormNodesModule', () => {
  beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));

  afterEach(() => TestBed.resetTestingModule());

  afterAll(() => TestBed.resetTestEnvironment());

  it('exports the standalone directive with normal value and interaction synchronization', async () => {
    const fixture = TestBed.createComponent(ModuleHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const name = fixture.componentInstance.profile.name;
    const binding = fixture.debugElement.children[0]!.injector.get(FormNodeDirective);

    expect(binding.node()).toBe(name);
    expect(input.value).toBe('Marco');
    input.value = 'Lia';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(name()).toBe('Lia');
    expect(name.dirty()).toBe(true);
    expect(name.touched()).toBe(true);

    name.reset('Marco');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.value).toBe('Marco');
    expect(name.pristine()).toBe(true);
    expect(name.untouched()).toBe(true);
  });
});
