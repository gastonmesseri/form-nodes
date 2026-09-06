// @vitest-environment jsdom

import { TestBed } from '@angular/core/testing';
import { effect, signal, type Signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from './form';
import { field } from './field';

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());
afterEach(() => {
  TestBed.resetTestingModule();
  vi.useRealTimers();
});

const delaySignal = <T>(source: Signal<T>, wait = 10) => {
  const delayed = signal(source());
  effect((onCleanup) => {
    const value = source();
    const timer = setTimeout(() => delayed.set(value), wait);
    onCleanup(() => clearTimeout(timer));
  });
  return delayed.asReadonly();
};

describe('signal interoperability', () => {
  it('tracks field and form values in a delayed effect and cancels superseded work', () => {
    vi.useFakeTimers();
    const profile = form({ name: field.strict('Marco') });
    const [name, value] = TestBed.runInInjectionContext(() => [delaySignal(profile.name), delaySignal(profile)] as const);
    TestBed.tick();
    expect(name()).toBe('Marco');
    expect(value()).toEqual({ name: 'Marco' });
    profile.name.set('Lia');
    TestBed.tick();
    vi.advanceTimersByTime(5);
    profile.name.set('Ana');
    TestBed.tick();
    vi.advanceTimersByTime(5);
    expect(name()).toBe('Marco');
    expect(value()).toEqual({ name: 'Marco' });
    vi.advanceTimersByTime(5);
    expect(name()).toBe('Ana');
    expect(value()).toEqual({ name: 'Ana' });
    profile.reset({ name: 'Marco' });
    TestBed.tick();
    TestBed.resetTestingModule();
    vi.advanceTimersByTime(10);
    expect(name()).toBe('Ana');
    expect(value()).toEqual({ name: 'Ana' });
  });
});
