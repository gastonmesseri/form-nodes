import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, forwardRef } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field, form, FormNodeDirective } from '../../../src/public-api';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

@Component({
  selector: 'test-wizard',
  template: `
    <mat-radio-group [formNode]="form.investmentDelegation">
      <mat-radio-button value="DISCRETIONARY">Discretionary</mat-radio-button>
      <mat-radio-button value="NON_DISCRETIONARY">Other</mat-radio-button>
    </mat-radio-group>
    @if (form.investmentDelegation()) {
      <mat-radio-group [formNode]="form.collectiveInvestment">
        <mat-radio-button value="YES">Yes</mat-radio-button>
        <mat-radio-button value="NO">No</mat-radio-button>
      </mat-radio-group>
    }
    <mat-radio-group [formControl]="control">
      <mat-radio-button value="DISCRETIONARY">Discretionary</mat-radio-button>
      <mat-radio-button value="NON_DISCRETIONARY">Other</mat-radio-button>
    </mat-radio-group>
  `,
  imports: [FormNodeDirective, MatRadioModule, ReactiveFormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Wizard), multi: true }],
})
class Wizard {
  form = form({ investmentDelegation: field<string>(null), collectiveInvestment: field<string>(null) });

  control = new FormControl<string | null>(null);

  writeValue(value: string | null) {
    this.form.patch({ investmentDelegation: value, collectiveInvestment: value ? 'YES' : null });
    this.control.setValue(value);
  }

  change = (_value: unknown) => {};

  registerOnChange(fn: (value: unknown) => void) { this.change = fn; }

  registerOnTouched(_fn: unknown) {}
}
@Component({
  template: `<test-wizard [formControl]="control"/><test-wizard [formNode]="node"/>`,
  imports: [Wizard, FormNodeDirective, ReactiveFormsModule],
})
class Host {
  control = new FormControl('DISCRETIONARY');

  node = field('DISCRETIONARY');
}
it('renders initial radio selections through nested CVAs', async () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const groups = fixture.nativeElement.querySelectorAll('mat-radio-group');
  expect(groups).toHaveLength(6);
  for (const group of groups) {
    expect(group.querySelector('input').checked, group.outerHTML).toBe(true);
  }
  const wizard = fixture.debugElement.children[0]!.componentInstance as Wizard;
  wizard.form.patch({ investmentDelegation: 'NON_DISCRETIONARY' });
  // Programmatic updates use the signal rendering cycle after initial setup.
  expect(groups[0].querySelector('input').checked).toBe(true);
  fixture.detectChanges();
  await fixture.whenStable();
  expect(groups[0].querySelectorAll('input')[1].checked).toBe(true);
  wizard.form.investmentDelegation.disable();
  fixture.detectChanges();
  await fixture.whenStable();
  expect(groups[0].querySelector('input').disabled).toBe(true);
  wizard.form.investmentDelegation.enable();
  fixture.detectChanges();
  await fixture.whenStable();
  groups[0].querySelector('input').click();
  expect(wizard.form.investmentDelegation()).toBe('DISCRETIONARY');
  expect(wizard.form.investmentDelegation.dirty()).toBe(true);
  fixture.destroy();
});
