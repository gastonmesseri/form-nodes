import '@angular/compiler';
import '@angular/localize/init';
import { providePrimeNG } from 'primeng/config';
import { Component, signal } from '@angular/core';
import { CheckboxModule } from 'primeng/checkbox';
import { IonInput } from '@ionic/angular/ion-input';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { IonCheckbox } from '@ionic/angular/ion-checkbox';
import { provideIonicAngular } from '@ionic/angular/provide';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NgbRatingModule, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, FormNodeDirective, type AnyNode } from '../../../src/public-api';
import { registerSignalInputForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
registerSignalOutputForJit(FormNodeDirective, 'formNodeValueChange');
registerSignalOutputForJit(FormNodeDirective, 'formNodeControlValueChange');
beforeAll(() => {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  TestBed.configureTestingModule({ providers: [provideIonicAngular({ animated: false }), providePrimeNG({ unstyled: true })] });
});
afterAll(() => TestBed.resetTestEnvironment());
afterEach(() => {
  for (const fixture of fixtures.splice(0)) fixture.destroy();
});
const fixtures: ComponentFixture<unknown>[] = [];

const kinds = ['prime-checkbox', 'prime-toggle', 'zorro-checkbox', 'zorro-switch', 'bootstrap-rating', 'bootstrap-time', 'ionic-input', 'ionic-checkbox'] as const;
type Kind = typeof kinds[number];

@Component({
  selector: 'ui-library-regression-host',
  template: `
    @if (visible()) { <section class="node">
      @switch (kind()) {
        @case ('prime-checkbox') { <p-checkbox [binary]="true" [formNode]="node()" (formNodeValueChange)="record($event, true)" (formNodeControlValueChange)="record($event, false)" /> }
        @case ('prime-toggle') { <p-toggleswitch [formNode]="node()" (formNodeValueChange)="record($event, true)" (formNodeControlValueChange)="record($event, false)" /> }
        @case ('zorro-checkbox') { <label nz-checkbox [formNode]="node()" (formNodeValueChange)="record($event, true)" (formNodeControlValueChange)="record($event, false)">Agree</label> }
        @case ('zorro-switch') { <nz-switch [formNode]="node()" (formNodeValueChange)="record($event, true)" (formNodeControlValueChange)="record($event, false)" /> }
        @case ('bootstrap-rating') { <ngb-rating [formNode]="node()" (formNodeValueChange)="record($event, true)" (formNodeControlValueChange)="record($event, false)" /> }
        @case ('bootstrap-time') { <ngb-timepicker [formNode]="node()" (formNodeValueChange)="record($event, true)" (formNodeControlValueChange)="record($event, false)" /> }
        @case ('ionic-input') { <ion-input label="Name" [formNode]="node()" (formNodeValueChange)="record($event, true)" (formNodeControlValueChange)="record($event, false)" /> }
        @case ('ionic-checkbox') { <ion-checkbox [formNode]="node()" (formNodeValueChange)="record($event, true)" (formNodeControlValueChange)="record($event, false)">Agree</ion-checkbox> }
      }
    </section> }
    <section class="baseline">
      @switch (kind()) {
        @case ('prime-checkbox') { <p-checkbox [binary]="true" [formControl]="baseline" /> }
        @case ('prime-toggle') { <p-toggleswitch [formControl]="baseline" /> }
        @case ('zorro-checkbox') { <label nz-checkbox [formControl]="baseline">Agree</label> }
        @case ('zorro-switch') { <nz-switch [formControl]="baseline" /> }
        @case ('bootstrap-rating') { <ngb-rating [formControl]="baseline" /> }
        @case ('bootstrap-time') { <ngb-timepicker [formControl]="baseline" /> }
        @case ('ionic-input') { <ion-input label="Name" [formControl]="baseline" /> }
        @case ('ionic-checkbox') { <ion-checkbox [formControl]="baseline">Agree</ion-checkbox> }
      }
    </section>
  `,
  imports: [FormNodeDirective, ReactiveFormsModule, CheckboxModule, ToggleSwitchModule, NzCheckboxModule, NzSwitchModule, NgbRatingModule, NgbTimepickerModule, IonInput, IonCheckbox],
})
class UiLibraryHost {
  kind = signal<Kind>('prime-checkbox');

  node = signal<AnyNode>(field(false));

  visible = signal(true);

  baseline = new FormControl<unknown>(false);

  immediate: unknown[] = [];

  committed: unknown[] = [];

  record(value: unknown, committed: boolean) {
    expect(committed ? this.node()() : this.node().$api.value.control()).toEqual(value);
    (committed ? this.committed : this.immediate).push(value);
  }
}

const settle = async (fixture: ComponentFixture<unknown>) => {
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
  // Ionic renders custom elements on its own animation-frame queue.
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  fixture.detectChanges();
};

const setup = async (kind: Kind, debounce = false, disabled = false, suppressEqual = false) => {
  const fixture = TestBed.createComponent(UiLibraryHost);
  fixtures.push(fixture);
  const host = fixture.componentInstance;
  const initial = kind === 'ionic-input' ? 'Ada' : kind === 'bootstrap-rating' ? 2 : kind === 'bootstrap-time' ? { hour: 9, minute: 30, second: 0 } : false;
  const profile = form({ control: field(initial, { disabled, ...(suppressEqual ? { equal: () => true } : {}), ...(debounce ? { debounce: 'blur' as const } : {}) }) });
  host.kind.set(kind);
  host.node.set(profile.control);
  host.baseline.setValue(initial);
  if (disabled) host.baseline.disable();
  await settle(fixture);
  return { fixture, host, profile, node: profile.control, initial };
};

const view = (root: HTMLElement, kind: Kind): unknown => {
  if (kind === 'ionic-checkbox') return (root.querySelector('ion-checkbox') as HTMLIonCheckboxElement).checked;
  if (kind === 'ionic-input') return root.querySelector<HTMLInputElement>('ion-input input')!.value;
  if (kind === 'zorro-switch') return root.querySelector('button')!.classList.contains('ant-switch-checked');
  if (kind === 'bootstrap-rating') return root.querySelector('ngb-rating')!.getAttribute('aria-valuenow');
  if (kind === 'bootstrap-time') return Array.from(root.querySelectorAll('input')).map(input => input.value);
  return root.querySelector<HTMLInputElement>('input')!.checked;
};

const edit = async (fixture: ComponentFixture<UiLibraryHost>, kind: Kind) => {
  const root: HTMLElement = fixture.nativeElement.querySelector('.node');
  if (kind === 'ionic-input' || kind === 'bootstrap-time') {
    const input = root.querySelector<HTMLInputElement>('input')!;
    input.focus();
    input.value = kind === 'ionic-input' ? 'Grace' : '11';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    if (kind === 'bootstrap-time') input.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (kind === 'ionic-checkbox') {
    root.querySelector('ion-checkbox')!.click();
  } else if (kind === 'bootstrap-rating') {
    root.querySelector('ngb-rating')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  } else {
    root.querySelector<HTMLElement>('input, button')!.click();
  }
  await settle(fixture);
};

it.each(kinds)('matches Reactive Forms initialization and survives edits, parent reset, rebinding and recreation: %s', async (kind) => {
  const { fixture, host, node, profile, initial } = await setup(kind);
  const root = () => fixture.nativeElement.querySelector('.node') as HTMLElement;
  const expected = view(fixture.nativeElement.querySelector('.baseline'), kind);
  expect(view(root(), kind)).toEqual(expected);
  expect(host.committed).toEqual([]);
  await edit(fixture, kind);
  expect(node()).not.toEqual(initial);
  expect(node.dirty()).toBe(true);
  expect(host.immediate).toHaveLength(1);
  expect(host.committed).toHaveLength(1);
  profile.resetToInitial();
  await settle(fixture);
  expect(view(root(), kind)).toEqual(expected);
  expect(node.dirty()).toBe(false);
  expect(node.touched()).toBe(false);
  node.reset();
  await settle(fixture);
  expect(host.immediate).toHaveLength(1);
  expect(host.committed).toHaveLength(1);
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
  host.visible.set(false);
  await settle(fixture);
  replacement.resetToInitial();
  host.visible.set(true);
  await settle(fixture);
  expect(view(root(), kind)).toEqual(expected);
  expect(host.committed).toHaveLength(2);
  fixture.destroy();
});

const disabledView = (root: HTMLElement, kind: Kind) => {
  if (kind.startsWith('ionic-')) return (root.firstElementChild as HTMLIonInputElement).disabled;
  if (kind === 'bootstrap-rating') return root.querySelector('ngb-rating')!.getAttribute('aria-disabled') === 'true';
  return root.querySelector<HTMLInputElement>('input, button')!.disabled;
};

it.each(kinds)('initializes disabled, inherits ancestor enable/disable and emits only user changes: %s', async (kind) => {
  const { fixture, host, profile } = await setup(kind, false, true);
  const root: HTMLElement = fixture.nativeElement.querySelector('.node');
  expect(disabledView(root, kind)).toBe(true);
  expect(disabledView(root, kind)).toBe(disabledView(fixture.nativeElement.querySelector('.baseline'), kind));
  profile.control.enable();
  await settle(fixture);
  expect(disabledView(root, kind)).toBe(false);
  profile.disable();
  await settle(fixture);
  expect(disabledView(root, kind)).toBe(true);
  profile.enable();
  await settle(fixture);
  expect(disabledView(root, kind)).toBe(false);
  expect(host.immediate).toEqual([]);
  expect(host.committed).toEqual([]);
  await edit(fixture, kind);
  expect(host.committed).toHaveLength(1);
  fixture.destroy();
});

it.each(kinds.filter(kind => kind !== 'bootstrap-rating'))('cancels pending input on reset without emitting a committed change: %s', async (kind) => {
  const { fixture, host, node, profile, initial } = await setup(kind, true);
  const expected = view(fixture.nativeElement.querySelector('.baseline'), kind);
  await edit(fixture, kind);
  expect(host.immediate).toHaveLength(1);
  expect(host.committed).toEqual([]);
  expect(node()).toEqual(initial);
  expect(node.debouncing()).toBe(true);
  profile.reset();
  await settle(fixture);
  expect(view(fixture.nativeElement.querySelector('.node'), kind)).toEqual(expected);
  expect(node.debouncing()).toBe(false);
  expect(node.dirty()).toBe(false);
  expect(host.committed).toEqual([]);
  fixture.destroy();
});

it.each(kinds)('commits pending input when the control reports touched: %s', async (kind) => {
  const { fixture, host, node } = await setup(kind, true);
  await edit(fixture, kind);
  const root: HTMLElement = fixture.nativeElement.querySelector('.node');
  if (kind !== 'bootstrap-rating') {
    const element = kind === 'ionic-checkbox'
      ? root.querySelector('ion-checkbox')!
      : root.querySelector<HTMLElement>('input, button')!;
    element.focus();
    element.blur();
    await settle(fixture);
  }
  // NgbRating calls onTouched during selection; other tested CVAs report it on blur.
  expect(node.touched()).toBe(true);
  expect(node.debouncing()).toBe(false);
  expect(host.immediate).toHaveLength(1);
  expect(host.committed).toEqual(host.immediate);
  expect(node()).toEqual(host.committed[0]);
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
