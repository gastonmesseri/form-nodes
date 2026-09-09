import '@angular/compiler';
import moment from 'moment';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatInputModule } from '@angular/material/input';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, FormNodeDirective } from '../../../src/public-api';
import { registerSignalInputForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
registerSignalOutputForJit(FormNodeDirective, 'formNodeValueChange');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

@Component({
  template: '<input matInput [matDatepicker]="picker" [formNode]="profile.date" (formNodeValueChange)="events.push($event)" /><mat-datepicker #picker />',
  imports: [MatInputModule, MatDatepickerModule, FormNodeDirective],
  providers: [provideMomentDateAdapter({ parse: { dateInput: 'MM/DD/YYYY' }, display: { dateInput: 'MM/DD/YYYY', monthYearLabel: 'MMM YYYY', dateA11yLabel: 'LL', monthYearA11yLabel: 'MMMM YYYY' } }, { strict: true })],
})
class Host {
  profile = form({ date: field<moment.Moment>(moment('2025-01-10')) });

  events: unknown[] = [];
}

it('round-trips Moment dates, propagates parse errors and restores values through ancestor reset', async () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.componentInstance;
  const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
  expect(input.value).toBe('01/10/2025');
  input.value = '01/15/2025';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  expect(moment.isMoment(host.profile.date())).toBe(true);
  expect(host.profile.date()?.format('YYYY-MM-DD')).toBe('2025-01-15');
  expect(host.events).toHaveLength(1);
  input.value = 'invalid';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
  await fixture.whenStable();
  expect(host.profile.date.invalid()).toBe(true);
  expect(host.profile.invalid()).toBe(true);
  const count = host.events.length;
  host.profile.resetToInitial();
  fixture.detectChanges();
  await fixture.whenStable();
  expect(input.value).toBe('01/10/2025');
  expect(host.profile.date()?.format('YYYY-MM-DD')).toBe('2025-01-10');
  expect(host.profile.valid()).toBe(true);
  expect(host.profile.date.errors()).toEqual([]);
  expect(host.events).toHaveLength(count);
  fixture.destroy();
});
