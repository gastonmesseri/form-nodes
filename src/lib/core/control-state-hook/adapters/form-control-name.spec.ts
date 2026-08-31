// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, forwardRef } from '@angular/core';
import { afterAll, afterEach, beforeAll, beforeEach, describe } from 'vitest';
import { FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, type ControlValueAccessor } from '@angular/forms';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { injectFormControlNameStateAdapter } from './form-control-name';
import { runAbstractControlAdapterContract } from '../../../../../tests/helpers/control-state-adapter-contract';

@Component({
  selector: 'control-name-adapter-control',
  template: '',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ControlNameAdapterControl), multi: true }],
})
class ControlNameAdapterControl implements ControlValueAccessor {
  state = injectFormControlNameStateAdapter<string>();
  writeValue() {}
  registerOnChange() {}
  registerOnTouched() {}
}

@Component({
  template: `<form [formGroup]="form"><control-name-adapter-control formControlName="name" /></form>`,
  standalone: true,
  imports: [ControlNameAdapterControl, ReactiveFormsModule],
})
class Host {
  name = new FormControl('', { nonNullable: true });
  form = new FormGroup({ name: this.name });
}

const createControlState = async () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const state = (fixture.debugElement.children[0]!.children[0]!.componentInstance as ControlNameAdapterControl).state;
  return { control: fixture.componentInstance.name, fixture, state };
};

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('formControlName control-state adapter', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());
  runAbstractControlAdapterContract('formControlName', createControlState, 'name');
});
