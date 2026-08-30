import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { enableProdMode, getDebugNode } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

declare const __FORM_NODE_SIGNAL_CONTROL_FIXTURE__: string;

enableProdMode();

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('FormNode production AOT discovery in Chromium', () => {
  it('discovers an AOT component instance through getDebugNode without an adapter provider', async () => {
    const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../../../tests/integration/form-node-signal-control.fixture');
    const fixture = TestBed.createComponent(module.AotSignalControlHost);
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('aot-signal-value-control') as HTMLElement;
    const component = getDebugNode(element)?.componentInstance;

    expect(component).toBeInstanceOf(module.AotSignalValueControl);
    expect(component).toBe(fixture.debugElement.children[0]!.componentInstance);
    expect((component as InstanceType<typeof module.AotSignalValueControl>).value()).toBe('AOT initial');
    expect((component as InstanceType<typeof module.AotSignalValueControl>).boundControl.source()).toBe('formNode');
    expect((component as InstanceType<typeof module.AotSignalValueControl>).boundControl.required()).toBe(true);
    fixture.destroy();
  });
});
