// @vitest-environment jsdom

import '@angular/compiler';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, FormNodeDirective } from '../../public-api';
import { assertValueChangeOutputs } from '../../../tests/helpers/assert-value-change-outputs';
import { OutputCvaControl, ValueChangeOutputsHost } from '../../../tests/integration/value-change-outputs.fixture';
import { OrderedValueControl, OrderedCheckboxControl, OrderedPairControl } from '../../../tests/integration/custom-event-order.fixture';
import { registerSignalInputForJit, registerSignalModelForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
registerSignalOutputForJit(FormNodeDirective, 'formNodeValueChange');
registerSignalOutputForJit(FormNodeDirective, 'formNodeControlValueChange');
registerSignalModelForJit(OrderedValueControl, 'value', 'selection');
registerSignalModelForJit(OrderedCheckboxControl, 'checked');
registerSignalInputForJit(OrderedPairControl, 'value', 'value');
registerSignalOutputForJit(OrderedPairControl, 'valueChange');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => { TestBed.resetTestingModule(); vi.useRealTimers(); });
afterAll(() => TestBed.resetTestEnvironment());

const setup = (debounce?: number | 'blur' | (() => void | PromiseLike<void>)) => {
  const fixture = TestBed.createComponent(ValueChangeOutputsHost);
  const host = fixture.componentInstance;
  host.text = field.strict('initial', { debounce: debounce ?? 0 });
  host.profile = form({ text: host.text });
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
  const edit = (value: string, event = 'input') => {
    input.value = value;
    input.dispatchEvent(new Event(event));
  };
  return { fixture, host, input, edit };
};

it('delivers typed values from native, CVA, model and paired transports after processing', () => {
  assertValueChangeOutputs(TestBed.createComponent(ValueChangeOutputsHost));
});

it('coalesces numeric debounce without delaying the latest control value', () => {
  vi.useFakeTimers();
  const { host, edit, input } = setup(100);
  edit('first');
  vi.advanceTimersByTime(60);
  edit('latest');
  vi.advanceTimersByTime(60);
  input.dispatchEvent(new Event('change'));
  expect(host.events.map(({ kind, event }) => [kind, event])).toEqual([['control', 'first'], ['control', 'latest']]);
  expect(host.text()).toBe('initial');
  expect(host.text.value.control()).toBe('latest');
  vi.advanceTimersByTime(40);
  expect(host.events.at(-1)).toMatchObject({ kind: 'value', event: 'latest', value: 'latest', parent: { text: 'latest' } });
  expect(host.events).toHaveLength(3);
});

it.each(['blur', 'flush', 'touch'] as const)('emits once when %s confirms a pending edit', (action) => {
  const { host, edit, input } = setup('blur');
  edit('latest');
  if (action === 'blur') input.dispatchEvent(new Event('blur'));
  else if (action === 'touch') host.text.markAsTouched();
  else host.profile.flush();
  host.profile.flush();
  expect(host.events.map(({ kind, event }) => [kind, event])).toEqual([['control', 'latest'], ['value', 'latest']]);
});

it('does not emit a stale commit when an immediate handler resets the node', () => {
  const { host, edit } = setup();
  host.afterEvent = (kind) => { if (kind === 'control') host.text.reset('reset'); };
  edit('latest');
  expect(host.text()).toBe('reset');
  expect(host.events.map(({ kind }) => kind)).toEqual(['control']);
});

it('emits once when the control-value handler flushes its own pending edit', () => {
  const { host, edit } = setup('blur');
  host.afterEvent = (kind) => { if (kind === 'control') host.text.flush(); };
  edit('latest');
  expect(host.events.map(({ kind }) => kind)).toEqual(['control', 'value']);
});

it.each(['set', 'reset', 'resetToInitial', 'rebind', 'destroy'] as const)('suppresses pending output after %s', (action) => {
  vi.useFakeTimers();
  const { host, edit, fixture } = setup(100);
  edit('pending');
  if (action === 'set') host.text.set('programmatic');
  if (action === 'reset') host.text.reset();
  if (action === 'resetToInitial') host.text.resetToInitial();
  if (action === 'rebind') {
    host.text = field.strict('replacement');
    fixture.detectChanges();
  }
  if (action === 'destroy') fixture.destroy();
  vi.advanceTimersByTime(100);
  expect(host.events.map(({ kind }) => kind)).toEqual(['control']);
});

it('supports synchronous and asynchronous debounce completion, replacement and rejection', async () => {
  let resolve!: () => void;
  let reject!: () => void;
  const { host, edit } = setup(() => new Promise<void>((yes, no) => { resolve = yes; reject = no; }));
  edit('old');
  const oldResolve = resolve;
  edit('new');
  oldResolve();
  await Promise.resolve();
  expect(host.text()).toBe('initial');
  resolve();
  await Promise.resolve();
  expect(host.events.at(-1)).toMatchObject({ kind: 'value', event: 'new' });
  edit('rejected');
  reject();
  await Promise.resolve();
  expect(host.events.at(-1)).toMatchObject({ kind: 'control', event: 'rejected' });
  const immediate = setup(() => {});
  immediate.edit('sync');
  expect(immediate.host.events.map(({ kind }) => kind)).toEqual(['control', 'value']);
});

it('buffers composition and ignores invalid numeric input without emitting a stale value', () => {
  const { fixture, host, input, edit } = setup();
  input.dispatchEvent(new Event('compositionstart'));
  edit('composing');
  expect(host.events).toEqual([]);
  input.dispatchEvent(new Event('compositionend'));
  input.dispatchEvent(new Event('input'));
  expect(host.events.map(({ event }) => event)).toEqual(['composing', 'composing']);
  const number = fixture.nativeElement.querySelector('#number') as HTMLInputElement;
  host.events = [];
  number.value = 'bad';
  number.dispatchEvent(new Event('input'));
  expect(host.number.invalid()).toBe(true);
  expect(host.events).toEqual([]);
  number.value = '42';
  number.dispatchEvent(new Event('input'));
  expect(host.events.map(({ event }) => event)).toEqual([42, 42]);
});

it('deduplicates native checkbox, date and multiple select event pairs', () => {
  const { fixture, host } = setup();
  const check = fixture.nativeElement.querySelector('#check') as HTMLInputElement;
  check.checked = true;
  const date = fixture.nativeElement.querySelector('#date') as HTMLInputElement;
  date.value = '2026-09-09';
  vi.spyOn(date, 'valueAsDate', 'get').mockImplementation(() => new Date('2026-09-09'));
  const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
  select.options[1]!.selected = true;
  for (const control of [check, date, select]) {
    control.dispatchEvent(new Event('input'));
    control.dispatchEvent(new Event('change'));
  }
  expect(host.events.map(({ source, kind }) => [source, kind])).toEqual([
    ['check', 'control'], ['check', 'value'], ['date', 'control'], ['date', 'value'], ['selected', 'control'], ['selected', 'value'],
  ]);
  expect(host.events[0]!.event).toBe(true);
  expect(host.events[2]!.event).toEqual(new Date('2026-09-09'));
  expect(host.events[4]!.event).toEqual(['B']);
});

it('accepts repeated CVA callbacks, ignores native host events and writeValue feedback', () => {
  const { fixture, host } = setup();
  const element = fixture.debugElement.query(By.directive(OutputCvaControl));
  const cva = element.componentInstance as OutputCvaControl;
  cva.onChange('same');
  cva.onChange('same');
  expect(host.events.map(({ kind }) => kind)).toEqual(['control', 'value', 'control', 'value']);
  host.events = [];
  element.nativeElement.dispatchEvent(new Event('input'));
  host.cva.$api.reset('programmatic');
  fixture.detectChanges();
  expect(host.events).toEqual([]);
  fixture.destroy();
  cva.onChange('destroyed');
  expect(host.events).toEqual([]);
});

it('keeps validity-monitor synchronization separate from control output events', () => {
  vi.stubGlobal('AnimationEvent', Event);
  try {
    const { fixture, host } = setup();
    const date = fixture.nativeElement.querySelector('#date') as HTMLInputElement;
    date.value = '2026-09-09';
    const event = new Event('animationstart');
    Object.defineProperty(event, 'animationName', { value: 'form-node-valid' });
    date.dispatchEvent(event);
    expect(host.date()?.getTime()).toBe(new Date('2026-09-09').getTime());
    expect(host.events).toEqual([]);
    fixture.destroy();
  } finally {
    vi.unstubAllGlobals();
  }
});

it('does not revive a pending notification when a binding returns to its previous node', () => {
  vi.useFakeTimers();
  const { fixture, host, edit } = setup(100);
  const original = host.text;
  edit('pending');
  host.text = field.strict('replacement');
  fixture.detectChanges();
  host.text = original;
  fixture.detectChanges();
  vi.advanceTimersByTime(100);
  expect(original()).toBe('pending');
  expect(host.events.map(({ kind }) => kind)).toEqual(['control']);
});

it('restores initial native values and clears parsing errors without output events', () => {
  const { fixture, host } = setup();
  const number = fixture.nativeElement.querySelector('#number') as HTMLInputElement;
  number.value = 'invalid';
  number.dispatchEvent(new Event('input'));
  expect(host.number.invalid()).toBe(true);
  host.number.resetToInitial();
  expect(host.number()).toBe(0);
  expect(host.number.value.control()).toBe(0);
  expect(host.number.valid()).toBe(true);
  expect(host.number.pristine()).toBe(true);
  expect(number.value).toBe('0');
  expect(host.events).toEqual([]);
});
