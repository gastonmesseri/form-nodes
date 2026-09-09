import { expect } from 'vitest';
import { By } from '@angular/platform-browser';
import type { ComponentFixture } from '@angular/core/testing';

import type { FormNodeBinding } from '../../src/public-api';
import type { ValueChangeOutputsHost } from '../integration/value-change-outputs.fixture';

/** Verifies real template outputs in both JIT and production AOT. */
export function assertValueChangeOutputs(fixture: ComponentFixture<ValueChangeOutputsHost>) {
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
  expect(host.events).toEqual([]);
  textarea.value = 'latest';
  textarea.dispatchEvent(new Event('input'));
  textarea.dispatchEvent(new Event('change'));
  expect(host.events.map(({ kind, event, value, parent, valid, dirty }) => ({ kind, event, value, parent, valid, dirty }))).toEqual([
    { kind: 'control', event: 'latest', value: 'latest', parent: { text: 'latest' }, valid: true, dirty: true },
    { kind: 'value', event: 'latest', value: 'latest', parent: { text: 'latest' }, valid: true, dirty: true },
  ]);
  host.events = [];
  const controls = fixture.debugElement.children;
  controls.find(element => element.name === 'output-cva')!.componentInstance.onChange('CVA');
  controls.find(element => element.name === 'ordered-check')!.componentInstance.checked.set(true);
  controls.find(element => element.name === 'ordered-value')!.componentInstance.selection.set({ name: 'custom' });
  controls.find(element => element.name === 'ordered-pair')!.componentInstance.valueChange.emit(['pair']);
  expect(host.events.map(({ source, kind, event }) => [source, kind, event])).toEqual([
    ['cva', 'control', 'CVA'], ['cva', 'value', 'CVA'],
    ['checked', 'control', true], ['checked', 'value', true],
    ['custom', 'control', { name: 'custom' }], ['pair', 'control', ['pair']],
  ]);
  expect(host.custom()).toEqual({ name: '' });
  expect(host.pair()).toEqual(['']);
  host.custom.$api.flush();
  host.pair.flush();
  expect(host.events.slice(-2).map(({ source, kind, event, value }) => [source, kind, event, value])).toEqual([
    ['custom', 'value', { name: 'custom' }, { name: 'custom' }],
    ['pair', 'value', ['pair'], ['pair']],
  ]);
  host.events = [];
  host.text.set('programmatic');
  host.custom.$api.reset();
  host.pair.patch(['programmatic']);
  host.cva.$api.reset();
  fixture.detectChanges();
  expect(host.events).toEqual([]);
  const binding = fixture.debugElement.query(By.css('textarea')).references['textBinding'] as FormNodeBinding;
  const received: unknown[] = [];
  const subscription = binding.formNodeValueChange.subscribe(value => received.push(value));
  textarea.value = 'subscribed';
  textarea.dispatchEvent(new Event('input'));
  expect(received).toEqual(['subscribed']);
  subscription.unsubscribe();
  host.events = [];
  host.text.resetToInitial();
  host.cva.$api.resetToInitial();
  host.custom.$api.resetToInitial();
  host.pair.resetToInitial();
  fixture.detectChanges();
  expect(textarea.value).toBe('');
  expect(host.cva()).toBe('');
  expect(host.custom()).toEqual({ name: '' });
  expect(host.pair()).toEqual(['']);
  expect(host.events).toEqual([]);
  fixture.destroy();
}
