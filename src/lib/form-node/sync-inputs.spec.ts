// @vitest-environment jsdom
import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, input, model, output, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { group } from '../primitives/group';
import { array } from '../primitives/array';
import type { Node } from '../types/node.type';
import { FormNode } from './form-node.directive';
import { min } from '../validation/validators/min';
import { max } from '../validation/validators/max';
import { pattern } from '../validation/validators/pattern';
import { required } from '../validation/validators/required';
import { minLength } from '../validation/validators/min-length';
import { maxLength } from '../validation/validators/max-length';
import { requiredIf } from '../validation/validators/required-if';
import { provideFormNodesConfig } from './provide-form-nodes-config';
import type { SyncInputs } from '../configuration/node-input-config';
import { createFormPrimitives } from '../primitives/create-form-primitives';
import { configureGlobalFormNodes } from '../configuration/configure-global-form-nodes';
import { registerSignalInputForJit, registerSignalModelForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

@Component({ selector: 'experimental-control', template: '' })
class Control {
  value = model<unknown>('owned');

  disabled = input(true);

  readonly = input(true);

  hidden = input(true);

  required = input(false);

  min = input<unknown>(77);

  max = input<unknown>(99);

  minLength = input<unknown>(8);

  maxLength = input<unknown>(10);

  pattern = input<unknown>(['owned']);

  dirty = input(true);

  touched = input(true);

  invalid = input(true);

  pending = input(true);

  errors = input<unknown>(['owned']);

  name = input('owned');

  touch = output<void>();
}

registerSignalInputForJit(FormNode, 'formNode', '_formNodeInput');
registerSignalModelForJit(Control, 'value');
registerSignalOutputForJit(Control, 'touch', 'touch');
for (const name of ['disabled', 'readonly', 'hidden', 'required', 'min', 'max', 'minLength', 'maxLength', 'pattern', 'dirty', 'touched', 'invalid', 'pending', 'errors', 'name']) {
  registerSignalInputForJit(Control, name, name);
}

const cleanups: (() => void)[] = [];
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => {
  TestBed.resetTestingModule();
  cleanups.splice(0).reverse().forEach(cleanup => cleanup());
});
afterAll(() => TestBed.resetTestEnvironment());

type Options = { syncInputs?: SyncInputs | null | undefined; disabled?: boolean | (() => boolean); readonly?: boolean; hidden?: boolean };
const createRoot = (kind: string, options: Options = {}) => {
  switch (kind) {
    case 'field': return field('', [required], options);
    case 'form': return form({ name: field('') }, [required], options);
    case 'group': return group({ name: field('') }, [required], options);
    default: return array({ name: field('') }, { ...options, initialValue: 1, validators: [required, minLength(2)] });
  }
};

const bind = (initial: Node) => {
  @Component({ template: '<experimental-control [formNode]="node()" />', imports: [FormNode, Control] })
  class Host {
    node = signal(initial);
  }
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return { fixture, control: fixture.debugElement.children[0]!.componentInstance as Control };
};

describe.each(['field', 'form', 'group', 'array'])('%s experimental input synchronization', (kind) => {
  it('defaults off while preserving value models, touch, and state operations', () => {
    const node = createRoot(kind);
    const { fixture, control } = bind(node);
    expect(control.value()).toEqual(node());
    expect(control.disabled()).toBe(true);
    expect(control.readonly()).toBe(true);
    expect(control.name()).toBe('owned');
    expect(control.errors()).toEqual(['owned']);
    node.$api.disable();
    node.$api.enable();
    control.touch.emit();
    fixture.detectChanges();
    expect(node.$api.touched()).toBe(true);
    expect(control.disabled()).toBe(true);
    if (kind === 'field') {
      control.value.set('Edited');
      expect(node()).toBe('Edited');
      expect(node.$api.dirty()).toBe(true);
    }
  });

  it.each([true, 'only-declared'] as const)('syncs initial declarations with %s without enabling other inputs', (mode) => {
    const disabled = signal(false);
    const node = createRoot(kind, { syncInputs: mode, disabled: () => disabled() });
    const { fixture, control } = bind(node);
    expect(control.disabled()).toBe(false);
    expect(control.required()).toBe(false);
    expect(node.$api.required()).toBe(true);
    expect(control.readonly()).toBe(true);
    expect(control.hidden()).toBe(true);
    expect(control.dirty()).toBe(true);
    expect(control.pending()).toBe(true);
    expect(control.name()).toBe('owned');
    if (kind === 'array') expect(control.minLength()).toBe(8);
    disabled.set(true);
    fixture.detectChanges();
    expect(control.disabled()).toBe(true);
    disabled.set(false);
    fixture.detectChanges();
    expect(control.disabled()).toBe(false);
  });

  it('keeps validator state separate from constraint inputs through edits and removal', () => {
    const node = createRoot(kind, { syncInputs: true, disabled: false });
    const parent = form({ nested: form({ child: node }) });
    const { fixture, control } = bind(node);
    expect(node.$api.required()).toBe(true);
    expect(control.required()).toBe(false);
    if (kind === 'field' || kind === 'array') {
      expect(node.$api.invalid()).toBe(true);
      expect(parent.invalid()).toBe(true);
    }
    node.$api.setValidators([]);
    fixture.detectChanges();
    expect(node.$api.required()).toBe(false);
    expect(node.$api.valid()).toBe(true);
    expect(parent.valid()).toBe(true);
    expect(control.required()).toBe(false);
    expect(control.minLength()).toBe(8);
  });

  it.each(([
    ['disabled', 'dirty'],
    { mode: 'always', inputs: ['disabled', 'dirty'] },
  ] satisfies SyncInputs[]).map(syncInputs => ({ syncInputs })))('synchronizes only explicitly selected inputs with %j', ({ syncInputs }) => {
    const node = createRoot(kind, { syncInputs });
    const { fixture, control } = bind(node);
    expect(control.disabled()).toBe(false);
    expect(control.dirty()).toBe(false);
    expect(control.readonly()).toBe(true);
    expect(control.touched()).toBe(true);
    node.$api.disable();
    fixture.detectChanges();
    expect(control.disabled()).toBe(true);
    node.$api.enable();
    node.$api.markAsDirty();
    fixture.detectChanges();
    expect(control.dirty()).toBe(true);
    node.$api.markAsPristine();
    fixture.detectChanges();
    expect(control.disabled()).toBe(false);
    expect(control.dirty()).toBe(false);
    expect(control.value()).toEqual(node());
  });

  it('intersects explicit inputs with initial declarations in only-declared mode', () => {
    const node = createRoot(kind, {
      disabled: false,
      readonly: false,
      syncInputs: { mode: 'only-declared', inputs: ['disabled', 'dirty', 'required'] },
    });
    const { fixture, control } = bind(node);
    expect(control.disabled()).toBe(false);
    expect(control.dirty()).toBe(true);
    expect(control.readonly()).toBe(true);
    expect(control.required()).toBe(false);
    expect(node.$api.required()).toBe(true);
    node.$api.disable();
    fixture.detectChanges();
    expect(control.disabled()).toBe(true);
  });

  it.each(([[], { mode: 'always', inputs: [] }] satisfies SyncInputs[]).map(syncInputs => ({ syncInputs })))('leaves inputs owned by the component with empty selection %j', ({ syncInputs }) => {
    const { control } = bind(createRoot(kind, { syncInputs, disabled: false }));
    expect(control.disabled()).toBe(true);
    expect(control.dirty()).toBe(true);
    expect(control.name()).toBe('owned');
  });

  it('inherits signal-control-only synchronization and honors node overrides on rebinding', () => {
    cleanups.push(configureGlobalFormNodes({ syncInputs: 'only-signal-controls' }));
    const initial = createRoot(kind);
    const parent = form({ nested: form({ child: initial }) });
    const { fixture, control } = bind(initial);
    expect(control.required()).toBe(true);
    expect(control.disabled()).toBe(false);
    expect(control.dirty()).toBe(false);
    initial.$api.markAsDirty();
    fixture.detectChanges();
    expect(control.dirty()).toBe(true);
    expect(parent.dirty()).toBe(true);
    const optedOut = createRoot(kind, { syncInputs: false, disabled: true });
    fixture.componentInstance.node.set(optedOut);
    fixture.detectChanges();
    expect(control.disabled()).toBe(false);
    const replacement = createRoot(kind, { syncInputs: 'only-signal-controls', disabled: true });
    fixture.componentInstance.node.set(replacement);
    fixture.detectChanges();
    expect(control.disabled()).toBe(true);
    replacement.$api.enable();
    fixture.detectChanges();
    expect(control.disabled()).toBe(false);
    expect(control.value()).toEqual(replacement());
  });

  it('lets node options override providers and updates selection when the bound node changes', () => {
    TestBed.configureTestingModule({ providers: [provideFormNodesConfig({ syncInputs: 'always' })] });
    const original = createRoot(kind, { syncInputs: false });
    const { fixture, control } = bind(original);
    expect(control.disabled()).toBe(true);
    const replacement = createRoot(kind, { syncInputs: true, readonly: false });
    fixture.componentInstance.node.set(replacement);
    fixture.detectChanges();
    expect(control.readonly()).toBe(false);
    expect(control.disabled()).toBe(true);
    const inherited = createRoot(kind);
    fixture.componentInstance.node.set(inherited);
    fixture.detectChanges();
    expect(control.disabled()).toBe(false);
    expect(control.dirty()).toBe(false);
    expect(control.pending()).toBe(false);
    expect(control.name()).not.toBe('owned');
    fixture.componentInstance.node.set(createRoot(kind, { syncInputs: null }));
    fixture.detectChanges();
    expect(control.disabled()).toBe(false);
  });
});

describe('declared constraints and synchronization scopes', () => {
  it.each(([true, 'always', 'only-signal-controls', ['required', 'minLength', 'maxLength', 'pattern']] satisfies SyncInputs[]).map(syncInputs => ({ syncInputs })))('tracks constraints only when their inputs are selected: %j', ({ syncInputs }) => {
    const enabled = signal(false);
    const minimum = signal(2);
    const custom = vi.fn(() => null);
    const name = field('a', [requiredIf(() => enabled()), minLength(() => minimum()), maxLength(10), pattern(/a/), custom], { syncInputs });
    expect(custom).not.toHaveBeenCalled();
    const { fixture, control } = bind(name);
    expect(control.required()).toBe(false);
    expect(control.minLength()).toBe(syncInputs === true ? 8 : 2);
    expect(control.maxLength()).toBe(10);
    expect(control.pattern()).toEqual(syncInputs === true ? ['owned'] : [/a/]);
    enabled.set(true);
    minimum.set(4);
    fixture.detectChanges();
    expect(name.required()).toBe(true);
    expect(name.minLength()).toBe(4);
    expect(name.hasError('minLength')).toBe(true);
    expect(custom).toHaveBeenCalled();
    expect(control.required()).toBe(syncInputs !== true);
    expect(control.minLength()).toBe(syncInputs === true ? 8 : 4);
    name.setValidators([]);
    fixture.detectChanges();
    expect(control.required()).toBe(false);
    expect(name.valid()).toBe(true);
    expect(control.minLength()).toBe(syncInputs === true ? 8 : undefined);
    expect(control.pattern()).toEqual(syncInputs === true ? ['owned'] : []);
  });

  it('does not infer declarations from later validators, state mutations, or parent options', () => {
    const name = field('a', { syncInputs: true });
    const parent = form({ name }, { syncInputs: 'always', disabled: false });
    const { fixture, control } = bind(name);
    name.setValidators(minLength(3));
    parent.disable();
    name.markAsReadonly();
    fixture.detectChanges();
    expect(control.minLength()).toBe(8);
    expect(control.disabled()).toBe(true);
    expect(control.readonly()).toBe(true);
    const fresh = field('a', { syncInputs: 'always' });
    fresh.setValidators(minLength(3));
    fixture.componentInstance.node.set(fresh);
    fixture.detectChanges();
    expect(control.minLength()).toBe(3);
  });

  it('excludes validator constraints with only-declared factory defaults in cloned array templates', () => {
    const factories = createFormPrimitives({ syncInputs: true });
    const rows = factories.array({ age: factories.field(2, [min(1), max(4)], { disabled: false }) }, { initialValue: 1 });
    const first = rows.at(0)!.age;
    const { fixture, control } = bind(first);
    expect(control.min()).toBe(77);
    expect(control.max()).toBe(99);
    expect(control.disabled()).toBe(false);
    const next = rows.push();
    fixture.componentInstance.node.set(next.age);
    fixture.detectChanges();
    expect(control.min()).toBe(77);
    expect(control.max()).toBe(99);
    const optedOut = factories.field('', { syncInputs: null });
    fixture.componentInstance.node.set(optedOut);
    fixture.detectChanges();
    expect(control.min()).toBe(77);
  });

  it('replaces global and provider selections with node options on rebinding', () => {
    cleanups.push(configureGlobalFormNodes({ syncInputs: ['disabled'] }));
    const globalBinding = bind(field(''));
    expect(globalBinding.control.disabled()).toBe(false);
    expect(globalBinding.control.dirty()).toBe(true);
    globalBinding.fixture.destroy();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideFormNodesConfig({ syncInputs: { mode: 'always', inputs: ['dirty'] } })] });
    const { fixture, control } = bind(field(''));
    expect(control.disabled()).toBe(true);
    expect(control.dirty()).toBe(false);
    const replacement = field('', { syncInputs: ['disabled'] });
    fixture.componentInstance.node.set(replacement);
    fixture.detectChanges();
    expect(control.disabled()).toBe(false);
    replacement.markAsDirty();
    fixture.detectChanges();
    expect(control.dirty()).toBe(false);
  });

  it('preserves selected factory inputs in newly cloned nodes', () => {
    const factories = createFormPrimitives({ syncInputs: ['min', 'max'] });
    const rows = factories.array({ age: factories.field(2, [min(1), max(4)]) });
    const { fixture, control } = bind(rows.push().age);
    expect(control.min()).toBe(1);
    expect(control.max()).toBe(4);
    expect(control.disabled()).toBe(true);
    fixture.componentInstance.node.set(rows.push().age);
    fixture.detectChanges();
    expect(control.min()).toBe(1);
    expect(control.max()).toBe(4);
  });

  it('lets an explicit provider opt out of global synchronization', () => {
    cleanups.push(configureGlobalFormNodes({ syncInputs: 'always' }));
    TestBed.configureTestingModule({ providers: [provideFormNodesConfig({ syncInputs: null })] });
    const { control } = bind(field(''));
    expect(control.disabled()).toBe(true);
    expect(control.value()).toBe('');
  });
});
