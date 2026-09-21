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
  template: `<standalone-cva [formNode]="bound()"
    (formNodeValueChange)="commits.push($event)" (formNodeChange)="changes.push($event)" (formNodeControlValueChange)="drafts.push($event)" />`,
  imports: [FormNodeDirective, StandaloneCva],
})
class Host {
  bound = signal<AnyNode>(field('Ada'));

  commits: unknown[] = [];

  changes: unknown[] = [];

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

describe('explicit node binding', () => {
  it('reuses an explicit node, preserves its validation and cancels pending input on programmatic writes', () => {
    const fixture = TestBed.createComponent(Host);
    const node = field<unknown>('Ada', required, { debounce: 'blur' });
    fixture.componentInstance.bound.set(node);
    fixture.detectChanges();
    const control = fixture.debugElement.query(By.directive(StandaloneCva)).componentInstance as StandaloneCva;
    expect(node()).toBe('Ada');
    expect(node.valid()).toBe(true);
    control.change('Grace');
    expect(node()).toBe('Ada');
    expect(fixture.componentInstance.commits).toEqual([]);
    expect(fixture.componentInstance.changes).toEqual([]);
    expect(fixture.componentInstance.drafts).toEqual(['Grace']);
    node.set('');
    fixture.detectChanges();
    expect(node()).toBe('');
    expect(node.valid()).toBe(false);
    control.touch();
    expect(node()).toBe('');
    expect(fixture.componentInstance.commits).toEqual([]);
    expect(fixture.componentInstance.changes).toEqual([]);
    control.change('Lin');
    control.touch();
    expect(node()).toBe('Lin');
    expect(fixture.componentInstance.commits).toEqual(['Lin']);
    expect(fixture.componentInstance.changes).toEqual(['Lin']);
  });

  it('moves contributed errors on rebinding and restores the original field', () => {
    const { fixture, host, control, binding } = setup();
    const local = binding.node();
    control.issue.set('Invalid date');
    fixture.detectChanges();
    expect(local.$api.errors()[0]?.message).toBe('Invalid date');
    expect(control.state.invalid()).toBe(true);
    const root = form({ nested: form({ date: field<unknown>('Grace') }) });
    host.bound.set(root.nested.date);
    fixture.detectChanges();
    expect(binding.node()).toBe(root.nested.date);
    expect(root.nested.date()).toBe('Grace');
    expect(control.writeValue.mock.lastCall).toEqual(['Grace']);
    expect(host.changes).toEqual([]);
    expect(local.$api.errors()).toEqual([]);
    expect(root.invalid()).toBe(true);
    expect(root.nested.invalid()).toBe(true);
    host.bound.set(local);
    fixture.detectChanges();
    expect(binding.node()).toBe(local);
    expect(local()).toBe('Ada');
    expect(control.writeValue.mock.lastCall).toEqual(['Ada']);
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
    profile.set({ nested: { name: 'Ada' } });
    fixture.detectChanges();
    expect(profile()).toEqual({ nested: { name: 'Ada' } });
    expect(profile.valid()).toBe(true);
    expect(profile.pristine()).toBe(true);
    expect(changed).toHaveBeenCalledTimes(1);
    profile.set({ nested: { name: '' } });
    fixture.detectChanges();
    expect(profile.invalid()).toBe(true);
    expect(profile.nested.invalid()).toBe(true);
    expect(profile.nested.name.invalid()).toBe(true);
    expect(changed).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.commits).toEqual([]);
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('ignores deferred output from a node replaced by another field', () => {
    const fixture = TestBed.createComponent(Host);
    const node = field.strict('Ada', { debounce: 'blur' });
    fixture.componentInstance.bound.set(node);
    fixture.detectChanges();
    const control = fixture.debugElement.query(By.directive(StandaloneCva)).componentInstance as StandaloneCva;
    control.change('Grace');
    fixture.componentInstance.bound.set(field('Ada'));
    fixture.detectChanges();
    node.flush();
    expect(node()).toBe('Grace');
    expect(fixture.componentInstance.commits).toEqual([]);
    expect(fixture.componentInstance.changes).toEqual([]);
    expect(control.writeValue.mock.lastCall).toEqual(['Ada']);
    control.change('Lin');
    expect(fixture.componentInstance.commits).toEqual(['Lin']);
    expect(fixture.componentInstance.changes).toEqual(['Lin']);
  });

  it('binds an independent field without registering it in an ancestor form', () => {
    @Component({
      template: `<form [formNode]="profile"><input [formNode]="name" (formNodeChange)="commits.push($event)" /></form>`,
      imports: [FormNodeDirective],
    })
    class NativeHost {
      profile = form({ age: field(42) });

      name = field('Ada');

      commits: string[] = [];
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
    expect(fixture.componentInstance.commits).toEqual(['Grace']);
  });

  it('binds a model-based custom control to an explicit field', () => {
    @Component({ selector: 'standalone-model', template: '' })
    class ModelControl {
      value = model('');

      state = useFormNodeState();
    }
    registerSignalModelForJit(ModelControl, 'value');
    @Component({
      template: `<standalone-model [formNode]="name" />`,
      imports: [FormNodeDirective, ModelControl],
    })
    class ModelHost {
      name = field('Ada');
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

describe('formNodeChange', () => {
  it.each(['field', 'form'] as const)('shares committed events and cleanup for a %s source', (kind) => {
    const fixture = TestBed.createComponent(Host);
    const leaf = field('Ada', [required], { debounce: 'blur' });
    const node = kind === 'field' ? leaf : form({ nested: form({ name: leaf }) }, { debounce: 'blur' });
    const value = (name: string) => kind === 'field' ? name : { nested: { name } };
    fixture.componentInstance.bound.set(node);
    fixture.detectChanges();
    const element = fixture.debugElement.query(By.directive(StandaloneCva));
    const control = element.componentInstance as StandaloneCva;
    const binding = element.injector.get(FormNodeDirective);
    const snapshots: unknown[] = [];
    const subscription = binding.formNodeChange.subscribe((next) => {
      snapshots.push({ value: next, current: node(), invalid: node.invalid(), dirty: node.dirty() });
    });
    control.change(value(''));
    expect(fixture.componentInstance.changes).toEqual([]);
    expect(node()).toEqual(value('Ada'));
    control.touch();
    expect(snapshots).toEqual([{ value: value(''), current: value(''), invalid: true, dirty: true }]);
    expect(fixture.componentInstance.changes).toEqual([value('')]);
    expect(fixture.componentInstance.commits).toEqual([value('')]);
    subscription.unsubscribe();
    control.change(value('Grace'));
    control.touch();
    expect(node.valid()).toBe(true);
    expect(snapshots).toHaveLength(1);
    expect(fixture.componentInstance.changes).toEqual([value(''), value('Grace')]);
    expect(fixture.componentInstance.commits).toEqual([value(''), value('Grace')]);
    fixture.destroy();
    control.change(value('after destruction'));
    expect(node()).toEqual(value('Grace'));
  });

  it('keeps the event snapshot when a listener writes a newer value', () => {
    const { control, binding, host } = setup();
    const node = binding.node();
    const seen: unknown[] = [];
    binding.formNodeChange.subscribe(() => node.$api.set('newer'));
    binding.formNodeValueChange.subscribe(value => seen.push(value));
    control.change('Grace');
    expect(node()).toBe('newer');
    expect(host.changes).toEqual(['Grace']);
    expect(host.commits).toEqual(['Grace']);
    expect(seen).toEqual(['Grace']);
  });

  it('rejects accidental two-way node binding before modifying the form', () => {
    @Component({
      template: '<input [(formNode)]="form.username" />',
      imports: [FormNodeDirective],
    })
    class InvalidHost {
      form = form({ username: field('Ada', [required]) });
    }
    const fixture = TestBed.createComponent(InvalidHost);
    const formNode = fixture.componentInstance.form;
    const username = formNode.username;
    expect(() => fixture.detectChanges()).toThrow('Use [formNode] to bind a node, not [(formNode)]');
    expect(formNode.username).toBe(username);
    expect(formNode()).toEqual({ username: 'Ada' });
    expect(formNode.pristine()).toBe(true);
    expect(formNode.untouched()).toBe(true);
    expect(formNode.valid()).toBe(true);
  });
});
