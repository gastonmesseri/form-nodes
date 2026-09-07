// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Component, EventEmitter, Input, Output, input, output, signal } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../../../primitives/form';
import { field } from '../../../primitives/field';
import type { Node } from '../../../types/node.type';
import { FormNode } from '../../form-node.directive';
import { required } from '../../../validation/validators/required';
import { provideFormNodesConfig } from '../../provide-form-nodes-config';
import type { SyncInputs } from '../../../configuration/node-input-config';
import { configureGlobalFormNodes } from '../../../configuration/configure-global-form-nodes';
import { registerSignalInputForJit, registerSignalOutputForJit } from '../../../../../tests/helpers/register-signal-input-for-jit';

@Component({ selector: 'paired-control', template: '' })
class PairedControl {
  data = input<unknown>('owned', { alias: 'value' });

  // eslint-disable-next-line @angular-eslint/no-output-rename -- Verify public aliases on existing custom controls.
  changed = output<unknown>({ alias: 'valueChange' });

  disabled = input(true);

  touch = output<void>();
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

const modes: (SyncInputs | null | undefined)[] = [undefined, false, null, 'only-signal-controls', true, 'only-declared', 'always', [], ['disabled'], { mode: 'always', inputs: [] }, { mode: 'only-declared', inputs: ['disabled'] }];

describe.each(['field', 'form'] as const)('%s experimental paired control', (kind) => {
  it.each(modes.map(syncInputs => ({ syncInputs })))('gates value, validation and interaction with $syncInputs', ({ syncInputs }) => {
    const node = kind === 'field'
      ? field('initial', [required], { syncInputs })
      : form({ name: field('initial', [required]) }, { syncInputs });
    const initial = node();
    const enabled = syncInputs !== undefined && syncInputs !== false && syncInputs !== null && syncInputs !== 'only-signal-controls';
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

  it.each([false, 'only-signal-controls'] as const)('pauses on a replacement with %s and resynchronizes when returning to the enabled node', (syncInputs) => {
    const enabled = kind === 'field' ? field('initial', { syncInputs: [] }) : form({ name: field('initial') }, { syncInputs: [] });
    const disabled = kind === 'field' ? field('off', { syncInputs }) : form({ name: field('off') }, { syncInputs });
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
  it.each([false, true])('connects classic input/output properties only with syncInputs=%s', (syncInputs) => {
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
      active = field.strict(true, { syncInputs });
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as Checkbox;
    expect(control.checked).toBe(syncInputs);
    control.checkedChange.emit(false);
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe(!syncInputs);
    fixture.componentInstance.active.set(true);
    fixture.detectChanges();
    expect(control.checked).toBe(syncInputs);
  });
});

describe('paired control configuration', () => {
  it('uses global and provider selections with explicit node opt-out', () => {
    cleanups.push(configureGlobalFormNodes({ syncInputs: [] }));
    const first = bind(field('global'));
    expect(first.control.data()).toBe('global');
    first.fixture.destroy();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideFormNodesConfig({ syncInputs: false })] });
    const { fixture, control } = bind(field('provider off'));
    expect(control.data()).toBe('owned');
    fixture.componentInstance.node.set(field('node override', { syncInputs: true }));
    fixture.detectChanges();
    expect(control.data()).toBe('node override');
    fixture.componentInstance.node.set(field('explicit off', { syncInputs: null }));
    fixture.detectChanges();
    control.changed.emit('ignored');
    expect(fixture.componentInstance.node()()).toBe('explicit off');
  });

  it('propagates nested aggregate edits and programmatic resets through its parent form', () => {
    const parent = form({
      profile: form({ name: field('initial', [required]) }, { syncInputs: [] }),
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
    const name = field('initial', { syncInputs: [], debounce: 'blur' });
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
