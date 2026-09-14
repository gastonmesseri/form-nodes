import '@angular/compiler';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { array, field, form, FormNodeDirective } from '../../public-api';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

it('renders complete parent array patches, preserves keyed controls, and discards pending drafts', async () => {
  @Component({
    template: `@for (row of profile.people; track row) { <input [formNode]="row.name" /> }`,
    imports: [FormNodeDirective],
  })
  class Host {
    profile = form({ people: array({ id: field.strict(''), name: field('') }, {
      initialValue: [{ id: 'a', name: 'Ada' }, { id: 'b', name: 'Grace' }],
      trackBy: 'id',
      debounce: 'blur',
    }) });
  }
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  const profile = fixture.componentInstance.profile;
  const inputs = () => [...(fixture.nativeElement as HTMLElement).querySelectorAll('input')];
  const [adaInput, graceInput] = inputs();
  graceInput!.value = 'Pending';
  graceInput!.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
  expect(profile.people[1]!.name()).toBe('Grace');
  expect(profile.debouncing()).toBe(true);

  profile.patch({ people: [{ id: 'b', name: 'Grace Hopper' }, { id: 'a', name: 'Ada Lovelace' }, { id: 'c', name: 'Lin' }] });
  fixture.detectChanges();
  await fixture.whenStable();
  expect(inputs()).toHaveLength(3);
  expect(inputs()[0]).toBe(graceInput);
  expect(inputs()[1]).toBe(adaInput);
  expect(inputs().map(input => input.value)).toEqual(['Grace Hopper', 'Ada Lovelace', 'Lin']);
  expect(profile.debouncing()).toBe(false);
  graceInput!.dispatchEvent(new Event('blur'));
  fixture.detectChanges();
  expect(profile.people[0]!.name()).toBe('Grace Hopper');

  profile.patch({ people: [{ id: 'b', name: 'Grace' }] });
  fixture.detectChanges();
  await fixture.whenStable();
  expect(inputs()).toEqual([graceInput]);
  expect(graceInput!.value).toBe('Grace');
  profile.patch({ people: [] });
  fixture.detectChanges();
  await fixture.whenStable();
  expect(inputs()).toEqual([]);
  fixture.destroy();
});
