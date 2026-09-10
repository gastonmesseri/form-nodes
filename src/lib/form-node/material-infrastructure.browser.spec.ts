import '@angular/compiler';
import { By } from '@angular/platform-browser';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FormControl, ReactiveFormsModule, NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { Component, signal, inject, ViewContainerRef, forwardRef, ChangeDetectionStrategy, type Type } from '@angular/core';

import { field, form, array, FormNodeDirective, useClosestFormState } from '../../../src/public-api';
import { registerSignalInputForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
registerSignalOutputForJit(FormNodeDirective, 'formNodeValueChange');
beforeAll(() => {
  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
});
afterAll(() => TestBed.resetTestEnvironment());
const fixtures: ComponentFixture<unknown>[] = [];
afterEach(() => { for (const fixture of fixtures.splice(0)) fixture.destroy(); });
const settle = async (fixture: ComponentFixture<unknown>) => {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
};
const create = async <T>(type: Type<T>) => {
  const fixture = TestBed.createComponent(type);
  fixtures.push(fixture);
  await settle(fixture);
  return fixture;
};

@Component({
  selector: 'reorderable-material-rows',
  template: `
    @for (row of profile.rows.items(); track row) {
      <section [attr.data-id]="row.id()">
        <input matInput [formNode]="row.name" (formNodeValueChange)="events.push(row.id())" />
        <mat-select [formNode]="row.choice"><mat-option value="A">A</mat-option><mat-option value="B">B</mat-option></mat-select>
      </section>
    }
  `,
  imports: [MatInputModule, MatSelectModule, FormNodeDirective],
})
class RowsHost {
  finishes: (() => void)[] = [];

  profile = form({
    rows: array({
      id: field(0),
      name: field('', { debounce: () => new Promise<void>((resolve) => { this.finishes.push(resolve); }) }),
      choice: field('A'),
    }, {
      initialValue: [{ id: 1, name: 'Ada', choice: 'A' }, { id: 2, name: 'Grace', choice: 'A' }],
      trackBy: 'id',
    }),
  });

  events: (number | null)[] = [];
}

it('keeps a pending edit with its row on move and isolates completion after removal and replacement', async () => {
  const fixture = await create(RowsHost);
  const host = fixture.componentInstance;
  const row = host.profile.rows.items()[0]!;
  const input = fixture.nativeElement.querySelector('[data-id="1"] input') as HTMLInputElement;
  input.focus();
  input.value = 'Edited';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  host.profile.rows.move(0, 1);
  await settle(fixture);
  expect(fixture.nativeElement.querySelector('[data-id="1"] input')).toBe(input);
  expect(row.name()).toBe('Ada');
  expect(row.name.value.control()).toBe('Edited');
  host.finishes[0]!();
  await settle(fixture);
  expect(host.profile.rows()?.map(item => item.name)).toEqual(['Grace', 'Edited']);
  expect(host.events).toEqual([1]);
  input.value = 'Late';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  host.profile.rows.removeAt(1);
  host.profile.rows.push({ id: 1, name: 'Replacement', choice: 'A' });
  await settle(fixture);
  host.finishes[1]!();
  await settle(fixture);
  expect(host.profile.rows()?.map(item => item.name)).toEqual(['Grace', 'Replacement']);
  expect(host.events).toEqual([1]);
  expect(fixture.nativeElement.querySelector('[data-id="1"] input').value).toBe('Replacement');
});

it('keeps an open select attached to the moved row and closes it when that row is removed', async () => {
  const fixture = await create(RowsHost);
  const host = fixture.componentInstance;
  fixture.nativeElement.querySelector('[data-id="1"] .mat-mdc-select-trigger').click();
  await settle(fixture);
  host.profile.rows.move(0, 1);
  await settle(fixture);
  const option = Array.from(document.querySelectorAll<HTMLElement>('mat-option')).find(item => item.textContent?.trim() === 'B');
  expect(option).toBeDefined();
  option!.click();
  await settle(fixture);
  expect(host.profile.rows()?.map(item => [item.id, item.choice])).toEqual([[2, 'A'], [1, 'B']]);
  fixture.nativeElement.querySelector('[data-id="1"] .mat-mdc-select-trigger').click();
  await settle(fixture);
  host.profile.rows.removeAt(1);
  await settle(fixture);
  expect(document.querySelector('mat-option')).toBeNull();
  expect(host.profile.rows()?.map(item => item.id)).toEqual([2]);
});

@Component({
  selector: 'shared-material-node',
  template: `
    @if (showInput()) { <input matInput [formNode]="profile.choice" (formNodeValueChange)="events.push('input')" /> }
    <mat-select [formNode]="profile.choice" (formNodeValueChange)="events.push('select')"><mat-option value="A">A</mat-option><mat-option value="B">B</mat-option></mat-select>
  `,
  imports: [MatInputModule, MatSelectModule, FormNodeDirective],
})
class SharedHost {
  profile = form({ choice: field('A', { debounce: 'blur' }) });

  showInput = signal(true);

  events: string[] = [];
}

it('shares draft values across different controls without duplicating originating outputs', async () => {
  const fixture = await create(SharedHost);
  const host = fixture.componentInstance;
  const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
  input.value = 'B';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await settle(fixture);
  expect(fixture.nativeElement.querySelector('.mat-mdc-select-value').textContent.trim()).toBe('B');
  expect(host.profile.choice()).toBe('A');
  expect(host.events).toEqual([]);
  input.dispatchEvent(new Event('blur'));
  await settle(fixture);
  expect(host.events).toEqual(['input']);
  host.showInput.set(false);
  await settle(fixture);
  host.profile.resetToInitial();
  await settle(fixture);
  expect(fixture.nativeElement.querySelector('.mat-mdc-select-value').textContent.trim()).toBe('A');
  expect(host.events).toEqual(['input']);
});

@Component({
  selector: 'composite-material-date',
  template: '<input matInput [matDatepicker]="picker" [formControl]="control" (blur)="touch()" /><mat-datepicker #picker />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatInputModule, MatDatepickerModule, ReactiveFormsModule],
  providers: [provideNativeDateAdapter(), { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CompositeDate), multi: true }, { provide: NG_VALIDATORS, useExisting: forwardRef(() => CompositeDate), multi: true }],
})
class CompositeDate {
  control = new FormControl<Date | null>(null);

  change = (_value: Date | null) => {};

  touch = () => {};

  validatorChanged = () => {};

  constructor() {
    this.control.valueChanges.pipe(takeUntilDestroyed()).subscribe(value => this.change(value));
    this.control.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => this.validatorChanged());
  }

  writeValue(value: Date | null) {
    this.control.setValue(value, { emitEvent: false });
    this.validatorChanged();
  }

  setDisabledState(disabled: boolean) {
    if (disabled) this.control.disable({ emitEvent: false });
    else this.control.enable({ emitEvent: false });
    this.validatorChanged();
  }

  validate() { return this.control.errors; }

  registerOnChange(fn: (value: Date | null) => void) { this.change = fn; }

  registerOnTouched(fn: () => void) { this.touch = fn; }

  registerOnValidatorChange(fn: () => void) { this.validatorChanged = fn; }
}
@Component({
  selector: 'composite-material-date-host',
  template: '@if (visible()) { <composite-material-date [formNode]="profile.date" (formNodeValueChange)="events.push($event)" /> }',
  imports: [CompositeDate, FormNodeDirective],
})
class CompositeHost {
  profile = form({ date: field<Date>(new Date(2025, 0, 10)) });

  visible = signal(true);

  events: unknown[] = [];
}

it('initializes and resets an OnPush date CVA with an inner FormControl and propagates its parsing errors', async () => {
  const fixture = await create(CompositeHost);
  const host = fixture.componentInstance;
  const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
  expect(input.value).toBe('1/10/2025');
  input.value = '1/15/2025';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await settle(fixture);
  expect(host.profile.date()).toEqual(new Date(2025, 0, 15));
  expect(host.events).toHaveLength(1);
  input.value = 'invalid';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await settle(fixture);
  expect(host.profile.invalid()).toBe(true);
  expect(host.profile.date.errors().map(error => error.kind)).toContain('matDatepickerParse');
  const count = host.events.length;
  host.profile.resetToInitial();
  await settle(fixture);
  expect(input.value).toBe('1/10/2025');
  expect(host.profile.valid()).toBe(true);
  host.profile.disable();
  await settle(fixture);
  expect(input.disabled).toBe(true);
  host.profile.enable();
  host.profile.date.set(new Date(2025, 0, 20));
  await settle(fixture);
  expect(input.value).toBe('1/20/2025');
  expect(input.disabled).toBe(false);
  host.visible.set(false);
  await settle(fixture);
  host.profile.resetToInitial();
  host.visible.set(true);
  await settle(fixture);
  expect(fixture.nativeElement.querySelector('input').value).toBe('1/10/2025');
  expect(host.events).toHaveLength(count);
});

@Component({ selector: 'dialog-form-probe', template: '{{ closest()?.submitted() ?? "none" }}' })
class DialogProbe {
  closest = useClosestFormState().formNode;
}
@Component({ selector: 'dialog-form-launcher', template: '', imports: [MatDialogModule] })
class DialogLauncher {
  dialog = inject(MatDialog);

  container = inject(ViewContainerRef);
}
@Component({ selector: 'dialog-form-host', template: '<form [formNode]="profile"><dialog-form-launcher /></form>', imports: [FormNodeDirective, DialogLauncher] })
class DialogHost {
  profile = form({ name: field('Ada') });
}

it('resolves a dialog form through its view container injector and preserves submission/reset state', async () => {
  const fixture = await create(DialogHost);
  const host = fixture.componentInstance;
  const launcher = fixture.debugElement.query(By.directive(DialogLauncher)).componentInstance as DialogLauncher;
  const dialog = launcher.dialog.open(DialogProbe, { viewContainerRef: launcher.container });
  try {
    await settle(fixture);
    expect(dialog.componentInstance.closest()).toBe(host.profile.$api);
    await host.profile.submit();
    await settle(fixture);
    expect(dialog.componentInstance.closest()?.submitted()).toBe(true);
    expect(document.querySelector('dialog-form-probe')?.textContent?.trim()).toBe('true');
    host.profile.reset();
    await settle(fixture);
    expect(dialog.componentInstance.closest()?.submitted()).toBe(false);
  } finally {
    dialog.close();
    await settle(fixture);
  }
  const unscoped = launcher.dialog.open(DialogProbe);
  try {
    await settle(fixture);
    expect(unscoped.componentInstance.closest()).toBeNull();
  } finally {
    unscoped.close();
    await settle(fixture);
  }
});
