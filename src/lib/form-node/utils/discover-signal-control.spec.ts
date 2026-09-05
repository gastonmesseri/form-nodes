// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, input, model, output } from '@angular/core';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { discoverSignalControl } from './discover-signal-control';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../../tests/helpers/register-signal-input-for-jit';

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('discoverSignalControl', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());

  it('discovers value and checked models from Angular component metadata', () => {
    @Component({
      selector: 'value-control',
      template: '',
      standalone: true,
    })
    class ValueControl { value = model(''); }
    @Component({
      selector: 'checked-control',
      template: '',
      standalone: true,
    })
    class CheckedControl { checked = model(false); }
    @Component({
      selector: 'paired-control',
      template: '',
      standalone: true,
    })
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
    @Component({
      selector: 'ordinary-control',
      template: '<div></div>',
      standalone: true,
    })
    class OrdinaryControl { value = input(''); }
    registerSignalInputForJit(OrdinaryControl, 'value', 'value');

    const fixture = TestBed.createComponent(OrdinaryControl);
    fixture.detectChanges();
    expect(discoverSignalControl(fixture.nativeElement)).toBeNull();
    expect(discoverSignalControl(fixture.nativeElement.querySelector('div'))).toBeNull();
  });
});
