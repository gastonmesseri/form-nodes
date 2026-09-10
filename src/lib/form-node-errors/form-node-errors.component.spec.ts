// @vitest-environment jsdom

import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { Component, model, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { required } from '../validation/validators/required';
import { FormNodeErrors } from './form-node-errors.component';
import { FormNodeDirective } from '../form-node/form-node.directive';
import { useFormNodeState } from '../form-node-state/form-node-state';
import { registerErrorTemplateQueryForJit } from '../../../tests/helpers/register-error-template-query-for-jit';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerErrorTemplateQueryForJit();

for (const name of ['node', 'state', 'showWhen', 'maxMessages', 'animate', 'message', 'fallbackMessage']) {
  registerSignalInputForJit(FormNodeErrors, name, name);
}
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

const setup = (inputs: Record<string, unknown> = {}) => {
  const fixture = TestBed.createComponent(FormNodeErrors);
  for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
  fixture.detectChanges();
  return { fixture, text: () => fixture.nativeElement.textContent.trim() as string };
};

describe('FormNodeErrors', () => {
  it.each([{}, 'node', signal('value'), false])('ignores a malformed node %s', (node) => {
    const { fixture, text } = setup({ node, showWhen: true });
    expect(text()).toBe('');
    fixture.componentRef.setInput('node', field('', [required]));
    fixture.detectChanges();
    expect(text()).toBe('This field is required.');
  });

  it.each([{}, 'state', { disabled: true }])('ignores a malformed state %s', (state) => {
    const { text } = setup({ state, showWhen: true });
    expect(text()).toBe('');
  });

  it('recovers when an unreadable source becomes readable and filters malformed errors', () => {
    const readable = signal(false);
    const errors = signal<unknown>(null);
    const state = {
      disabled: () => false, hidden: () => false,
      errors: () => {
        if (!readable()) throw new Error('Unavailable state');
        return errors();
      },
    };
    const { fixture, text } = setup({ state, showWhen: true });
    expect(text()).toBe('');
    readable.set(true);
    fixture.detectChanges();
    expect(text()).toBe('');
    errors.set([null, false, {}, { kind: 'custom', message: 'Recovered' }]);
    fixture.detectChanges();
    expect(text()).toBe('Recovered');
  });

  it.each([42, 'resolver', () => 42, () => ({ text: 'invalid' }), () => { throw new Error('Formatting failed'); }])('falls back safely for an invalid message resolver %s', (message) => {
    const { fixture, text } = setup({ node: field('', [required]), showWhen: true, message });
    expect(text()).toBe('This field is required.');
    fixture.componentRef.setInput('message', () => 'Corrected');
    fixture.detectChanges();
    expect(text()).toBe('Corrected');
  });

  it('uses the default text for an invalid fallback', () => {
    const node = field('', { validators: () => ({ kind: 'custom' }) });
    const { fixture, text } = setup({ node, showWhen: true, fallbackMessage: {} });
    expect(text()).toBe('Invalid value.');
    fixture.componentRef.setInput('fallbackMessage', 'Custom fallback');
    fixture.detectChanges();
    expect(text()).toBe('Custom fallback');
  });

  it('uses touch-or-submit visibility for an unknown policy', async () => {
    const profile = form({ name: field('', [required]) });
    const { fixture, text } = setup({ node: profile.name, showWhen: 'unknown' });
    expect(text()).toBe('');
    await profile.submit();
    fixture.detectChanges();
    expect(text()).toBe('This field is required.');
  });

  it('reads a real custom-control state and its form submission history', async () => {
    @Component({
      selector: 'error-state-control',
      template: `<form-node-errors [state]="state"><ng-template #message let-text let-errors="errors"><strong [attr.data-kind]="errors[0].kind">{{ text }}</strong></ng-template></form-node-errors>`,
      imports: [FormNodeErrors],
    })
    class Control {
      value = model('');

      state = useFormNodeState();
    }
    registerSignalModelForJit(Control, 'value');
    registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
    @Component({ template: '<error-state-control [formNode]="profile.name" />', imports: [Control, FormNodeDirective] })
    class Host {
      profile = form({ name: field('', [required]) });
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const state = (fixture.debugElement.query(By.directive(Control)).componentInstance as Control).state;
    expect(state.form.formNode()).toBe(fixture.componentInstance.profile.$api);
    expect(fixture.nativeElement.textContent.trim()).toBe('');
    await fixture.componentInstance.profile.submit();
    fixture.detectChanges();
    expect(state.form.submitted()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('This field is required.');
    fixture.componentInstance.profile.reset();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('is neutral without a source and does not change field validation or interaction', () => {
    const { fixture, text } = setup();
    expect(text()).toBe('');
    const validate = vi.fn(() => ({ kind: 'custom', message: 'Invalid email' }));
    const node = field('', { validators: validate });
    node.errors();
    const runs = validate.mock.calls.length;
    fixture.componentRef.setInput('node', node);
    fixture.detectChanges();
    expect(text()).toBe('');
    expect(node.touched()).toBe(false);
    expect(node.dirty()).toBe(false);
    expect(validate).toHaveBeenCalledTimes(runs);
    node.markAsTouched();
    fixture.detectChanges();
    expect(text()).toBe('Invalid email');
    expect(validate).toHaveBeenCalledTimes(runs);
    fixture.componentRef.setInput('node', null);
    fixture.detectChanges();
    expect(text()).toBe('');
  });

  it('shows field and form own errors on a blocked submit and clears on reset', async () => {
    const submit = vi.fn();
    const root = form({ nested: form({ email: field('', [required]) }) }, {
      validators: () => ({ kind: 'root', message: 'Review the form' }), onSubmit: submit,
    });
    const leaf = setup({ node: root.nested.email });
    const parent = setup({ node: root });
    expect(leaf.text()).toBe('');
    expect(await root.submit()).toBe(false);
    leaf.fixture.detectChanges();
    parent.fixture.detectChanges();
    expect(leaf.text()).toBe('This field is required.');
    expect(parent.text()).toBe('Review the form');
    expect(submit).not.toHaveBeenCalled();
    root.reset();
    leaf.fixture.detectChanges();
    parent.fixture.detectChanges();
    expect(leaf.text()).toBe('');
    expect(parent.text()).toBe('');
  });

  it('observes late fields, rebinding, reparenting, and the nearest explicit form', async () => {
    const first = form({});
    await first.submit();
    const node = field('', [required]);
    first.add('email', node);
    const { fixture, text } = setup({ node });
    expect(node.touched()).toBe(false);
    expect(text()).toBe('This field is required.');
    first.remove('email');
    fixture.detectChanges();
    expect(text()).toBe('');
    const second = form({ nested: form({}) });
    second.nested.add('email', node);
    await second.submit();
    node.reset();
    fixture.detectChanges();
    expect(text()).toBe('');
    await second.nested.submit();
    fixture.detectChanges();
    expect(text()).toBe('This field is required.');
    fixture.componentRef.setInput('node', field('valid'));
    fixture.detectChanges();
    expect(text()).toBe('');
  });

  it.each(['touched', 'dirty', 'submit', 'always', true, false] as const)('supports the %s visibility policy', async (policy) => {
    const root = form({ email: field('', [required]) });
    const { fixture, text } = setup({ node: root.email, showWhen: policy });
    expect(Boolean(text())).toBe(policy === 'always' || policy === true);
    root.email.markAsDirty();
    fixture.detectChanges();
    expect(Boolean(text())).toBe(policy === 'dirty' || policy === 'always' || policy === true);
    root.email.markAsTouched();
    fixture.detectChanges();
    expect(Boolean(text())).toBe(policy !== 'submit' && policy !== false);
    await root.submit();
    fixture.detectChanges();
    expect(Boolean(text())).toBe(policy !== false);
  });

  it('hides disabled and hidden sources even with an explicit true condition', () => {
    const hidden = signal(false);
    const node = field('', [required], { hidden });
    const { fixture, text } = setup({ node, showWhen: true });
    expect(text()).not.toBe('');
    node.disable();
    fixture.detectChanges();
    expect(text()).toBe('');
    node.enable();
    hidden.set(true);
    fixture.detectChanges();
    expect(text()).toBe('');
    hidden.set(false);
    fixture.detectChanges();
    expect(text()).not.toBe('');
  });

  it('resolves reactive messages, filters empty messages before limiting, and safely renders text', () => {
    const translation = signal('Translated');
    const node = field('', { validators: () => [
      { kind: 'skip', message: 'Skipped' }, { kind: 'empty', message: '  ' },
      { kind: 'first', message: '<b>First</b>' }, { kind: 'second' }, { kind: 'third' },
    ] });
    const { fixture, text } = setup({ node, showWhen: true, message: (error: { kind: string }) => error.kind === 'skip' ? null : undefined });
    expect(text()).toBe('<b>First</b>');
    expect(fixture.nativeElement.querySelector('b')).toBeNull();
    fixture.componentRef.setInput('maxMessages', Infinity);
    fixture.componentRef.setInput('fallbackMessage', 'Fallback');
    fixture.detectChanges();
    expect(text()).toContain('Fallback');
    expect(fixture.nativeElement.querySelectorAll('.form-node-error')).toHaveLength(3);
    fixture.componentRef.setInput('message', () => translation());
    fixture.componentRef.setInput('maxMessages', 2);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.form-node-error')).toHaveLength(2);
    translation.set('Updated');
    fixture.detectChanges();
    expect(text()).toContain('Updated');
    fixture.componentRef.setInput('maxMessages', 0);
    fixture.detectChanges();
    expect(text()).toBe('');
  });

  it.each([-1, 1.5, NaN, -Infinity, '2', null, undefined, {}, Symbol('limit')])('hides messages for an invalid limit %s and recovers after correction', (maxMessages) => {
    const { fixture, text } = setup({ node: field('', [required]), showWhen: true, maxMessages });
    expect(text()).toBe('');
    fixture.componentRef.setInput('maxMessages', 1);
    fixture.detectChanges();
    expect(text()).toBe('This field is required.');
  });

  it('renders one projected template with the first message and the visible message list', () => {
    const errors = signal([
      { kind: 'skip', message: '' },
      { kind: 'first', message: 'First', minimum: 3 },
      { kind: 'second', message: 'Second' },
      { kind: 'third', message: 'Third' },
    ]);
    @Component({
      template: `
        <form-node-errors [node]="profile.email" showWhen="always" [maxMessages]="limit()" [message]="resolve">
          @if (custom()) {
            @if (alternate()) {
              <ng-template #message let-text><b>{{ text }}</b></ng-template>
            } @else {
              <ng-template #message let-text let-message="message" let-messages="messages" let-errors="errors">
                <header>{{ label() }}: {{ text }} / {{ message }}</header>
                @for (text of messages; track $index) {
                  <span [attr.data-kind]="errors[$index].kind" [attr.data-minimum]="errors[$index].minimum">{{ text }}</span>
                }
              </ng-template>
            }
          }
        </form-node-errors>
      `,
      imports: [FormNodeErrors],
    })
    class Host {
      label = signal('Error');

      custom = signal(true);

      alternate = signal(false);

      limit = signal(2);

      profile = form({ email: field('', { validators: () => errors() }) });

      resolve = (error: { kind: string }) => error.kind === 'first' ? 'Translated first' : undefined;
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const spans = () => Array.from(fixture.nativeElement.querySelectorAll('span')) as HTMLElement[];
    expect(fixture.nativeElement.querySelectorAll('header')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('header').textContent).toBe('Error: Translated first / Translated first');
    expect(spans()).toHaveLength(2);
    expect(spans()[0]!.dataset).toMatchObject({ kind: 'first', minimum: '3' });
    expect(spans()[1]!.textContent).toBe('Second');
    host.limit.set(1);
    fixture.detectChanges();
    expect(spans()).toHaveLength(1);
    host.label.set('Problem');
    errors.set([{ kind: 'changed', message: '<b>New error</b>' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('header').textContent).toBe('Problem: <b>New error</b> / <b>New error</b>');
    expect(spans()[0]!.dataset).toMatchObject({ kind: 'changed' });
    expect(fixture.nativeElement.querySelector('b')).toBeNull();
    host.alternate.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('b').textContent).toBe('<b>New error</b>');
    host.custom.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('b')).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('<b>New error</b>');
    errors.set([]);
    host.custom.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('uses the first #message template and falls back when the reference is not a template', () => {
    @Component({
      template: `
        <form-node-errors [node]="name" showWhen="always">
          <ng-template #message let-text><b>{{ text }}</b></ng-template>
          <ng-template #message>Unused</ng-template>
        </form-node-errors>
        <form-node-errors [node]="name" showWhen="always"><span #message>Ignored</span></form-node-errors>
      `,
      imports: [FormNodeErrors],
    })
    class Host {
      name = field('', [required]);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const elements = fixture.nativeElement.querySelectorAll('form-node-errors');
    expect(elements[0].querySelectorAll('b')).toHaveLength(1);
    expect(elements[0].textContent.trim()).toBe('This field is required.');
    expect(elements[1].textContent.trim()).toBe('This field is required.');
  });

  it('hides conflicting sources and recovers when the ambiguity is removed', () => {
    const node = field('', [required]);
    const { fixture, text } = setup({ node, state: {}, showWhen: true });
    expect(text()).toBe('');
    expect(node.invalid()).toBe(true);
    expect(node.touched()).toBe(false);
    fixture.componentRef.setInput('state', undefined);
    fixture.detectChanges();
    expect(text()).toBe('This field is required.');
  });
});
