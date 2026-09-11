import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Component, input, model, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { notNil } from '../validation/validators/not-nil';
import { FormNodeDirective } from './form-node.directive';
import { required } from '../validation/validators/required';
import { provideFormNodesConfig } from './provide-form-nodes-config';
import { requiredTrue } from '../validation/validators/required-true';
import { useFormNodeState } from '../form-node-state/form-node-state';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());
afterEach(() => TestBed.resetTestingModule());

describe('presence and acceptance bindings', () => {
  it('keeps unchecked answers valid while enforcing acceptance on native checkboxes', () => {
    @Component({
      template: `
        <form [formNode]="checkout">
          <input id="answer" type="checkbox" [formNode]="checkout.answer" />
          <input id="terms" type="checkbox" [formNode]="checkout.terms" />
          <input id="reference" [formNode]="checkout.reference" />
        </form>
      `,
      imports: [FormNodeDirective],
    })
    class Host {
      checkout = form({ answer: field(false, [required]), terms: field(false, [requiredTrue]), reference: field('', [notNil]) });
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const answer = fixture.nativeElement.querySelector('#answer') as HTMLInputElement;
    const terms = fixture.nativeElement.querySelector('#terms') as HTMLInputElement;
    const reference = fixture.nativeElement.querySelector('#reference') as HTMLInputElement;
    const node = fixture.componentInstance.checkout;
    expect(node.answer.required()).toBe(true);
    expect(answer.required).toBe(false);
    expect(answer.checkValidity()).toBe(true);
    expect(answer.getAttribute('aria-invalid')).toBe('false');
    expect(terms.required).toBe(true);
    expect(terms.checkValidity()).toBe(false);
    expect(reference.required).toBe(false);
    expect(reference.checkValidity()).toBe(true);
    expect(node.allErrors().map(error => error.kind)).toEqual(['requiredTrue']);
    terms.click();
    fixture.detectChanges();
    expect(node.terms()).toBe(true);
    expect(node.terms.dirty()).toBe(true);
    expect(node.valid()).toBe(true);
    expect(terms.checkValidity()).toBe(true);
    node.terms.reset(false);
    fixture.detectChanges();
    expect(terms.checked).toBe(false);
    expect(terms.checkValidity()).toBe(false);
    expect(node.terms.hasError('requiredTrue')).toBe(true);
    expect(node.terms.dirty()).toBe(false);
    fixture.destroy();
  });

  it('updates native required after conditional changes and rebinding', () => {
    @Component({
      template: `<input type="checkbox" [formNode]="selected()" />`,
      imports: [FormNodeDirective],
    })
    class Host {
      enabled = signal(true);
      acceptance = field(false, [requiredTrue({ when: () => this.enabled() })]);
      answer = field(false, [required]);
      selected = signal(this.acceptance);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const nativeInput = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(nativeInput.required).toBe(true);
    host.enabled.set(false);
    fixture.detectChanges();
    expect(nativeInput.required).toBe(false);
    expect(host.acceptance.valid()).toBe(true);
    host.enabled.set(true);
    fixture.detectChanges();
    expect(nativeInput.required).toBe(true);
    host.selected.set(host.answer);
    fixture.detectChanges();
    expect(nativeInput.required).toBe(false);
    expect(nativeInput.checkValidity()).toBe(true);
    host.acceptance.set(true);
    fixture.detectChanges();
    expect(nativeInput.checked).toBe(false);
    fixture.destroy();
  });

  it('synchronizes checked-model constraints without changing logical required state', () => {
    @Component({
      selector: 'answer-checkbox',
      template: `<input type="checkbox" [checked]="checked()" [required]="required()" />`,
    })
    class Checkbox {
      checked = model<boolean | null>(false);
      required = input(false);
      state = useFormNodeState();
    }
    registerSignalModelForJit(Checkbox, 'checked');
    registerSignalInputForJit(Checkbox, 'required', 'required');
    @Component({
      template: `<answer-checkbox [formNode]="selected()" />`,
      imports: [Checkbox, FormNodeDirective],
      providers: [provideFormNodesConfig({ syncInputs: 'all' })],
    })
    class Host {
      answer = field(false, [required]);
      acceptance = field(false, [requiredTrue]);
      selected = signal(this.answer);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as Checkbox;
    const nativeInput = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(control.state.required()).toBe(true);
    expect(control.state.invalid()).toBe(false);
    expect(control.required()).toBe(false);
    expect(nativeInput.checkValidity()).toBe(true);
    fixture.componentInstance.selected.set(fixture.componentInstance.acceptance);
    fixture.detectChanges();
    expect(control.required()).toBe(true);
    expect(control.state.required()).toBe(true);
    expect(control.state.hasError('requiredTrue')).toBe(true);
    expect(nativeInput.checkValidity()).toBe(false);
    fixture.destroy();
  });

  it('keeps Material checkbox validators consistent with the selected rule', () => {
    @Component({
      template: `<mat-checkbox [formNode]="selected()">Answer</mat-checkbox>`,
      imports: [MatCheckboxModule, FormNodeDirective],
      providers: [provideFormNodesConfig({ syncInputs: 'all' })],
    })
    class Host {
      answer = field(false, [required]);
      acceptance = field(false, [requiredTrue]);
      selected = signal(this.answer);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const nativeInput = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(host.answer.valid()).toBe(true);
    expect(nativeInput.required).toBe(false);
    expect(nativeInput.checkValidity()).toBe(true);
    host.selected.set(host.acceptance);
    fixture.detectChanges();
    fixture.detectChanges();
    expect(host.acceptance.invalid()).toBe(true);
    expect(nativeInput.required).toBe(true);
    nativeInput.click();
    fixture.detectChanges();
    fixture.detectChanges();
    expect(host.acceptance()).toBe(true);
    expect(host.acceptance.valid()).toBe(true);
    fixture.destroy();
  });

  it('mirrors explicit acceptance errors on native checkboxes', () => {
    @Component({
      template: `<input type="checkbox" [formNode]="answer" />`,
      imports: [FormNodeDirective],
    })
    class Host {
      answer = field(false, [() => ({ kind: 'requiredTrue' })]);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).required).toBe(true);
    fixture.destroy();
  });
});
