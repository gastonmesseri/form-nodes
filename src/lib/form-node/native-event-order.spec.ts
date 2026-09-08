// @vitest-environment jsdom

import '@angular/compiler';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { FormNodeDirective } from './form-node.directive';
import { NativeEventOrderHost } from '../../../tests/integration/native-event-order.fixture';
import { IsolatedCva, IsolatedModel, NativeEventIsolationHost } from '../../../tests/integration/native-event-isolation.fixture';
import { registerSignalInputForJit, registerSignalModelForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
registerSignalModelForJit(IsolatedModel, 'value');
for (const component of [IsolatedCva, IsolatedModel]) {
  for (const name of ['input', 'change', 'blur']) registerSignalOutputForJit(component, name);
}
registerSignalOutputForJit(IsolatedModel, 'touch');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => { TestBed.resetTestingModule(); vi.useRealTimers(); vi.restoreAllMocks(); });
afterAll(() => TestBed.resetTestEnvironment());

const bind = () => {
  const fixture = TestBed.createComponent(NativeEventOrderHost);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, text: fixture.nativeElement.querySelector('#text') as HTMLTextAreaElement };
};
const dispatch = (element: HTMLElement, type: string) => element.dispatchEvent(new Event(type, { bubbles: true }));

it('updates the field, parent value, dirty state and validation before the template input handler', () => {
  const { host, text } = bind();
  text.value = 'updated';
  dispatch(text, 'input');
  expect(host.observations).toHaveLength(1);
  expect(host.observations[0]).toMatchObject({ value: 'updated', controlValue: 'updated', parentValue: { text: 'updated' }, dirty: true, touched: false, valid: true, parentValid: true, errors: [] });
  text.value = '';
  dispatch(text, 'input');
  expect(host.observations[1]).toMatchObject({ value: '', parentValue: { text: '' }, valid: false, parentValid: false, errors: ['required'] });
  dispatch(text, 'blur');
  expect(host.observations[2]).toMatchObject({ event: 'blur', touched: true });
});

it.each([['checked', 'change', true], ['choice', 'change', 'b'], ['amount', 'input', 42]] as const)('parses %s before its template handler', (id, event, value) => {
  const { host, fixture } = bind();
  const control = fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;
  if (id === 'checked') control.checked = true;
  else control.value = String(value);
  dispatch(control, event);
  expect(host.observations[0]).toMatchObject({ event, value, controlValue: value, parentValue: { [id]: value }, dirty: true });
});

it('keeps IME input pending until composition ends, then updates before the consumer callback', () => {
  const { host, text } = bind();
  dispatch(text, 'compositionstart');
  text.value = 'composed';
  dispatch(text, 'input');
  expect(host.observations[0]).toMatchObject({ value: '', controlValue: '', dirty: false });
  dispatch(text, 'compositionend');
  expect(host.observations[1]).toMatchObject({ event: 'compositionend', value: 'composed', parentValue: { text: 'composed' }, dirty: true });
});

it('preserves blur debounce and exposes the committed value inside the blur handler', () => {
  const { host, fixture } = bind();
  const text = fixture.nativeElement.querySelector('#deferred') as HTMLTextAreaElement;
  text.value = 'pending';
  dispatch(text, 'input');
  expect(host.observations[0]).toMatchObject({ value: 'initial', controlValue: 'pending', dirty: true, touched: false });
  dispatch(text, 'blur');
  expect(host.observations[1]).toMatchObject({ value: 'pending', controlValue: 'pending', parentValue: { deferred: 'pending' }, touched: true });
});

it('preserves timed debounce instead of forcing a commit before the consumer callback', () => {
  vi.useFakeTimers();
  const { host, fixture } = bind();
  const text = fixture.nativeElement.querySelector('#delayed') as HTMLTextAreaElement;
  text.value = 'pending';
  dispatch(text, 'input');
  expect(host.observations[0]).toMatchObject({ value: 'initial', controlValue: 'pending', dirty: true });
  vi.advanceTimersByTime(49);
  expect(host.profile.delayed()).toBe('initial');
  vi.advanceTimersByTime(1);
  expect(host.profile.delayed()).toBe('pending');
  expect(host.observations).toHaveLength(1);
});

it('preserves consumer reset and stopImmediatePropagation without a late second commit', () => {
  const { host, text, fixture } = bind();
  host.afterEvent = (event) => {
    event.stopImmediatePropagation();
    host.profile.reset({ ...host.profile(), text: '' });
  };
  text.value = 'entered';
  dispatch(text, 'input');
  expect(host.observations[0]).toMatchObject({ value: 'entered', dirty: true });
  expect(host.profile.text()).toBe('');
  expect(host.profile.pristine()).toBe(true);
  fixture.detectChanges();
  expect(text.value).toBe('');
  fixture.destroy();
  text.value = 'detached';
  dispatch(text, 'input');
  expect(host.profile.text()).toBe('');
  expect(host.observations).toHaveLength(1);
});

it('follows rebinding without writing to the previous field', () => {
  const { host, text, fixture } = bind();
  const previous = host.profile;
  host.profile = new NativeEventOrderHost().profile;
  fixture.changeDetectorRef.markForCheck();
  fixture.detectChanges();
  text.value = 'replacement';
  dispatch(text, 'input');
  expect(host.observations[0]).toMatchObject({ value: 'replacement', parentValue: { text: 'replacement' } });
  expect(previous.text()).toBe('');
});

it('removes native listeners for other adapters and leaves custom events to their selected transport', () => {
  const added = vi.spyOn(HTMLElement.prototype, 'addEventListener');
  const removed = vi.spyOn(HTMLElement.prototype, 'removeEventListener');
  const fixture = TestBed.createComponent(NativeEventIsolationHost);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const eventNames = ['input', 'change', 'blur', 'compositionstart', 'compositionend'];
  for (const id of ['native-cva', 'pass-through']) {
    const element = fixture.nativeElement.querySelector('#' + id) as HTMLInputElement;
    const registrations = added.mock.calls.flatMap((call, index) => {
      return added.mock.contexts[index] === element && eventNames.includes(call[0]) ? [call] : [];
    });
    expect(registrations).toHaveLength(5);
    for (const [name, listener] of registrations) {
      expect(removed.mock.calls.some((call, index) => {
        return removed.mock.contexts[index] === element && call[0] === name && call[1] === listener;
      })).toBe(true);
    }
  }
  for (const selector of ['#custom-cva', 'isolated-model']) {
    const element = fixture.nativeElement.querySelector(selector) as HTMLElement;
    expect(added.mock.calls.some((call, index) => {
      return added.mock.contexts[index] === element && eventNames.includes(call[0]);
    })).toBe(false);
  }
  for (const element of fixture.nativeElement.querySelectorAll('input')) {
    element.value = 'native';
    for (const name of eventNames) dispatch(element, name);
  }
  const cvas = fixture.debugElement.queryAll(By.directive(IsolatedCva)).map(element => element.injector.get(IsolatedCva));
  const custom = fixture.debugElement.query(By.directive(IsolatedModel)).componentInstance as IsolatedModel;
  for (const control of [...cvas, custom]) {
    control.input.emit('output');
    control.change.emit('output');
    control.blur.emit('output');
  }
  expect(host.profile()).toEqual({ nativeCva: 'initial', customCva: 'initial', customModel: 'initial', passThrough: 'initial' });
  expect(host.profile.pristine()).toBe(true);
  expect(host.profile.untouched()).toBe(true);
  cvas[0]!.onChange('native CVA');
  cvas[1]!.onChange('custom CVA');
  custom.value.set('model');
  expect(host.profile()).toEqual({ nativeCva: 'native CVA', customCva: 'custom CVA', customModel: 'model', passThrough: 'initial' });
  expect(host.profile.dirty()).toBe(true);
  cvas[0]!.onTouched();
  cvas[1]!.onTouched();
  custom.touch.emit();
  expect(host.profile.nativeCva.touched()).toBe(true);
  expect(host.profile.customCva.touched()).toBe(true);
  expect(host.profile.customModel.touched()).toBe(true);
  expect(host.profile.passThrough.untouched()).toBe(true);
  fixture.destroy();
});
