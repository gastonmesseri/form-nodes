// @vitest-environment jsdom

import '@angular/compiler';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Component, Injector, computed, runInInjectionContext, signal } from '@angular/core';
import { FormControl, FormGroup, FormGroupDirective, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import type { AnyNode } from '../types/node.type';
import { useClosestFormState } from './use-closest-form-state';
import { FORM_NODE, FormNodeDirective } from './form-node.directive';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');

@Component({ selector: 'form-state-probe', template: '{{ state.submitted() }}' })
class Probe {
  state = useClosestFormState();
}

@Component({
  template: `
    @if (reactive) {
      <form [formGroup]="group">
        <div formGroupName="details">@if (visible()) { <form-state-probe /> }</div>
      </form>
    } @else {
      <form>
        <div ngModelGroup="details">@if (visible()) { <form-state-probe /> }</div>
      </form>
    }
  `,
  imports: [FormsModule, ReactiveFormsModule, FormNodeDirective, Probe],
})
class AngularHost {
  reactive = false;

  visible = signal(true);

  group = new FormGroup({ details: new FormGroup({ name: new FormControl('') }) });
}

@Component({
  template: `
    <form [formGroup]="group">
      <form ngNoForm [formNode]="bound()"><form-state-probe /></form>
      <section ngForm><form-state-probe /></section>
    </form>
  `,
  imports: [FormsModule, ReactiveFormsModule, FormNodeDirective, Probe],
})
class MixedHost {
  group = new FormGroup({});

  profile = form({ submitted: field('child'), name: field('') });

  bound = signal<AnyNode>(this.profile);
}

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());
beforeEach(() => TestBed.configureTestingModule({}));
afterEach(() => TestBed.resetTestingModule());

it('requires DI and exposes neutral state without a form', () => {
  expect(() => useClosestFormState()).toThrow(/injection context/);
  const state = runInInjectionContext(Injector.create({ providers: [] }), useClosestFormState);
  expect([state.connected(), state.source(), state.submitted(), state.formNode()]).toEqual([false, null, false, null]);
});

it('tracks form and field bindings, nested ownership, detachment, and submission resets', async () => {
  const first = form({});
  const name = field('');
  first.add('name', name);
  const second = form({ nested: form({}) });
  const current = signal<AnyNode>(first);
  const injector = Injector.create({ providers: [{ provide: FORM_NODE, useValue: { node: current } }] });
  const state = runInInjectionContext(injector, useClosestFormState);
  expect(state.formNode()).toBe(first.$api);
  current.set(name);
  await first.submit();
  expect(state.submitted()).toBe(true);
  expect(state.source()).toBe('formNode');
  first.remove('name');
  expect(state.connected()).toBe(false);
  expect(state.submitted()).toBe(false);
  second.nested.add('name', name);
  expect(state.formNode()).toBe(second.nested.$api);
  await second.submit();
  expect(state.submitted()).toBe(false);
  await second.nested.submit();
  expect(state.submitted()).toBe(true);
  second.reset();
  expect(state.submitted()).toBe(false);
});

for (const reactive of [false, true]) {
  describe(reactive ? 'Reactive Forms' : 'NgForm', () => {
    it('observes initial state, submit, reset, late consumers, and replacement controls', async () => {
      const fixture = TestBed.createComponent(AngularHost);
      fixture.componentInstance.reactive = reactive;
      fixture.detectChanges();
      await fixture.whenStable();
      const element = fixture.debugElement.query(By.css('form'));
      const directive = reactive ? element.injector.get(FormGroupDirective) : element.injector.get(NgForm);
      const state = fixture.debugElement.query(By.directive(Probe)).componentInstance.state;
      const submitted = computed(() => state.submitted());
      expect([state.connected(), state.source(), state.formNode(), submitted()]).toEqual([true, reactive ? 'formGroup' : 'ngForm', null, false]);
      directive.control.setErrors({ required: true });
      element.nativeElement.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      expect(submitted()).toBe(true);
      directive.control.reset();
      await Promise.resolve();
      expect(submitted()).toBe(true);
      directive.resetForm();
      await Promise.resolve();
      expect(submitted()).toBe(false);
      fixture.componentInstance.visible.set(false);
      fixture.detectChanges();
      directive.onSubmit(new Event('submit'));
      fixture.componentInstance.visible.set(true);
      fixture.detectChanges();
      const late = fixture.debugElement.query(By.directive(Probe)).componentInstance.state;
      expect(late.submitted()).toBe(true);
      element.nativeElement.dispatchEvent(new Event('reset'));
      await Promise.resolve();
      expect(late.submitted()).toBe(false);
      if (reactive) {
        fixture.componentInstance.group = new FormGroup({ details: new FormGroup({ name: new FormControl('new') }) });
        fixture.detectChanges();
        directive.onSubmit(new Event('submit'));
        expect(late.submitted()).toBe(true);
        (directive as FormGroupDirective).resetForm(undefined, { emitEvent: false });
        fixture.detectChanges();
        expect(late.submitted()).toBe(false);
      }
      directive.onSubmit(new Event('submit'));
      directive.resetForm();
      fixture.destroy();
      await Promise.resolve();
      // Queued work and events must stop updating an already destroyed consumer.
      const last = late.submitted();
      directive.onSubmit(new Event('submit'));
      await Promise.resolve();
      expect(late.submitted()).toBe(last);
    });
  });
}

it('prioritizes Form Nodes and falls back reactively; chooses the nearest Angular root', async () => {
  const fixture = TestBed.createComponent(MixedHost);
  fixture.detectChanges();
  const probes = fixture.debugElement.queryAll(By.directive(Probe));
  const state = (probes[0]!.componentInstance as Probe).state;
  const nested = (probes[1]!.componentInstance as Probe).state;
  const host = fixture.componentInstance;
  const angular = fixture.debugElement.query(By.directive(FormGroupDirective)).injector.get(FormGroupDirective);
  angular.onSubmit(new Event('submit'));
  expect(state.formNode()).toBe(host.profile.$api);
  expect(state.formNode()?.children.submitted()).toBe('child');
  expect(state.submitted()).toBe(false);
  expect(nested.source()).toBe('ngForm');
  expect(nested.submitted()).toBe(false);
  await host.profile.submit();
  expect(state.submitted()).toBe(true);
  host.profile.reset();
  expect(state.submitted()).toBe(false);
  host.bound.set(field('detached'));
  fixture.detectChanges();
  expect([state.source(), state.formNode(), state.submitted()]).toEqual(['formGroup', null, true]);
  host.bound.set(host.profile);
  fixture.detectChanges();
  expect([state.source(), state.submitted()]).toEqual(['formNode', false]);
});
