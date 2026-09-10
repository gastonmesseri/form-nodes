import '@angular/compiler';
import { Component } from '@angular/core';
import { userEvent } from '@vitest/browser/context';
import { MatInputModule } from '@angular/material/input';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, FormNodeDirective } from '../../../src/public-api';
import { registerSignalInputForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
registerSignalOutputForJit(FormNodeDirective, 'formNodeValueChange');
registerSignalOutputForJit(FormNodeDirective, 'formNodeControlValueChange');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());
const settle = async (fixture: ComponentFixture<unknown>) => {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
};

@Component({
  selector: 'material-range-regression',
  template: `
    <mat-date-range-input [rangePicker]="picker">
      <input matStartDate [formNode]="profile.start" (formNodeValueChange)="events.push($event)" />
      <input matEndDate [formNode]="profile.end" (formNodeValueChange)="events.push($event)" />
    </mat-date-range-input>
    <mat-date-range-picker #picker />
  `,
  imports: [FormNodeDirective, MatDatepickerModule],
  providers: [provideNativeDateAdapter()],
})
class RangeHost {
  profile = form({ start: field<Date>(null), end: field<Date>(null) });

  events: unknown[] = [];
}

it('accepts a partial date range, validates its ordering and clears both views on parent reset', async () => {
  const fixture = TestBed.createComponent(RangeHost);
  try {
    await settle(fixture);
    const host = fixture.componentInstance;
    const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    const type = async (index: number, value: string) => {
      inputs[index]!.value = value;
      inputs[index]!.dispatchEvent(new Event('input', { bubbles: true }));
      await settle(fixture);
    };
    await type(0, '1/10/2025');
    expect(host.profile()).toEqual({ start: new Date(2025, 0, 10), end: null });
    await type(1, '1/5/2025');
    expect(host.profile.invalid()).toBe(true);
    expect(host.profile.end.errors().map(error => error.kind)).toContain('matEndDateInvalid');
    await type(1, '1/15/2025');
    expect(host.profile.valid()).toBe(true);
    expect(host.profile.end()).toEqual(new Date(2025, 0, 15));
    const count = host.events.length;
    host.profile.resetToInitial();
    await settle(fixture);
    expect(Array.from(inputs, input => input.value)).toEqual(['', '']);
    expect(host.profile()).toEqual({ start: null, end: null });
    expect(host.profile.valid()).toBe(true);
    expect(host.profile.untouched()).toBe(true);
    expect(host.events).toHaveLength(count);
  } finally {
    fixture.destroy();
  }
});

@Component({
  selector: 'material-text-input-regression',
  template: '<textarea matInput [formNode]="profile.text" (formNodeControlValueChange)="record($event, false)" (formNodeValueChange)="record($event, true)"></textarea>',
  imports: [MatInputModule, FormNodeDirective],
})
class TextHost {
  profile = form({ text: field('Ada', { debounce: 'blur' }) });

  immediate: string[] = [];

  committed: string[] = [];

  record(value: string, committed: boolean) {
    expect(committed ? this.profile.text() : this.profile.text.value.control()).toBe(value);
    (committed ? this.committed : this.immediate).push(value);
  }
}

it('buffers composition events, commits on blur and deduplicates trailing input', async () => {
  const fixture = TestBed.createComponent(TextHost);
  try {
    await settle(fixture);
    const host = fixture.componentInstance;
    const input: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '日本語';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true, data: '語' }));
    expect(host.profile.text.value.control()).toBe('Ada');
    expect(host.immediate).toEqual([]);
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '日本語' }));
    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: '日本語' }));
    expect(host.profile.text()).toBe('Ada');
    expect(host.immediate).toEqual(['日本語']);
    input.dispatchEvent(new Event('blur'));
    await settle(fixture);
    expect(host.committed).toEqual(['日本語']);
    expect(host.profile.text()).toBe('日本語');
  } finally {
    fixture.destroy();
  }
});

it('handles browser-driven replacement and clearing without stale output snapshots', async () => {
  const fixture = TestBed.createComponent(TextHost);
  try {
    await settle(fixture);
    const host = fixture.componentInstance;
    const input: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    await userEvent.fill(input, 'Replacement');
    expect(host.immediate.at(-1)).toBe('Replacement');
    expect(host.profile.text()).toBe('Ada');
    await userEvent.clear(input);
    expect(host.immediate.at(-1)).toBe('');
    host.profile.resetToInitial();
    await settle(fixture);
    expect(input.value).toBe('Ada');
    expect(host.committed).toEqual([]);
    expect(host.profile.pristine()).toBe(true);
  } finally {
    fixture.destroy();
  }
});
