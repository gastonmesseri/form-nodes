// @vitest-environment jsdom

import '@angular/compiler';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { Component, forwardRef, model, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import type { AnyNode } from '../types/node.type';
import { FormNodeDirective } from './form-node.directive';
import { required } from '../validation/validators/required';
import { useFormNodeState } from '../form-node-state/form-node-state';
import { registerSignalInputForJit, registerSignalModelForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');
registerSignalInputForJit(FormNodeDirective, 'formNodeValue', '_formNodeValue');
registerSignalOutputForJit(FormNodeDirective, 'formNodeValueChange');
registerSignalOutputForJit(FormNodeDirective, 'formNodeControlValueChange');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

@Component({
  selector: 'standalone-cva',
  template: '',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StandaloneCva), multi: true }],
})
class StandaloneCva implements ControlValueAccessor {
  issue = signal<string | null>(null);

  state = useFormNodeState({ errors: () => this.issue() });

  writeValue = vi.fn((_value: unknown) => {});

  setDisabledState = vi.fn((_disabled: boolean) => {});

  change = (_value: unknown) => {};

  touch = () => {};

  registerOnChange(callback: (value: unknown) => void) {
    this.change = callback;
  }

  registerOnTouched(callback: () => void) {
    this.touch = callback;
  }
}

@Component({
  template: `<standalone-cva [formNode]="bound()" [formNodeValue]="source()"
    (formNodeValueChange)="commits.push($event)" (formNodeControlValueChange)="drafts.push($event)" />`,
  imports: [FormNodeDirective, StandaloneCva],
})
class Host {
  source = signal<unknown>('Ada');

  bound = signal<AnyNode | undefined>(undefined);

  commits: unknown[] = [];

  drafts: unknown[] = [];
}

const setup = () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const element = fixture.debugElement.query(By.directive(StandaloneCva));
  const control = element.componentInstance as StandaloneCva;
  const binding = element.injector.get(FormNodeDirective);
  return { fixture, host: fixture.componentInstance, control, binding };
};

describe('formNodeValue', () => {
  it('seeds one independent field during CVA setup and preserves local edits', () => {
    const { fixture, host, control, binding } = setup();
    const node = binding.node();
    expect(control.writeValue).toHaveBeenCalledExactlyOnceWith('Ada');
    expect(node()).toBe('Ada');
    expect(node.$api.nodeType()).toBe('field');
    expect(node.$api.parent()).toBeNull();
    expect(node.$api.root()).toBe(node);
    expect(node.$api.dirty()).toBe(false);
    control.writeValue.mockClear();
    control.change('Grace');
    control.touch();
    fixture.detectChanges();
    expect(node()).toBe('Grace');
    expect(node.$api.dirty()).toBe(true);
    expect(node.$api.touched()).toBe(true);
    expect(host.source()).toBe('Ada');
    expect(host.commits).toEqual(['Grace']);
    expect(host.drafts).toEqual(['Grace']);
    expect(control.writeValue).not.toHaveBeenCalled();
    host.source.set('Lin');
    fixture.detectChanges();
    expect(binding.node()).toBe(node);
    expect(node()).toBe('Lin');
    expect(node.$api.dirty()).toBe(true);
    expect(node.$api.touched()).toBe(true);
    expect(control.writeValue).toHaveBeenCalledExactlyOnceWith('Lin');
    expect(host.commits).toEqual(['Grace']);
    binding.reset();
    fixture.detectChanges();
    expect(node()).toBe('Lin');
    node.$api.resetToInitial();
    expect(node()).toBe('Ada');
    expect(node.$api.dirty()).toBe(false);
    expect(node.$api.touched()).toBe(false);
    expect(host.source()).toBe('Lin');
  });

  it.each([null, undefined, { name: 'Ada' }, ['Ada'], () => 'Ada'])('keeps %s as an atomic field value', (value) => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.source.set(value);
    fixture.detectChanges();
    const binding = fixture.debugElement.query(By.directive(FormNodeDirective)).injector.get(FormNodeDirective);
    expect(binding.node()()).toEqual(value);
    expect(binding.node().$api.nodeType()).toBe('field');
    expect(binding.node().$api.parent()).toBeNull();
  });

  it('reuses an explicit node, preserves its validation and cancels pending input on source changes', () => {
    const fixture = TestBed.createComponent(Host);
    const node = field<unknown>('', required, { debounce: 'blur' });
    fixture.componentInstance.bound.set(node);
    fixture.detectChanges();
    const control = fixture.debugElement.query(By.directive(StandaloneCva)).componentInstance as StandaloneCva;
    expect(node()).toBe('Ada');
    expect(node.valid()).toBe(true);
    control.change('Grace');
    expect(node()).toBe('Ada');
    expect(fixture.componentInstance.commits).toEqual([]);
    expect(fixture.componentInstance.drafts).toEqual(['Grace']);
    fixture.componentInstance.source.set('');
    fixture.detectChanges();
    expect(node()).toBe('');
    expect(node.valid()).toBe(false);
    control.touch();
    expect(node()).toBe('');
    expect(fixture.componentInstance.commits).toEqual([]);
    control.change('Lin');
    control.touch();
    expect(node()).toBe('Lin');
    expect(fixture.componentInstance.commits).toEqual(['Lin']);
  });

  it('moves contributed errors on rebinding and reuses its original standalone field', () => {
    const { fixture, host, control, binding } = setup();
    const local = binding.node();
    control.issue.set('Invalid date');
    fixture.detectChanges();
    expect(local.$api.errors()[0]?.message).toBe('Invalid date');
    expect(control.state.invalid()).toBe(true);
    const root = form({ nested: form({ date: field<unknown>('') }) });
    host.bound.set(root.nested.date);
    fixture.detectChanges();
    expect(binding.node()).toBe(root.nested.date);
    expect(root.nested.date()).toBe('Ada');
    expect(local.$api.errors()).toEqual([]);
    expect(root.invalid()).toBe(true);
    expect(root.nested.invalid()).toBe(true);
    host.bound.set(undefined);
    fixture.detectChanges();
    expect(binding.node()).toBe(local);
    expect(root.valid()).toBe(true);
    expect(local.$api.invalid()).toBe(true);
    fixture.destroy();
    expect(local.$api.errors()).toEqual([]);
    control.change('after destruction');
    expect(local()).toBe('Ada');
  });

  it('updates aggregate values programmatically and propagates explicit-node validation', () => {
    const fixture = TestBed.createComponent(Host);
    const changed = vi.fn();
    const profile = form({ nested: form({ name: field('', required) }) }, { onValueChange: changed });
    fixture.componentInstance.bound.set(profile);
    fixture.componentInstance.source.set({ nested: { name: 'Ada' } });
    fixture.detectChanges();
    expect(profile()).toEqual({ nested: { name: 'Ada' } });
    expect(profile.valid()).toBe(true);
    expect(profile.pristine()).toBe(true);
    expect(changed).toHaveBeenCalledTimes(1);
    fixture.componentInstance.source.set({ nested: { name: '' } });
    fixture.detectChanges();
    expect(profile.invalid()).toBe(true);
    expect(profile.nested.invalid()).toBe(true);
    expect(profile.nested.name.invalid()).toBe(true);
    expect(changed).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.commits).toEqual([]);
  });

  it('ignores deferred output from a node replaced by a standalone binding', () => {
    const fixture = TestBed.createComponent(Host);
    const node = field.strict('Ada', { debounce: 'blur' });
    fixture.componentInstance.bound.set(node);
    fixture.detectChanges();
    const control = fixture.debugElement.query(By.directive(StandaloneCva)).componentInstance as StandaloneCva;
    control.change('Grace');
    fixture.componentInstance.bound.set(undefined);
    fixture.detectChanges();
    node.flush();
    expect(node()).toBe('Grace');
    expect(fixture.componentInstance.commits).toEqual([]);
    expect(control.writeValue.mock.lastCall).toEqual(['Ada']);
    control.change('Lin');
    expect(fixture.componentInstance.commits).toEqual(['Lin']);
  });

  it('uses a newly bound node even when the source value stays equal', () => {
    const { fixture, host, binding } = setup();
    const first = field<unknown>('first');
    const second = field<unknown>('second');
    host.bound.set(first);
    fixture.detectChanges();
    expect(first()).toBe('Ada');
    host.bound.set(second);
    fixture.detectChanges();
    expect(binding.node()).toBe(second);
    expect(second()).toBe('Ada');
    expect(host.commits).toEqual([]);
  });

  it('supports native two-way bindings without registering in an ancestor form', () => {
    @Component({
      template: `<form [formNode]="profile"><input [(formNodeValue)]="name" /></form>`,
      imports: [FormNodeDirective],
    })
    class NativeHost {
      profile = form({ age: field(42) });

      name = signal('Ada');
    }
    const fixture = TestBed.createComponent(NativeHost);
    fixture.detectChanges();
    const element = fixture.debugElement.query(By.css('input'));
    const input = element.nativeElement as HTMLInputElement;
    const binding = element.injector.get(FormNodeDirective);
    expect(input.value).toBe('Ada');
    input.value = 'Grace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.name()).toBe('Grace');
    expect(binding.node()()).toBe('Grace');
    expect(binding.node().$api.parent()).toBeNull();
    expect(fixture.componentInstance.profile()).toEqual({ age: 42 });
    expect(fixture.componentInstance.profile.dirty()).toBe(false);
    fixture.componentInstance.name.set('Lin');
    fixture.detectChanges();
    expect(input.value).toBe('Lin');
  });

  it('does not overwrite a newer draft when two-way binding echoes a committed value', () => {
    @Component({
      template: `<standalone-cva [formNode]="name" [(formNodeValue)]="source" />`,
      imports: [FormNodeDirective, StandaloneCva],
    })
    class EchoHost {
      name = field.strict('Ada', { debounce: 'blur' });

      source = signal('Ada');
    }
    const fixture = TestBed.createComponent(EchoHost);
    fixture.detectChanges();
    const control = fixture.debugElement.query(By.directive(StandaloneCva)).componentInstance as StandaloneCva;
    control.change('Grace');
    control.touch();
    expect(fixture.componentInstance.source()).toBe('Grace');
    control.change('Lin');
    fixture.detectChanges();
    expect(fixture.componentInstance.name()).toBe('Grace');
    control.touch();
    expect(fixture.componentInstance.name()).toBe('Lin');
    expect(fixture.componentInstance.source()).toBe('Lin');
  });

  it('binds a model-based custom control with the same standalone state', () => {
    @Component({ selector: 'standalone-model', template: '' })
    class ModelControl {
      value = model('');

      state = useFormNodeState();
    }
    registerSignalModelForJit(ModelControl, 'value');
    @Component({
      template: `<standalone-model [(formNodeValue)]="name" />`,
      imports: [FormNodeDirective, ModelControl],
    })
    class ModelHost {
      name = signal('Ada');
    }
    const fixture = TestBed.createComponent(ModelHost);
    fixture.detectChanges();
    const control = fixture.debugElement.query(By.directive(ModelControl)).componentInstance as ModelControl;
    expect(control.value()).toBe('Ada');
    control.value.set('Grace');
    fixture.detectChanges();
    expect(fixture.componentInstance.name()).toBe('Grace');
    expect(control.state.dirty()).toBe(true);
  });
});
