// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, input, model, output } from '@angular/core';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { discoverSignalControl } from './discover-signal-control';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../../../../testing/register-signal-input-for-jit';

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('discoverSignalControl', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());

  it('discovers value and checked models from Angular component metadata', () => {
    @Component({ standalone: true, selector: 'value-control', template: '' })
    class ValueControl { value = model(''); }
    @Component({ standalone: true, selector: 'checked-control', template: '' })
    class CheckedControl { checked = model(false); }
    @Component({ standalone: true, selector: 'paired-control', template: '' })
    class PairedControl { value = input(''); valueChange = output<string>(); }
    registerSignalModelForJit(ValueControl, 'value');
    registerSignalModelForJit(CheckedControl, 'checked');
    registerSignalModelForJit(PairedControl, 'value');

    const valueFixture = TestBed.createComponent(ValueControl);
    const checkedFixture = TestBed.createComponent(CheckedControl);
    const pairedFixture = TestBed.createComponent(PairedControl);
    expect(discoverSignalControl(valueFixture.nativeElement)).toBe(valueFixture.componentInstance);
    expect(discoverSignalControl(checkedFixture.nativeElement)).toBe(checkedFixture.componentInstance);
    expect(discoverSignalControl(pairedFixture.nativeElement)).toBe(pairedFixture.componentInstance);
  });

  it('rejects an ordinary input and the owning component of a native child element', () => {
    @Component({ standalone: true, selector: 'ordinary-control', template: '<div></div>' })
    class OrdinaryControl { value = input(''); }
    registerSignalInputForJit(OrdinaryControl, 'value', 'value');

    const fixture = TestBed.createComponent(OrdinaryControl);
    fixture.detectChanges();
    expect(discoverSignalControl(fixture.nativeElement)).toBeNull();
    expect(discoverSignalControl(fixture.nativeElement.querySelector('div'))).toBeNull();
  });
});
