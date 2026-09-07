// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Component, EventEmitter, Input, Output, input, output, signal } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../../../primitives/form';
import { field } from '../../../primitives/field';
import type { Node } from '../../../types/node.type';
import { FormNode, FORM_NODE } from '../../form-node.directive';
import { required } from '../../../validation/validators/required';
import { provideFormNodesConfig } from '../../provide-form-nodes-config';
import type { SyncInputs } from '../../../configuration/node-input-config';
import { createFormPrimitives } from '../../../primitives/create-form-primitives';
import { configureGlobalFormNodes } from '../../../configuration/configure-global-form-nodes';
import { registerSignalInputForJit, registerSignalOutputForJit } from '../../../../../tests/helpers/register-signal-input-for-jit';

@Component({ selector: 'paired-control', template: '' })
class PairedControl {
  data = input<unknown>('owned', { alias: 'value' });

  // eslint-disable-next-line @angular-eslint/no-output-rename -- Verify public aliases on existing custom controls.
  changed = output<unknown>({ alias: 'valueChange' });

  disabled = input(true);

  touch = output<void>();

  node = signal<Node | null>(null);

  focuses = 0;

  resets = 0;

  focus() { this.focuses++; }

  reset() { this.resets++; }
}

registerSignalInputForJit(FormNode, 'formNode', '_formNodeInput');
registerSignalInputForJit(PairedControl, 'value', 'data');
registerSignalInputForJit(PairedControl, 'disabled', 'disabled');
registerSignalOutputForJit(PairedControl, 'valueChange', 'changed');
registerSignalOutputForJit(PairedControl, 'touch');

const cleanups: (() => void)[] = [];
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => {
  TestBed.resetTestingModule();
  cleanups.splice(0).reverse().forEach(cleanup => cleanup());
});
afterAll(() => TestBed.resetTestEnvironment());

const bind = (initial: Node) => {
  @Component({ template: '<paired-control [formNode]="node()" [value]="authored()" />', imports: [FormNode, PairedControl] })
  class Host {
    node = signal(initial);

    authored = signal<unknown>('owned');
  }
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return { fixture, control: fixture.debugElement.children[0]!.componentInstance as PairedControl };
};

const modes = ([false, 'declared', 'all', 'signal-controls', [], ['disabled'], { inputs: 'all' }, { inputs: 'declared' }, { inputs: ['disabled'], target: 'signal-controls' }] satisfies SyncInputs[])
  .flatMap(syncInputs => [undefined, false, null, true].map(bindInputOutputPairs => ({ syncInputs, bindInputOutputPairs })));

describe.each(['field', 'form'] as const)('%s experimental paired control', (kind) => {
  it.each(modes)('gates value, validation and interaction with %j', ({ syncInputs, bindInputOutputPairs }) => {
    const node = kind === 'field'
      ? field('initial', [required], { syncInputs, bindInputOutputPairs })
      : form({ name: field('initial', [required]) }, { syncInputs, bindInputOutputPairs });
    const initial = node();
    const enabled = bindInputOutputPairs === true;
    const { fixture, control } = bind(node);
    expect(control.data()).toEqual(enabled ? initial : 'owned');
    expect(node.$api.dirty()).toBe(false);
    const edited = kind === 'field' ? '' : { name: '' };
    control.changed.emit(edited);
    control.touch.emit();
    fixture.detectChanges();
    expect(node()).toEqual(enabled ? edited : initial);
    expect(node.$api.dirty()).toBe(enabled);
    expect(node.$api.touched()).toBe(enabled);
    expect(node.$api.invalid()).toBe(enabled);
    node.$api.reset();
    fixture.detectChanges();
    expect(control.data()).toEqual(enabled ? edited : 'owned');
    expect(node.$api.dirty()).toBe(false);
    expect(node.$api.touched()).toBe(false);
    expect(node.$api.valid()).toBe(!enabled);
  });

  it('pauses the complete pair connection and restores it on rebinding', () => {
    const createNode = (bindInputOutputPairs: boolean) => {
      return kind === 'field'
        ? field('initial', { bindInputOutputPairs, syncInputs: 'all' })
        : form({ name: field('initial') }, { bindInputOutputPairs, syncInputs: 'all' });
    };
    const active = createNode(true);
    const inactive = createNode(false);
    const { fixture, control } = bind(active);
    const binding = fixture.debugElement.children[0]!.injector.get(FORM_NODE);
    expect(control.node()).toBe(active);
    expect(control.disabled()).toBe(false);
    binding.focus();
    active.$api.reset();
    expect(control.focuses).toBe(1);
    expect(control.resets).toBe(1);
    inactive.$api.disable();
    fixture.componentInstance.node.set(inactive);
    fixture.detectChanges();
    expect(control.node()).toBeNull();
    expect(control.disabled()).toBe(false);
    binding.focus();
    inactive.$api.reset();
    control.touch.emit();
    control.changed.emit(kind === 'field' ? 'ignored' : { name: 'ignored' });
    fixture.detectChanges();
    expect(control.focuses).toBe(1);
    expect(control.resets).toBe(1);
    expect(inactive.$api.touched()).toBe(false);
    expect(inactive.$api.dirty()).toBe(false);
    fixture.componentInstance.node.set(active);
    fixture.detectChanges();
    expect(control.node()).toBe(active);
    expect(control.data()).toEqual(active());
    binding.focus();
    active.$api.reset();
    expect(control.focuses).toBe(2);
    expect(control.resets).toBe(2);
    fixture.destroy();
    expect(control.node()).toBeNull();
    expect(active.$api.dirty()).toBe(false);
  });

  it.each([false, null] as const)('pauses on a replacement with %s and resynchronizes when returning to the enabled node', (bindInputOutputPairs) => {
    const enabled = kind === 'field' ? field('initial', { bindInputOutputPairs: true }) : form({ name: field('initial') }, { bindInputOutputPairs: true });
    const disabled = kind === 'field' ? field('off', { bindInputOutputPairs }) : form({ name: field('off') }, { bindInputOutputPairs });
    const { fixture, control } = bind(enabled);
    expect(control.disabled()).toBe(true);
    fixture.componentInstance.node.set(disabled);
    fixture.detectChanges();
    control.changed.emit(kind === 'field' ? 'ignored' : { name: 'ignored' });
    fixture.detectChanges();
    expect(disabled()).toEqual(kind === 'field' ? 'off' : { name: 'off' });
    expect(control.data()).toEqual(enabled());
    fixture.componentInstance.authored.set('consumer value');
    fixture.detectChanges();
    expect(control.data()).toBe('consumer value');
    fixture.componentInstance.node.set(enabled);
    fixture.detectChanges();
    expect(control.data()).toEqual(enabled());
    control.changed.emit(kind === 'field' ? 'edited' : { name: 'edited' });
    fixture.detectChanges();
    expect(enabled()).toEqual(kind === 'field' ? 'edited' : { name: 'edited' });
    expect(disabled()).toEqual(kind === 'field' ? 'off' : { name: 'off' });
  });
});

describe('decorator checkbox pairs', () => {
  it.each([false, true])('connects classic input/output properties only with bindInputOutputPairs=%s', (bindInputOutputPairs) => {
    @Component({ selector: 'classic-checkbox', template: '' })
    class Checkbox {
      // eslint-disable-next-line @angular-eslint/prefer-signals -- Cover interoperability with existing decorator-based controls.
      @Input() checked = false;

      @Output() checkedChange = new EventEmitter<boolean>();
    }
    @Component({
      template: '<classic-checkbox [formNode]="active" />',
      imports: [FormNode, Checkbox],
    })
    class Host {
      active = field.strict(true, { bindInputOutputPairs });
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as Checkbox;
    expect(control.checked).toBe(bindInputOutputPairs);
    control.checkedChange.emit(false);
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe(!bindInputOutputPairs);
    fixture.componentInstance.active.set(true);
    fixture.detectChanges();
    expect(control.checked).toBe(bindInputOutputPairs);
  });
});

describe('paired control configuration', () => {
  it('inherits pair configuration independently from input selections and snapshots global fallback', () => {
    cleanups.push(configureGlobalFormNodes({ bindInputOutputPairs: true, syncInputs: 'all' }));
    TestBed.configureTestingModule({ providers: [provideFormNodesConfig({ syncInputs: false })] });
    const { fixture, control } = bind(field('global pair'));
    expect(control.data()).toBe('global pair');
    expect(control.disabled()).toBe(true);
    cleanups.push(configureGlobalFormNodes({ bindInputOutputPairs: false }));
    fixture.componentInstance.node.set(field('captured pair'));
    fixture.detectChanges();
    expect(control.data()).toBe('captured pair');
    fixture.destroy();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideFormNodesConfig({ bindInputOutputPairs: true })] });
    const provided = bind(field('provider pair', { syncInputs: ['disabled'] }));
    expect(provided.control.data()).toBe('provider pair');
    expect(provided.control.disabled()).toBe(false);
    provided.fixture.componentInstance.node.set(field('explicit off', { bindInputOutputPairs: null, syncInputs: 'all' }));
    provided.fixture.detectChanges();
    expect(provided.control.data()).toBe('provider pair');
    expect(provided.control.node()).toBeNull();
  });

  it('preserves independent factory defaults through dynamic array template cloning', () => {
    const factories = createFormPrimitives({ bindInputOutputPairs: true, syncInputs: ['disabled'] });
    const rows = factories.array({ name: factories.field('default') });
    const first = rows.push().name;
    const { fixture, control } = bind(first);
    expect(control.data()).toBe('default');
    expect(control.disabled()).toBe(false);
    fixture.componentInstance.node.set(rows.push().name);
    fixture.detectChanges();
    control.changed.emit('next');
    expect(rows.at(1)!.name()).toBe('next');
    expect(first()).toBe('default');
    const optedOut = factories.field('off', { bindInputOutputPairs: null, syncInputs: undefined });
    fixture.componentInstance.node.set(optedOut);
    fixture.detectChanges();
    control.changed.emit('ignored');
    expect(optedOut()).toBe('off');
  });

  it('uses global and provider selections with explicit node opt-out', () => {
    cleanups.push(configureGlobalFormNodes({ bindInputOutputPairs: true }));
    const first = bind(field('global'));
    expect(first.control.data()).toBe('global');
    first.fixture.destroy();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideFormNodesConfig({ bindInputOutputPairs: false })] });
    const { fixture, control } = bind(field('provider off'));
    expect(control.data()).toBe('owned');
    fixture.componentInstance.node.set(field('node override', { bindInputOutputPairs: true }));
    fixture.detectChanges();
    expect(control.data()).toBe('node override');
    fixture.componentInstance.node.set(field('explicit off', { bindInputOutputPairs: null }));
    fixture.detectChanges();
    control.changed.emit('ignored');
    expect(fixture.componentInstance.node()()).toBe('explicit off');
  });

  it('propagates nested aggregate edits and programmatic resets through its parent form', () => {
    const parent = form({
      profile: form({ name: field('initial', [required]) }, { bindInputOutputPairs: true }),
    });
    const { fixture, control } = bind(parent.profile);
    expect(control.data()).toEqual({ name: 'initial' });
    control.changed.emit({ name: '' });
    control.touch.emit();
    fixture.detectChanges();
    expect(parent()).toEqual({ profile: { name: '' } });
    expect(parent.invalid()).toBe(true);
    expect(parent.dirty()).toBe(true);
    expect(parent.profile.dirty()).toBe(true);
    expect(parent.profile.name.dirty()).toBe(false);
    parent.reset({ profile: { name: 'restored' } });
    fixture.detectChanges();
    expect(control.data()).toEqual({ name: 'restored' });
    expect(parent.valid()).toBe(true);
    expect(parent.dirty()).toBe(false);
    expect(parent.touched()).toBe(false);
  });

  it('preserves pending control values and commits debounced input on touch', () => {
    const name = field('initial', { bindInputOutputPairs: true, debounce: 'blur' });
    const { fixture, control } = bind(name);
    control.changed.emit('pending');
    fixture.detectChanges();
    expect(name()).toBe('initial');
    expect(control.data()).toBe('pending');
    control.touch.emit();
    fixture.detectChanges();
    expect(name()).toBe('pending');
    expect(name.touched()).toBe(true);
  });
});
