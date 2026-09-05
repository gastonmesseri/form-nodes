import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Injector, enableProdMode, getDebugNode } from '@angular/core';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { array } from '../primitives/array';
import { field } from '../primitives/field';
import { FormNodeNgControl } from './form-node-ng-control';
import { warnFailedInputWrite } from './angular-internals/component-input-writer';

declare const __FORM_NODE_SIGNAL_CONTROL_FIXTURE__: string;

enableProdMode();

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('FormNode production AOT discovery in Chromium', () => {
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
    expect((component as InstanceType<typeof module.AotSignalValueControl>).controlState.source()).toBe('formNode');
    expect((component as InstanceType<typeof module.AotSignalValueControl>).controlState.required()).toBe(true);
    fixture.destroy();
  });
});
