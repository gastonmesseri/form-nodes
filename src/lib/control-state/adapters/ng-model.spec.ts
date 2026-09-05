// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, forwardRef } from '@angular/core';
import { afterAll, afterEach, beforeAll, beforeEach, describe } from 'vitest';
import { FormControl, FormsModule, NG_VALUE_ACCESSOR, NgControl, type ControlValueAccessor } from '@angular/forms';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { injectNgModelControlStateAdapter } from './ng-model';
import { runAbstractControlAdapterContract } from '../../../../tests/helpers/control-state-adapter-contract';

@Component({
  selector: 'ng-model-adapter-control',
  template: '',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NgModelAdapterControl), multi: true }],
})
class NgModelAdapterControl implements ControlValueAccessor {
  state = injectNgModelControlStateAdapter<string>();
  writeValue() {}
  registerOnChange() {}
  registerOnTouched() {}
}

@Component({
  template: `<ng-model-adapter-control name="name" [(ngModel)]="name" [ngModelOptions]="{ standalone: true }" />`,
  standalone: true,
  imports: [FormsModule, NgModelAdapterControl],
})
class Host {
  name = '';
}

const createControlState = async () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const element = fixture.debugElement.children[0]!;
  const state = (element.componentInstance as NgModelAdapterControl).state;
  const control = element.injector.get(NgControl).control as FormControl<string>;
  return { control, fixture, state };
};

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

describe('ngModel control-state adapter', () => {
  beforeEach(() => TestBed.configureTestingModule({}));
  afterEach(() => TestBed.resetTestingModule());
  runAbstractControlAdapterContract('ngModel', createControlState, 'name');
});
