// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, input, model } from '@angular/core';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { discoverCustomControl } from './discover-custom-control';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../../../tests/helpers/register-signal-input-for-jit';

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('discoverCustomControl', () => {
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
    registerSignalModelForJit(ValueControl, 'value');
    registerSignalModelForJit(CheckedControl, 'checked');

    const valueFixture = TestBed.createComponent(ValueControl);
    const checkedFixture = TestBed.createComponent(CheckedControl);
    expect(discoverCustomControl(valueFixture.nativeElement)).toBe(valueFixture.componentInstance);
    expect(discoverCustomControl(checkedFixture.nativeElement)).toBe(checkedFixture.componentInstance);
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
    expect(discoverCustomControl(fixture.nativeElement)).toBeNull();
    expect(discoverCustomControl(fixture.nativeElement.querySelector('div'))).toBeNull();
  });
});
