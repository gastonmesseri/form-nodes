import { expect, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import type { ComponentFixture } from '@angular/core/testing';

import type { CustomEventLifecycleHost, OrderedCva, OrderedWrapper, ExplicitOrderedWrapper, ConstructionOutputControl, CustomEventOrderHost, DirectBindingHost, DirectBindingControl, DirectDirectiveControl, DirectPairControl, OrderedValueControl, OrderedCheckboxControl, OrderedPairControl } from '../integration/custom-event-order.fixture';

/** Exercises the same public event contract under JIT and production AOT. */
export const assertCustomEventOrder = (fixture: ComponentFixture<CustomEventOrderHost>) => {
  fixture.detectChanges();
  const host = fixture.componentInstance;
  host.observations = [];
  const value = fixture.debugElement.query(By.css('#value')).componentInstance as OrderedValueControl;
  const checked = fixture.debugElement.query(By.css('ordered-check')).componentInstance as OrderedCheckboxControl;
  const paired = fixture.debugElement.query(By.css('ordered-pair')).componentInstance as OrderedPairControl;
  const deferred = fixture.debugElement.query(By.css('#deferred')).componentInstance as OrderedValueControl;
  const aggregate = fixture.debugElement.query(By.css('#aggregate')).componentInstance as OrderedValueControl;
  value.selection.set('updated');
  expect(host.observations.at(-1)).toMatchObject({ eventValue: 'updated', value: 'updated', parent: { value: 'updated' }, dirty: true, valid: true, parentValid: true });
  value.selection.set('');
  expect(host.observations.at(-1)).toMatchObject({ value: '', valid: false, parentValid: false });
  value.touch.emit();
  expect(host.observations.at(-1)).toMatchObject({ touched: true });
  checked.checked.set(true);
  expect(host.observations.at(-1)).toMatchObject({ eventValue: true, value: true, parent: { checked: true }, dirty: true });
  checked.touch.emit();
  expect(host.observations.at(-1)).toMatchObject({ touched: true });
  paired.valueChange.emit('paired');
  expect(host.observations.at(-1)).toMatchObject({ value: 'paired', parent: { paired: 'paired' }, dirty: true });
  paired.touch.emit();
  expect(host.observations.at(-1)).toMatchObject({ touched: true });
  deferred.selection.set('pending');
  expect(host.observations.at(-1)).toMatchObject({ value: 'initial', controlValue: 'pending', dirty: true, touched: false });
  deferred.touch.emit();
  expect(host.observations.at(-1)).toMatchObject({ value: 'pending', parent: { deferred: 'pending' }, touched: true });
  value.selection.set('valid sibling');
  expect(host.profile.valid()).toBe(true);
  aggregate.selection.set({ name: '' });
  expect(host.observations.at(-1)).toMatchObject({ value: { name: '' }, parent: { aggregate: { name: '' } }, dirty: true, valid: false, parentValid: false });
  aggregate.selection.set({ name: 'valid again' });
  expect(host.observations.at(-1)).toMatchObject({ valid: true, parentValid: true });
  aggregate.touch.emit();
  expect(host.observations.at(-1)).toMatchObject({ touched: true });
  expect(host.profile.aggregate.name.touched()).toBe(true);
  host.afterEvent = () => host.profile.value.reset('reset');
  value.selection.set('consumer edit');
  expect(host.observations.at(-1)).toMatchObject({ value: 'consumer edit' });
  expect(host.profile.value()).toBe('reset');
  expect(host.profile.value.pristine()).toBe(true);
  delete host.afterEvent;
  const previous = host.profile;
  host.profile = new (host.constructor as typeof CustomEventOrderHost)().profile;
  fixture.changeDetectorRef.markForCheck();
  fixture.detectChanges();
  host.observations = [];
  value.selection.set('replacement');
  expect(host.observations).toHaveLength(1);
  expect(host.observations[0]).toMatchObject({ value: 'replacement', parent: { value: 'replacement' } });
  expect(previous.value()).toBe('reset');
  fixture.destroy();
  host.profile.reset();
  const snapshot = host.profile();
  host.observations = [];
  // Angular warns about emitting destroyed output() instances in development mode.
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    value.selection.set('after destruction');
    checked.checked.set(true);
    aggregate.selection.set({ name: 'after destruction' });
    paired.valueChange.emit('after destruction');
    for (const control of [value, checked, paired, deferred, aggregate]) control.touch.emit();
  } finally {
    warning.mockRestore();
  }
  expect(host.profile()).toEqual(snapshot);
  expect(host.profile.pristine()).toBe(true);
  expect(host.profile.untouched()).toBe(true);
  expect(host.observations).toEqual([]);
};

/** Confirms uniform timing even when custom constructors request their concrete binding. */
export const assertDirectBindingEventOrder = (fixture: ComponentFixture<DirectBindingHost>) => {
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const element = fixture.debugElement.query(By.css('direct-binding-control'));
  const control = element.componentInstance as DirectBindingControl;
  const checkbox = fixture.debugElement.query(By.css('direct-directive-control')).componentInstance as DirectDirectiveControl;
  const pair = fixture.debugElement.query(By.css('direct-pair-control')).componentInstance as DirectPairControl;
  expect(control.binding.node()).toBe(host.name);
  expect(checkbox.binding.node()).toBe(host.checked);
  expect(pair.binding.node()).toBe(host.paired);
  for (const element of fixture.nativeElement.children) {
    for (const name of ['valueChange', 'checkedChange', 'touch']) {
      element.dispatchEvent(new Event(name, { bubbles: true }));
    }
  }
  expect(host.name()).toBe('initial');
  expect(host.name.pristine()).toBe(true);
  expect(host.name.untouched()).toBe(true);
  expect(host.checked()).toBe(false);
  expect(host.checked.pristine()).toBe(true);
  expect(host.paired()).toBe('initial');
  expect(host.paired.pristine()).toBe(true);
  control.value.set('updated');
  expect(host.observed).toBe('updated');
  expect(host.name()).toBe('updated');
  control.touch.emit();
  expect(host.touched).toBe(true);
  checkbox.checked.set(true);
  expect(host.checkedObserved).toBe(true);
  checkbox.touch.emit();
  expect(host.checkedTouched).toBe(true);
  pair.valueChange.emit('paired');
  expect(host.pairedObserved).toBe('paired');
  pair.touch.emit();
  expect(host.pairedTouched).toBe(true);
  fixture.destroy();
};

/** Checks construction emissions, CVA callback ownership, and both pass-through modes. */
export const assertCustomEventLifecycle = (fixture: ComponentFixture<CustomEventLifecycleHost>) => {
  const host = fixture.componentInstance;
  fixture.detectChanges();
  expect(host.profile()).toEqual({ construction: 'initial', cva: 'initial', wrapper: 'initial', explicit: 'initial' });
  expect(host.profile.pristine()).toBe(true);
  expect(host.profile.untouched()).toBe(true);
  const construction = fixture.debugElement.query(By.css('construction-output-control')).componentInstance as ConstructionOutputControl;
  construction.value.set('initialized');
  construction.touch.emit();
  expect(host.profile.construction()).toBe('initialized');
  expect(host.profile.construction.dirty()).toBe(true);
  expect(host.profile.construction.touched()).toBe(true);

  const cva = fixture.debugElement.query(By.css('ordered-cva')).componentInstance as OrderedCva;
  host.values = [];
  host.touches = [];
  cva.value.set('before callback');
  expect(host.values).toEqual(['initial']);
  expect(host.profile.cva.pristine()).toBe(true);
  cva.onChange('after callback');
  cva.value.set('after callback');
  expect(host.values).toEqual(['initial', 'after callback']);
  expect(host.profile.cva.dirty()).toBe(true);
  cva.touch.emit();
  expect(host.touches).toEqual([false]);
  cva.onTouched();
  cva.touch.emit();
  expect(host.touches).toEqual([false, true]);

  const wrapper = fixture.debugElement.query(By.css('ordered-wrapper')).componentInstance as OrderedWrapper;
  const explicit = fixture.debugElement.query(By.css('explicit-ordered-wrapper')).componentInstance as ExplicitOrderedWrapper;
  for (const control of [wrapper, explicit]) {
    control.value.set('ignored');
    control.touch.emit();
  }
  for (const node of [host.profile.wrapper, host.profile.explicit]) {
    expect(node()).toBe('initial');
    expect(node.pristine()).toBe(true);
    expect(node.untouched()).toBe(true);
  }
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  input.value = 'delegated';
  input.dispatchEvent(new Event('input'));
  input.dispatchEvent(new Event('blur'));
  expect(host.profile.wrapper()).toBe('delegated');
  expect(host.profile.wrapper.dirty()).toBe(true);
  expect(host.profile.wrapper.touched()).toBe(true);
  expect(wrapper.value()).toBe('ignored');
  fixture.destroy();
};
