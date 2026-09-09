import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { Component, forwardRef, signal } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, FormNodeDirective } from '../../../src/public-api';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

@Component({
  selector: 'draft-cva',
  template: '<input [value]="draft()" (input)="draft.set($any($event.target).value)" />',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DraftControl), multi: true }],
})
class DraftControl {
  draft = signal('');

  writeValue(value: string) { this.draft.set(value); }

  registerOnChange() {}

  registerOnTouched() {}
}

@Component({ template: '<draft-cva [formNode]="node()" />', imports: [DraftControl, FormNodeDirective] })
class Host {
  profile = form({ name: field('Ada') });

  node = signal(this.profile.name);
}

it('restores uncommitted DOM drafts on resets and equal-valued rebinding', async () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.componentInstance;
  const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
  const previous = host.profile.name;
  for (const update of [() => previous.reset(), () => host.profile.reset(), () => host.node.set(form({ name: field('Ada') }).name)]) {
    input.value = 'uncommitted draft';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(input.value).toBe('uncommitted draft');
    expect(host.node()()).toBe('Ada');
    update();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.value).toBe('Ada');
  }
  input.value = 'new draft';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  previous.reset();
  fixture.detectChanges();
  await fixture.whenStable();
  expect(input.value).toBe('new draft');
  fixture.destroy();
});
