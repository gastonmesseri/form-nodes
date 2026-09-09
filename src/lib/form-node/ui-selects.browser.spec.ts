import '@angular/compiler';
import { SelectModule } from 'primeng/select';
import { providePrimeNG } from 'primeng/config';
import { Component, signal } from '@angular/core';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, FormNodeDirective } from '../../../src/public-api';
import { registerSignalInputForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
registerSignalOutputForJit(FormNodeDirective, 'formNodeValueChange');
beforeAll(() => {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  TestBed.configureTestingModule({ providers: [providePrimeNG({ unstyled: true }), provideNoopAnimations()] });
});
afterAll(() => TestBed.resetTestEnvironment());
const fixtures: ComponentFixture<unknown>[] = [];
afterEach(() => {
  for (const fixture of fixtures.splice(0)) fixture.destroy();
});

@Component({
  selector: 'ui-select-regression-host',
  template: `
    <section class="node">
      @if (prime()) {
        <p-select [options]="options()" [formNode]="profile.choice" (formNodeValueChange)="record($event)" />
      } @else {
        <nz-select [formNode]="profile.choice" (formNodeValueChange)="record($event)">
          @for (option of options(); track option) { <nz-option [nzValue]="option" [nzLabel]="option" /> }
        </nz-select>
      }
    </section>
    <section class="baseline">
      @if (prime()) {
        <p-select [options]="options()" [formControl]="baseline" />
      } @else {
        <nz-select [formControl]="baseline">
          @for (option of options(); track option) { <nz-option [nzValue]="option" [nzLabel]="option" /> }
        </nz-select>
      }
    </section>
  `,
  imports: [FormNodeDirective, SelectModule, NzSelectModule, ReactiveFormsModule],
})
class UiSelectHost {
  prime = signal(true);

  profile = form({ choice: field('A') });

  baseline = new FormControl('A');

  options = signal<string[]>([]);

  events: unknown[] = [];

  record(value: unknown) {
    expect(this.profile.choice()).toBe(value);
    this.events.push(value);
  }
}

const settle = async (fixture: ComponentFixture<unknown>) => {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  fixture.detectChanges();
};

it.each(['PrimeNG', 'NG-ZORRO'])('selects late options, commits overlay selection and restores the initial value: %s', async (library) => {
  const fixture = TestBed.createComponent(UiSelectHost);
  fixtures.push(fixture);
  const host = fixture.componentInstance;
  host.prime.set(library === 'PrimeNG');
  await settle(fixture);
  host.options.set(['A', 'B']);
  await settle(fixture);
  const label = host.prime() ? '[data-pc-section="label"]' : 'nz-select-item';
  const displayed = (scope: string) => fixture.nativeElement.querySelector(`.${scope} ${label}`)?.textContent?.trim();
  expect(displayed('node')).toBe('A');
  expect(displayed('node')).toBe(displayed('baseline'));
  host.profile.choice.set('B');
  host.baseline.setValue('B');
  await settle(fixture);
  expect(displayed('node')).toBe('B');
  host.options.set([]);
  await settle(fixture);
  host.options.set(['B', 'A']);
  await settle(fixture);
  expect(displayed('node')).toBe('B');
  expect(host.events).toEqual([]);
  const trigger: HTMLElement = fixture.nativeElement.querySelector(host.prime() ? '.node p-select' : '.node nz-select');
  trigger.click();
  await settle(fixture);
  const optionSelector = host.prime() ? '[role="option"]' : 'nz-option-item';
  const option = Array.from(document.querySelectorAll<HTMLElement>(optionSelector)).find(item => item.textContent?.trim() === 'A');
  expect(option).toBeDefined();
  option!.click();
  await settle(fixture);
  expect(host.profile.choice()).toBe('A');
  expect(host.events).toEqual(['A']);
  expect(host.profile.dirty()).toBe(true);
  host.profile.choice.set('B');
  await settle(fixture);
  host.profile.resetToInitial();
  await settle(fixture);
  expect(displayed('node')).toBe('A');
  expect(host.profile.dirty()).toBe(false);
  expect(host.events).toEqual(['A']);
});
