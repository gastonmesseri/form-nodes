import '@angular/compiler';
import { Component, signal } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, FormNodeDirective, type AnyNode } from '../../../src/public-api';
import { registerSignalInputForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
registerSignalOutputForJit(FormNodeDirective, 'formNodeValueChange');
registerSignalOutputForJit(FormNodeDirective, 'formNodeControlValueChange');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

const kinds = ['text', 'input', 'checkbox', 'radio', 'select', 'date'] as const;
type Kind = typeof kinds[number];

@Component({
  template: `
    @if (visible()) {
      <section class="node">
        @switch (kind()) {
          @case ('input') { <mat-form-field><input matInput [formNode]="node()" (formNodeControlValueChange)="record($event, false)" (formNodeValueChange)="record($event, true)" /></mat-form-field> }
          @case ('text') { <mat-form-field><textarea matInput [formNode]="node()" (formNodeControlValueChange)="record($event, false)" (formNodeValueChange)="record($event, true)"></textarea></mat-form-field> }
          @case ('checkbox') { <mat-checkbox [formNode]="node()" (formNodeControlValueChange)="record($event, false)" (formNodeValueChange)="record($event, true)">Agree</mat-checkbox> }
          @case ('radio') {
            <mat-radio-group [formNode]="node()" (formNodeControlValueChange)="record($event, false)" (formNodeValueChange)="record($event, true)">
              @for (option of options(); track option) { <mat-radio-button [value]="option">{{ option }}</mat-radio-button> }
            </mat-radio-group>
          }
          @case ('select') {
            <mat-form-field><mat-select [formNode]="node()" (formNodeControlValueChange)="record($event, false)" (formNodeValueChange)="record($event, true)">
              @for (option of options(); track option) { <mat-option [value]="option">{{ option }}</mat-option> }
            </mat-select></mat-form-field>
          }
          @case ('date') {
            <mat-form-field>
              <input matInput [matDatepicker]="picker" [formNode]="node()" (formNodeControlValueChange)="record($event, false)" (formNodeValueChange)="record($event, true)" />
              <mat-datepicker-toggle matSuffix [for]="picker" /><mat-datepicker #picker />
            </mat-form-field>
          }
        }
      </section>
    }
    <section class="baseline">
      @switch (kind()) {
        @case ('input') { <input matInput [formControl]="baseline" /> }
        @case ('text') { <textarea matInput [formControl]="baseline"></textarea> }
        @case ('checkbox') { <mat-checkbox [formControl]="baseline">Agree</mat-checkbox> }
        @case ('radio') { <mat-radio-group [formControl]="baseline"><mat-radio-button value="A">A</mat-radio-button><mat-radio-button value="B">B</mat-radio-button></mat-radio-group> }
        @case ('select') { <mat-select [formControl]="baseline"><mat-option value="A">A</mat-option><mat-option value="B">B</mat-option></mat-select> }
        @case ('date') { <input matInput [matDatepicker]="baselinePicker" [formControl]="baseline" /><mat-datepicker #baselinePicker /> }
      }
    </section>
  `,
  imports: [MatInputModule, MatRadioModule, MatSelectModule, MatCheckboxModule, MatFormFieldModule, MatDatepickerModule, ReactiveFormsModule, FormNodeDirective],
  providers: [provideNativeDateAdapter()],
})
class MaterialHost {
  profile = form({ text: field('Ada'), choice: field('A'), flag: field(false), date: field<Date>(new Date(2025, 0, 10)) });

  node = signal<AnyNode>(this.profile.text);

  kind = signal<Kind>('text');

  visible = signal(true);

  options = signal(['A', 'B']);

  baseline = new FormControl<unknown>('Ada');

  immediate: unknown[] = [];

  committed: unknown[] = [];

  afterEvent = (_committed: boolean) => {};

  committedAtInput: unknown[] = [];

  record(value: unknown, committed: boolean) {
    expect(committed ? this.node()() : this.node().$api.value.control()).toEqual(value);
    if (!committed) this.committedAtInput.push(this.node()());
    (committed ? this.committed : this.immediate).push(value);
    this.afterEvent(committed);
  }
}

const settle = async (fixture: ComponentFixture<unknown>) => {
  if (fixture.componentRef.hostView.destroyed) return;
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
};

const setup = async (kind: Kind, debounce = false, disabled = false, suppressEqual = false) => {
  const fixture = TestBed.createComponent(MaterialHost);
  const host = fixture.componentInstance;
  host.kind.set(kind);
  const initial = (kind === 'text' || kind === 'input') ? 'Ada' : kind === 'checkbox' ? false : kind === 'date' ? new Date(2025, 0, 10) : 'A';
  const profile = form({ control: field(initial, { disabled, ...(suppressEqual ? { equal: () => true } : {}), ...(debounce ? { debounce: 'blur' as const } : {}) }) });
  const node = profile.control;
  host.node.set(node);
  host.baseline.setValue(initial);
  if (disabled) host.baseline.disable();
  await settle(fixture);
  return { fixture, host, node, initial, profile };
};

const view = (root: HTMLElement, kind: Kind) => {
  if (kind === 'select') return root.querySelector('.mat-mdc-select-value')?.textContent?.trim();
  if (kind === 'radio') return Array.from(root.querySelectorAll<HTMLInputElement>('input')).filter(input => input.checked).map(input => input.value);
  const input = root.querySelector<HTMLInputElement>('input, textarea')!;
  return kind === 'checkbox' ? input.checked : input.value;
};

const edit = async (fixture: ComponentFixture<MaterialHost>, kind: Kind) => {
  const root: HTMLElement = fixture.nativeElement.querySelector('.node');
  if (kind === 'select') {
    root.querySelector<HTMLElement>('mat-select')!.click();
    await settle(fixture);
    const option = Array.from(document.querySelectorAll<HTMLElement>('mat-option')).find(option => option.textContent?.trim() === 'B');
    expect(option).toBeDefined();
    option!.click();
  } else if (kind === 'radio') {
    root.querySelectorAll<HTMLInputElement>('input')[1]!.click();
  } else if (kind === 'checkbox') {
    root.querySelector<HTMLInputElement>('input')!.click();
  } else {
    const input = root.querySelector<HTMLInputElement>('input, textarea')!;
    input.value = kind === 'date' ? '1/15/2025' : 'Grace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
};

it.each(kinds)('matches Reactive Forms initial rendering and supports reset, rebinding and recreation: %s', async (kind) => {
  const { fixture, host, node, initial, profile } = await setup(kind);
  const root = () => fixture.nativeElement.querySelector('.node') as HTMLElement;
  const expected = view(fixture.nativeElement.querySelector('.baseline'), kind);
  expect(view(root(), kind)).toEqual(expected);
  expect(node.$api.dirty()).toBe(false);
  expect(node.$api.touched()).toBe(false);
  await edit(fixture, kind);
  expect(node()).not.toEqual(initial);
  expect(node.$api.dirty()).toBe(true);
  expect(host.immediate).toHaveLength(1);
  expect(host.committed).toHaveLength(1);
  await settle(fixture);
  profile.resetToInitial();
  expect(node()).toEqual(initial);
  await settle(fixture);
  expect(view(root(), kind)).toEqual(expected);
  expect(node.$api.dirty()).toBe(false);
  expect(node.$api.touched()).toBe(false);
  node.reset();
  await settle(fixture);
  expect(host.committed).toHaveLength(1);
  expect(host.immediate).toHaveLength(1);
  const replacement = field(initial);
  host.node.set(replacement);
  await settle(fixture);
  node.set(null);
  node.reset();
  await settle(fixture);
  expect(view(root(), kind)).toEqual(expected);
  await edit(fixture, kind);
  expect(replacement()).not.toEqual(initial);
  expect(node()).toBeNull();
  await settle(fixture);
  replacement.set(null);
  host.baseline.setValue(null);
  await settle(fixture);
  expect(view(root(), kind)).toEqual(view(fixture.nativeElement.querySelector('.baseline'), kind));
  host.visible.set(false);
  await settle(fixture);
  replacement.resetToInitial();
  host.visible.set(true);
  await settle(fixture);
  expect(view(root(), kind)).toEqual(expected);
  expect(host.committed).toHaveLength(2);
  fixture.destroy();
});

it.each(kinds)('renders disabled state and re-enables user interaction: %s', async (kind) => {
  const { fixture, host, profile } = await setup(kind);
  profile.disable();
  host.baseline.disable();
  await settle(fixture);
  const root: HTMLElement = fixture.nativeElement.querySelector('.node');
  if (kind === 'select') expect(root.querySelector('mat-select')!.getAttribute('aria-disabled')).toBe('true');
  else expect(root.querySelector<HTMLInputElement>('input, textarea')!.disabled).toBe(true);
  expect(host.committed).toEqual([]);
  profile.enable();
  await settle(fixture);
  await edit(fixture, kind);
  expect(host.committed).toHaveLength(1);
  fixture.destroy();
});

it.each(['text', 'input', 'checkbox', 'radio', 'date'] as const)('keeps pending control input separate and commits it on blur: %s', async (kind) => {
  const { fixture, host, node, initial } = await setup(kind, true);
  await edit(fixture, kind);
  expect(node()).toEqual(initial);
  expect(node.$api.debouncing()).toBe(true);
  expect(host.immediate).toHaveLength(1);
  expect(host.committedAtInput).toEqual([initial]);
  expect(host.committed).toEqual([]);
  const input: HTMLElement = fixture.nativeElement.querySelector('.node input, .node textarea');
  input.focus();
  input.blur();
  await settle(fixture);
  expect(node.$api.touched()).toBe(true);
  expect(node.$api.debouncing()).toBe(false);
  expect(host.committed).toHaveLength(1);
  fixture.destroy();
});

it.each(['radio', 'select'] as const)('selects late options and survives option replacement: %s', async (kind) => {
  const { fixture, host, node } = await setup(kind);
  host.options.set([]);
  node.set('B');
  await settle(fixture);
  host.options.set(['B', 'A']);
  await settle(fixture);
  expect(view(fixture.nativeElement.querySelector('.node'), kind)).toEqual(kind === 'radio' ? ['B'] : 'B');
  host.options.set(['A']);
  await settle(fixture);
  host.options.set(['A', 'B']);
  await settle(fixture);
  expect(view(fixture.nativeElement.querySelector('.node'), kind)).toEqual(kind === 'radio' ? ['B'] : 'B');
  expect(host.committed).toEqual([]);
  fixture.destroy();
});

it.each(['radio', 'checkbox'] as const)('matches Reactive Forms when reset precedes Material checked-state rendering: %s', async (kind) => {
  const { fixture, host, node, initial } = await setup(kind);
  await edit(fixture, kind);
  const inputs = fixture.nativeElement.querySelectorAll('.baseline input');
  inputs[kind === 'radio' ? 1 : 0].click();
  node.resetToInitial();
  host.baseline.reset(initial);
  await settle(fixture);
  expect(node()).toEqual(initial);
  expect(host.baseline.value).toEqual(initial);
  // Material can retain the browser's checked state if both changes precede a render.
  // Compare against its Reactive Forms behavior rather than claiming synchronous DOM restoration.
  expect(view(fixture.nativeElement.querySelector('.node'), kind)).toEqual(view(fixture.nativeElement.querySelector('.baseline'), kind));
  node.set(kind === 'checkbox' ? true : 'B');
  await settle(fixture);
  node.resetToInitial();
  await settle(fixture);
  expect(view(fixture.nativeElement.querySelector('.node'), kind)).toEqual(kind === 'checkbox' ? false : ['A']);
  fixture.destroy();
});

it('clears datepicker parse errors and pending text when reset keeps the same committed date', async () => {
  const { fixture, host, node, initial } = await setup('date', true);
  const input: HTMLInputElement = fixture.nativeElement.querySelector('.node input');
  input.value = 'not a date';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await settle(fixture);
  expect(node()).toEqual(initial);
  expect(node.$api.invalid()).toBe(true);
  expect(node.$api.errors().some(error => error.kind === 'matDatepickerParse')).toBe(true);
  node.reset();
  await settle(fixture);
  expect(input.value).toBe('1/10/2025');
  expect(node.$api.errors()).toEqual([]);
  expect(node.$api.debouncing()).toBe(false);
  expect(host.committed).toEqual([]);
  fixture.destroy();
});

it('commits datepicker calendar selection with the latest Date in the output', async () => {
  const { fixture, host, node } = await setup('date');
  fixture.nativeElement.querySelector('.node mat-datepicker-toggle button').click();
  await settle(fixture);
  const day = Array.from(document.querySelectorAll<HTMLElement>('mat-calendar .mat-calendar-body-cell')).find(cell => cell.textContent?.trim() === '15');
  expect(day).toBeDefined();
  day!.click();
  await settle(fixture);
  expect(node()).toEqual(new Date(2025, 0, 15));
  expect(host.immediate).toEqual([new Date(2025, 0, 15)]);
  expect(host.committed).toEqual([new Date(2025, 0, 15)]);
  expect(node.$api.dirty()).toBe(true);
  fixture.destroy();
});

@Component({
  template: `
    <mat-select class="single" [compareWith]="sameId" [formNode]="profile.single" (formNodeValueChange)="events.push($event)">
      @for (option of options(); track option.id) { <mat-option [value]="option">{{ option.label }}</mat-option> }
    </mat-select>
    <mat-select class="multiple" multiple [compareWith]="sameId" [formNode]="profile.multiple" (formNodeValueChange)="events.push($event)">
      @for (option of options(); track option.id) { <mat-option [value]="option">{{ option.label }}</mat-option> }
    </mat-select>
  `,
  imports: [MatSelectModule, FormNodeDirective],
})
class ObjectSelectHost {
  profile = form({ single: field({ id: 2, label: 'B' }), multiple: field([{ id: 1, label: 'A' }]) });

  options = signal([{ id: 1, label: 'A' }, { id: 2, label: 'B' }]);

  events: unknown[] = [];

  sameId = (a: { id: number } | null, b: { id: number } | null) => a?.id === b?.id;
}

it('preserves object selections with compareWith, multiple values and recreated options', async () => {
  const fixture = TestBed.createComponent(ObjectSelectHost);
  await settle(fixture);
  const host = fixture.componentInstance;
  const selected = (name: string) => fixture.nativeElement.querySelector(`.${name} .mat-mdc-select-value`).textContent.trim();
  expect(selected('single')).toBe('B');
  expect(selected('multiple')).toBe('A');
  host.options.set([{ id: 1, label: 'First' }, { id: 2, label: 'Second' }]);
  await settle(fixture);
  expect(selected('single')).toBe('Second');
  expect(selected('multiple')).toBe('First');
  fixture.nativeElement.querySelector('.multiple .mat-mdc-select-trigger').click();
  await settle(fixture);
  const option = Array.from(document.querySelectorAll<HTMLElement>('mat-option')).find(option => option.textContent?.trim() === 'Second');
  expect(option).toBeDefined();
  option!.click();
  await settle(fixture);
  expect(host.profile.multiple()?.map(value => value.id)).toEqual([1, 2]);
  expect(host.events).toHaveLength(1);
  document.querySelector<HTMLElement>('.cdk-overlay-backdrop')?.click();
  await settle(fixture);
  host.profile.resetToInitial();
  await settle(fixture);
  expect(selected('multiple')).toBe('First');
  expect(selected('single')).toBe('Second');
  expect(host.events).toHaveLength(1);
  fixture.destroy();
});

it.each(kinds)('applies initial disabled state without emitting a user change: %s', async (kind) => {
  const { fixture, host, node } = await setup(kind, false, true);
  const root: HTMLElement = fixture.nativeElement.querySelector('.node');
  expect(view(root, kind)).toEqual(view(fixture.nativeElement.querySelector('.baseline'), kind));
  if (kind === 'select') {
    const select = root.querySelector<HTMLElement>('mat-select')!;
    expect(select.getAttribute('aria-disabled')).toBe('true');
    select.querySelector<HTMLElement>('.mat-mdc-select-trigger')!.click();
    await settle(fixture);
    expect(select.getAttribute('aria-expanded')).toBe('false');
  } else {
    const input = root.querySelector<HTMLInputElement>('input, textarea')!;
    expect(input.disabled).toBe(true);
    input.click();
  }
  expect(host.immediate).toEqual([]);
  expect(host.committed).toEqual([]);
  expect(node.$api.dirty()).toBe(false);
  fixture.destroy();
});

it('commits a blur-debounced select when its user selection closes the panel', async () => {
  const { fixture, host, node, initial } = await setup('select', true);
  await edit(fixture, 'select');
  await settle(fixture);
  expect(host.immediate).toEqual(['B']);
  expect(host.committedAtInput).toEqual([initial]);
  expect(host.committed).toEqual(['B']);
  expect(node()).toBe('B');
  expect(node.$api.touched()).toBe(true);
  expect(node.$api.debouncing()).toBe(false);
  fixture.destroy();
});

// An always-equal comparator deliberately stresses the separation between public and control values.
it.each(kinds.flatMap(kind => [false, true].map(debounce => ({ kind, debounce }))))('renders and resets equality-suppressed values: $kind, debounce=$debounce', async ({ kind, debounce }) => {
  const { fixture, host, node, profile, initial } = await setup(kind, debounce, false, true);
  try {
    const root = () => fixture.nativeElement.querySelector('.node') as HTMLElement;
    const initialView = view(root(), kind);
    expect(node()).toEqual(initial);
    expect(profile()).toEqual({ control: initial });
    await edit(fixture, kind);
    await settle(fixture);
    const edited = node.value.control();
    const editedView = view(root(), kind);
    expect(edited).not.toEqual(initial);
    expect(editedView).not.toEqual(initialView);
    expect(host.immediate).toEqual([edited]);
    expect(node.dirty()).toBe(true);
    // Some controls report touched during selection and have already flushed blur debounce.
    if (node.debouncing()) {
      expect(node.value.committed()).toEqual(initial);
      expect(host.committed).toEqual([]);
    }
    node.flush();
    await settle(fixture);
    expect(node.value.committed()).toEqual(edited);
    expect(profile.value.committed()).toEqual({ control: edited });
    expect(node()).toEqual(initial);
    expect(profile()).toEqual({ control: initial });
    expect(host.committed).toEqual([initial]);
    expect(view(root(), kind)).toEqual(editedView);
    profile.reset();
    await settle(fixture);
    expect(view(root(), kind)).toEqual(editedView);
    expect(node.value.committed()).toEqual(edited);
    expect(node.dirty()).toBe(false);
    node.set(initial);
    await settle(fixture);
    expect(view(root(), kind)).toEqual(initialView);
    node.set(edited);
    await settle(fixture);
    expect(view(root(), kind)).toEqual(editedView);
    profile.resetToInitial();
    await settle(fixture);
    expect(view(root(), kind)).toEqual(initialView);
    expect(node.value.control()).toEqual(initial);
    expect(node.value.committed()).toEqual(initial);
    expect(host.immediate).toEqual([edited]);
    expect(host.committed).toEqual([initial]);
  } finally {
    fixture.destroy();
  }
});

it.each((['input', 'select'] as const).flatMap(kind => ['reset', 'patch', 'destroy'].flatMap(action => [false, true].map(committed => ({ kind, action, committed })))))('handles $action inside a control output: $kind, committed=$committed', async ({ kind, action, committed }) => {
  const { fixture, host, node, profile, initial } = await setup(kind);
  let handled = false;
  host.afterEvent = (phase) => {
    if (phase !== committed || handled) return;
    handled = true;
    if (action === 'reset') profile.resetToInitial();
    if (action === 'patch') profile.patch({ control: initial });
    if (action === 'destroy') fixture.destroy();
  };
  try {
    await edit(fixture, kind);
    expect(handled).toBe(true);
    expect(host.immediate).toHaveLength(1);
    expect(host.committed).toHaveLength(committed ? 1 : 0);
    if (action !== 'destroy') {
      await settle(fixture);
      expect(node()).toEqual(initial);
      expect(view(fixture.nativeElement.querySelector('.node'), kind)).toEqual(view(fixture.nativeElement.querySelector('.baseline'), kind));
    }
  } finally {
    fixture.destroy();
  }
});

@Component({
  selector: 'dynamic-datepicker-constraints-host',
  template: '<input matInput [matDatepicker]="picker" [min]="min()" [max]="max()" [matDatepickerFilter]="filter()" [formNode]="node()" (formNodeValueChange)="events.push($event)" /><mat-datepicker #picker />',
  imports: [MatInputModule, MatDatepickerModule, FormNodeDirective],
  providers: [provideNativeDateAdapter()],
})
class DynamicDateHost {
  profile = form({ date: field<Date>(new Date(2025, 0, 10)) });

  node = signal<AnyNode>(this.profile.date);

  min = signal<Date | null>(null);

  max = signal<Date | null>(null);

  filter = signal<(date: Date | null) => boolean>(() => true);

  events: unknown[] = [];
}

it('refreshes dynamic date constraints, preserves constraint errors on reset and releases errors on rebinding', async () => {
  const fixture = TestBed.createComponent(DynamicDateHost);
  try {
    await settle(fixture);
    const host = fixture.componentInstance;
    expect(host.profile.valid()).toBe(true);
    host.min.set(new Date(2025, 0, 15));
    await settle(fixture);
    expect(host.profile.date.errors().map(error => error.kind)).toContain('matDatepickerMin');
    expect(host.profile.invalid()).toBe(true);
    host.profile.resetToInitial();
    await settle(fixture);
    expect(host.profile.invalid()).toBe(true);
    host.min.set(null);
    host.max.set(new Date(2025, 0, 5));
    await settle(fixture);
    expect(host.profile.date.errors().map(error => error.kind)).toEqual(['matDatepickerMax']);
    host.max.set(null);
    host.filter.set(() => false);
    await settle(fixture);
    expect(host.profile.date.errors().map(error => error.kind)).toEqual(['matDatepickerFilter']);
    const replacement = field<Date>(new Date(2025, 0, 20));
    host.node.set(replacement);
    await settle(fixture);
    expect(host.profile.valid()).toBe(true);
    expect(replacement.errors().map(error => error.kind)).toEqual(['matDatepickerFilter']);
    host.filter.set(() => true);
    await settle(fixture);
    expect(replacement.valid()).toBe(true);
    host.min.set(new Date(2025, 0, 25));
    await settle(fixture);
    expect(replacement.invalid()).toBe(true);
    fixture.destroy();
    expect(replacement.valid()).toBe(true);
    expect(host.events).toEqual([]);
  } finally {
    fixture.destroy();
  }
});
