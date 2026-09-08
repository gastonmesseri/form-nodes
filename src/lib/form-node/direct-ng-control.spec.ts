// @vitest-environment jsdom
import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { beforeAll, afterAll, afterEach, describe, it, expect, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import type { AnyNode } from '../types/node.type';
import { FormNodeDirective } from './form-node.directive';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';
import { useLegacyNgControl, useFormControlState } from '../../../tests/helpers/legacy-ng-control-hook';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

@Component({ selector: 'hook-control', template: '' })
class HookControl {
  rendered: unknown;

  disabled = false;

  writes: unknown[] = [];

  hook = useLegacyNgControl({
    writeValue: (value) => {
      this.rendered = value;
      this.writes.push(value);
    },
    setDisabledState: (disabled) => { this.disabled = disabled; },
  });
}

@Component({
  template: '<hook-control [formNode]="node()" />',
  imports: [FormNodeDirective, HookControl],
})
class Host {
  node = signal<AnyNode>(field(''));
}

const bind = (node: AnyNode) => {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.node.set(node);
  fixture.detectChanges();
  const component = fixture.debugElement.children[0]!.componentInstance as HookControl;
  const hook = component.hook;
  // Force lazy observer creation before changing any node state.
  hook.value();
  hook.errors();
  hook.touched();
  hook.dirty();
  return { fixture, component, hook };
};

describe('direct NgControl hook integration', () => {
  it('prefers a directly assigned accessor over a provided accessor', () => {
    const fallback = { writeValue: vi.fn(), registerOnChange: vi.fn(), registerOnTouched: vi.fn() };
    TestBed.overrideComponent(HookControl, {
      add: { providers: [{ provide: NG_VALUE_ACCESSOR, useValue: fallback, multi: true }] },
    });
    const { component, hook } = bind(field('Mark'));
    expect(component.rendered).toBe('Mark');
    expect(hook.initialized()).toBe(true);
    expect(fallback.writeValue).not.toHaveBeenCalled();
    expect(fallback.registerOnChange).not.toHaveBeenCalled();
  });

  it.each(['field', 'form'] as const)('keeps hook values and state current for a %s through edits, reset, and rebinding', (kind) => {
    const profile = form({ name: field('', [required]) });
    const node = kind === 'field' ? profile.name : profile;
    const { fixture, component, hook } = bind(node);
    const observed = vi.fn();
    hook.onWriteValue(observed);
    expect(hook.initialized()).toBe(true);
    expect(component.rendered).toEqual(kind === 'field' ? '' : { name: '' });
    expect(hook.invalid()).toBe(true);
    expect(hook.required()).toBe(kind === 'field');
    const edited = kind === 'field' ? 'Mark' : { name: 'Mark' };
    hook.emitChange(edited);
    hook.markAsTouched();
    fixture.detectChanges();
    expect(node()).toEqual(edited);
    expect(hook.value()).toEqual(edited);
    expect(hook.errors()).toBeNull();
    expect(hook.valid()).toBe(true);
    expect(hook.dirty()).toBe(true);
    expect(hook.touched()).toBe(true);
    expect(profile.touched()).toBe(true);

    profile.name.set('Jane');
    fixture.detectChanges();
    expect(hook.value()).toEqual(kind === 'field' ? 'Jane' : { name: 'Jane' });
    expect(observed).toHaveBeenLastCalledWith(kind === 'field' ? 'Jane' : { name: 'Jane' });
    profile.disable();
    fixture.detectChanges();
    expect(component.disabled).toBe(true);
    expect(hook.disabled()).toBe(true);
    profile.enable();
    profile.reset({ name: '' });
    fixture.detectChanges();
    expect(hook.disabled()).toBe(false);
    expect(hook.value()).toEqual(kind === 'field' ? '' : { name: '' });
    expect(hook.invalid()).toBe(true);
    expect(hook.errors() !== null).toBe(kind === 'field');
    expect(hook.touched()).toBe(false);
    expect(hook.dirty()).toBe(false);

    const replacement = form({ nested: form({ name: field('New') }) });
    fixture.componentInstance.node.set(replacement.nested);
    fixture.detectChanges();
    expect(hook.value()).toEqual({ name: 'New' });
    expect(hook.valid()).toBe(true);
    hook.emitChange({ name: 'Changed' });
    hook.markAsTouched();
    fixture.detectChanges();
    expect(replacement()).toEqual({ nested: { name: 'Changed' } });
    expect(replacement.touched()).toBe(true);
    expect(hook.touched()).toBe(true);
    fixture.destroy();
    hook.emitChange({ name: 'Detached' });
    expect(replacement()).toEqual({ nested: { name: 'Changed' } });
  });

  it.each(['field', 'form'] as const)('updates untracked observers for async errors on a %s without duplicate validator execution', async (kind) => {
    let finish!: (errors: { kind: string }[]) => void;
    const validate = vi.fn(() => new Promise<{ kind: string }[]>((resolve) => { finish = resolve; }));
    const profile = kind === 'field'
      ? form({ name: field('Mark', [asyncValidator(validate)]) })
      : form({ name: field('Mark') }, { validators: [asyncValidator(validate)] });
    const { fixture, hook } = bind(kind === 'field' ? profile.name : profile);
    const state = useFormControlState(hook.ngFormControl()!);
    expect(state.pending()).toBe(true);
    expect(state.errors()).toBeNull();
    await vi.waitFor(() => expect(validate).toHaveBeenCalledTimes(1));
    const calls = validate.mock.calls.length;
    finish([{ kind: 'taken' }]);
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(state.pending()).toBe(false);
    });
    expect(state.invalid()).toBe(true);
    expect(state.errors()).toHaveProperty('taken');
    expect(hook.errors()).toHaveProperty('taken');
    expect(profile.invalid()).toBe(true);
    expect(validate).toHaveBeenCalledTimes(calls);
    hook.ngFormControl()!.setErrors({ server: 'denied' });
    fixture.detectChanges();
    expect(hook.errors()).toHaveProperty('server', 'denied');
    expect(hook.errorsAsArray()).toContainEqual({ key: 'server', value: 'denied' });
    hook.ngFormControl()!.setErrors(null);
    fixture.detectChanges();
    expect(hook.errors()).not.toHaveProperty('server');
    expect(hook.errors()).toHaveProperty('taken');
  });
});
