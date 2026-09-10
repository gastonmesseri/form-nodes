import '@angular/compiler';
import { providePrimeNG } from 'primeng/config';
import { Component, signal } from '@angular/core';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, FormNodeDirective } from '../../../src/public-api';
import { registerSignalInputForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
registerSignalOutputForJit(FormNodeDirective, 'formNodeValueChange');
registerSignalOutputForJit(FormNodeDirective, 'formNodeControlValueChange');
beforeAll(() => {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  TestBed.configureTestingModule({ providers: [providePrimeNG({ unstyled: true })] });
});
afterAll(() => TestBed.resetTestEnvironment());
const fixtures: ComponentFixture<unknown>[] = [];
afterEach(() => { for (const fixture of fixtures.splice(0)) fixture.destroy(); });
const settle = async (fixture: ComponentFixture<unknown>) => {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  fixture.detectChanges();
};

@Component({
  selector: 'rich-values-regression',
  template: `
    <p-inputnumber class="number" [locale]="locale()" [minFractionDigits]="2" [formNode]="profile.amount" (formNodeValueChange)="numberEvents.push($event)" />
    <p-inputnumber class="number-baseline" [locale]="locale()" [minFractionDigits]="2" [formControl]="amount" />
    <p-inputmask class="mask" mask="99-99" [formNode]="profile.code" (formNodeValueChange)="maskEvents.push($event)" />
    <p-inputmask class="mask-baseline" mask="99-99" [formControl]="code" />
    <p-autocomplete class="choice" optionLabel="label" dataKey="id" [forceSelection]="true" [suggestions]="suggestions()" [delay]="0" (completeMethod)="queries.push($event.query)" [formNode]="profile.choice" (formNodeValueChange)="choiceEvents.push($event)" />
  `,
  imports: [FormNodeDirective, ReactiveFormsModule, InputNumberModule, InputMaskModule, AutoCompleteModule],
})
class RichValuesHost {
  profile = form({ amount: field(1234.5), code: field('12-34'), choice: field({ id: 1, label: 'First' }) });

  amount = new FormControl(1234.5);

  code = new FormControl('12-34');

  locale = signal('de-DE');

  suggestions = signal<{ id: number; label: string }[]>([]);

  queries: string[] = [];

  numberEvents: unknown[] = [];

  maskEvents: unknown[] = [];

  choiceEvents: unknown[] = [];
}

const setup = async () => {
  const fixture = TestBed.createComponent(RichValuesHost);
  fixtures.push(fixture);
  await settle(fixture);
  const input = (name: string) => fixture.nativeElement.querySelector(`.${name} input`) as HTMLInputElement;
  const type = (name: string, text: string) => {
    const element = input(name);
    element.focus();
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  };
  return { fixture, host: fixture.componentInstance, input, type };
};

it('parses localized numeric input like Reactive Forms and reformats after locale changes and reset', async () => {
  const { fixture, host, input, type } = await setup();
  expect(input('number').value).toBe('1.234,50');
  for (const name of ['number', 'number-baseline']) {
    type(name, '1.234,75');
    input(name).blur();
  }
  await settle(fixture);
  expect(host.profile.amount()).toBe(1234.75);
  expect(host.profile.amount()).toBe(host.amount.value);
  expect(input('number').value).toBe(input('number-baseline').value);
  expect(host.numberEvents).toEqual([1234.75]);
  host.locale.set('en-US');
  await settle(fixture);
  expect(input('number').value).toBe('1,234.75');
  host.profile.resetToInitial();
  await settle(fixture);
  expect(input('number').value).toBe('1,234.50');
  expect(host.numberEvents).toEqual([1234.75]);
});

it('handles partial masks and clears incomplete text like Reactive Forms without reset outputs', async () => {
  const { fixture, host, input, type } = await setup();
  for (const name of ['mask', 'mask-baseline']) {
    type(name, '5');
    input(name).blur();
  }
  await settle(fixture);
  expect(input('mask').value).toBe(input('mask-baseline').value);
  expect(host.profile.code()).toBe(host.code.value);
  const count = host.maskEvents.length;
  host.profile.resetToInitial();
  await settle(fixture);
  expect(input('mask').value).toBe('12-34');
  expect(host.maskEvents).toHaveLength(count);
});

it('keeps autocomplete search text separate until an asynchronous object suggestion is selected', async () => {
  const { fixture, host, input, type } = await setup();
  type('choice', 'Sec');
  await settle(fixture);
  expect(host.profile.choice()).toEqual({ id: 1, label: 'First' });
  expect(host.choiceEvents).toEqual([]);
  expect(host.queries).toContain('Sec');
  host.suggestions.set([{ id: 2, label: 'Second' }]);
  await settle(fixture);
  const option = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]')).find(item => item.textContent?.trim() === 'Second');
  expect(option).toBeDefined();
  option!.click();
  await settle(fixture);
  expect(host.profile.choice()).toEqual({ id: 2, label: 'Second' });
  expect(host.choiceEvents).toEqual([{ id: 2, label: 'Second' }]);
  type('choice', 'unselected draft');
  host.profile.reset();
  await settle(fixture);
  expect(input('choice').value).toBe('Second');
  host.profile.resetToInitial();
  await settle(fixture);
  expect(input('choice').value).toBe('First');
  expect(host.choiceEvents).toHaveLength(1);
});
