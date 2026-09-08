import '@angular/compiler';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { Injector, enableProdMode, getDebugNode } from '@angular/core';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { array } from '../primitives/array';
import { field } from '../primitives/field';
import { FormNodeNgControl } from './form-node-ng-control';
import { warnFailedInputWrite } from './ng-internals/component-input-writer';
import { assertValueChangeOutputs } from '../../../tests/helpers/assert-value-change-outputs';
import { assertCustomEventOrder, assertDirectBindingEventOrder } from '../../../tests/helpers/assert-custom-event-order';

declare const __FORM_NODE_SIGNAL_CONTROL_FIXTURE__: string;

enableProdMode();

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('FormNodeDirective production AOT discovery in Chromium', () => {
  it('silences library warnings while preserving ignored-input and reset behavior in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const profile = form({ name: field.strict('initial'), details: { city: field.strict('Zurich') } });
      profile.set({ name: 'set', details: { city: 'Basel' }, extra: true } as never);
      profile.patch({ name: 'patched', extra: true } as never);
      profile.details.patch({ city: 'Bern', extra: true } as never);
      expect(profile()).toEqual({ name: 'patched', details: { city: 'Bern' } });
      const items = array(field.strict(''), { initialValue: ['initial'] });
      items.patch(['updated', 'ignored']);
      expect(items()).toEqual(['updated']);
      const adapter = new FormNodeNgControl(() => profile.name, TestBed.inject(Injector));
      profile.name.markAsTouched();
      adapter.setErrors({ parsing: true });
      adapter.reset('reset', { onlySelf: true, overwriteDefaultValue: true });
      expect(profile.name()).toBe('reset');
      expect(profile.untouched()).toBe(true);
      expect(profile.valid()).toBe(true);
      warnFailedInputWrite({}, 'value');
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('connects a directly assigned accessor and renders the supplied hook state in production AOT', async () => {
    const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../tests/integration/form-node-signal-control.fixture');
    const fixture = TestBed.createComponent(module.AotDirectHookHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('false / true');
    button.click();
    button.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.profile.name()).toBe('clicked');
    expect(button.textContent).toContain('clicked / clicked / true / false');
    fixture.componentInstance.profile.name.set('server');
    fixture.detectChanges();
    expect(button.textContent).toContain('server / server');
    fixture.componentInstance.profile.disable();
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    fixture.componentInstance.profile.enable();
    fixture.componentInstance.profile.reset({ name: '' });
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
    expect(button.textContent).toContain('false / true');
    fixture.destroy();
  });

  it('discovers an AOT component instance through getDebugNode without an adapter provider', async () => {
    const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../tests/integration/form-node-signal-control.fixture');
    const fixture = TestBed.createComponent(module.AotSignalControlHost);
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('aot-signal-value-control') as HTMLElement;
    const component = getDebugNode(element)?.componentInstance;

    expect(component).toBeInstanceOf(module.AotSignalValueControl);
    expect(component).toBe(fixture.debugElement.children[0]!.componentInstance);
    expect((component as InstanceType<typeof module.AotSignalValueControl>).value()).toBe('AOT initial');
    expect((component as InstanceType<typeof module.AotSignalValueControl>).formNodeState.source()).toBe('formNode');
    expect((component as InstanceType<typeof module.AotSignalValueControl>).formNodeState.required()).toBe(true);
    fixture.destroy();
  });
});

it('binds aliased value and checked models using production metadata without writing internal signals', async () => {
  const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../tests/integration/form-node-signal-control.fixture');
  const fixture = TestBed.createComponent(module.AotAliasedModelHost);
  fixture.detectChanges();
  const valueElement = fixture.nativeElement.querySelector('aot-aliased-model-control') as HTMLElement;
  const checkedElement = fixture.nativeElement.querySelector('aot-aliased-checkbox-control') as HTMLElement;
  const value = getDebugNode(valueElement)!.componentInstance as InstanceType<typeof module.AotAliasedModelControl>;
  const checkbox = getDebugNode(checkedElement)!.componentInstance as InstanceType<typeof module.AotAliasedCheckboxControl>;
  expect(value.actualValue()).toEqual({ name: 'Ada', accepted: false });
  value.actualValue.set({ name: 'Grace', accepted: true });
  fixture.detectChanges();
  expect(fixture.componentInstance.profile()).toEqual({ name: 'Grace', accepted: true });
  expect(checkbox.selection()).toBe(true);
  expect(checkbox.checked()).toBe(false);
  expect(value.value()).toBe('internal');
  checkbox.selection.set(false);
  fixture.detectChanges();
  expect(fixture.componentInstance.profile.accepted()).toBe(false);
  expect(fixture.componentInstance.profile.dirty()).toBe(true);
  fixture.destroy();
});

it('processes native input, change, composition and blur before consumer handlers in production AOT', async () => {
  const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../tests/integration/form-node-signal-control.fixture');
  const fixture = TestBed.createComponent(module.NativeEventOrderHost);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const text = fixture.nativeElement.querySelector('#text') as HTMLTextAreaElement;
  text.value = 'entered';
  text.dispatchEvent(new Event('input', { bubbles: true }));
  expect(host.observations[0]).toMatchObject({ value: 'entered', parentValue: { text: 'entered' }, dirty: true, valid: true, parentValid: true });
  const select = fixture.nativeElement.querySelector('#choice') as HTMLSelectElement;
  select.value = 'b';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  expect(host.observations[1]).toMatchObject({ value: 'b', parentValue: { choice: 'b' } });
  const deferred = fixture.nativeElement.querySelector('#deferred') as HTMLTextAreaElement;
  deferred.value = 'pending';
  deferred.dispatchEvent(new Event('input', { bubbles: true }));
  expect(host.observations[2]).toMatchObject({ value: 'initial', controlValue: 'pending' });
  deferred.dispatchEvent(new Event('blur'));
  expect(host.observations[3]).toMatchObject({ value: 'pending', parentValue: { deferred: 'pending' }, touched: true });
  text.dispatchEvent(new Event('compositionstart'));
  text.value = 'composed';
  text.dispatchEvent(new Event('input', { bubbles: true }));
  expect(host.observations[4]).toMatchObject({ value: 'entered' });
  text.dispatchEvent(new Event('compositionend'));
  expect(host.observations[5]).toMatchObject({ value: 'composed', parentValue: { text: 'composed' } });
  fixture.destroy();
});

it('isolates native listeners from CVA and model transports in production AOT', async () => {
  const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../tests/integration/form-node-signal-control.fixture');
  const fixture = TestBed.createComponent(module.NativeEventIsolationHost);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  for (const element of fixture.nativeElement.querySelectorAll('input')) {
    element.value = 'native';
    for (const name of ['input', 'change', 'blur', 'compositionstart', 'compositionend']) {
      element.dispatchEvent(new Event(name, { bubbles: true }));
    }
  }
  const cvas = fixture.debugElement.queryAll(By.directive(module.IsolatedCva)).map(element => element.injector.get(module.IsolatedCva));
  const custom = fixture.debugElement.query(By.directive(module.IsolatedModel)).componentInstance as InstanceType<typeof module.IsolatedModel>;
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
  cvas[0]!.onTouched();
  cvas[1]!.onTouched();
  custom.touch.emit();
  expect(host.profile.nativeCva.touched()).toBe(true);
  expect(host.profile.customCva.touched()).toBe(true);
  expect(host.profile.customModel.touched()).toBe(true);
  expect(host.profile.passThrough.untouched()).toBe(true);
  fixture.destroy();
});

it('commits custom value, checked, pair and touch outputs before consumer handlers in production AOT', async () => {
  const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../tests/integration/form-node-signal-control.fixture');
  assertCustomEventOrder(TestBed.createComponent(module.CustomEventOrderHost));
});

it('updates before output handlers with direct binding constructor injection in production AOT', async () => {
  const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../tests/integration/form-node-signal-control.fixture');
  assertDirectBindingEventOrder(TestBed.createComponent(module.DirectBindingHost));
});

it('delivers control and committed value outputs through production AOT template listeners', async () => {
  const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../tests/integration/form-node-signal-control.fixture');
  assertValueChangeOutputs(TestBed.createComponent(module.ValueChangeOutputsHost));
});

it('emits one typed value per native checkbox, date and selection edit in Chromium', async () => {
  const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../tests/integration/form-node-signal-control.fixture');
  const fixture = TestBed.createComponent(module.ValueChangeOutputsHost);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const checkbox = fixture.nativeElement.querySelector('#check') as HTMLInputElement;
  checkbox.click();
  const date = fixture.nativeElement.querySelector('#date') as HTMLInputElement;
  date.value = '2026-09-09';
  date.dispatchEvent(new Event('input'));
  date.dispatchEvent(new Event('change'));
  const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
  select.options[1]!.selected = true;
  select.dispatchEvent(new Event('input'));
  select.dispatchEvent(new Event('change'));
  expect(host.events.map(({ source, kind, event }) => [source, kind, event])).toEqual([
    ['check', 'control', true], ['check', 'value', true],
    ['date', 'control', new Date('2026-09-09')], ['date', 'value', new Date('2026-09-09')],
    ['selected', 'control', ['B']], ['selected', 'value', ['B']],
  ]);
  fixture.destroy();
});
