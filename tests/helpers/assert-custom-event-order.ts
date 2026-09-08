import { expect } from 'vitest';
import { By } from '@angular/platform-browser';
import type { ComponentFixture } from '@angular/core/testing';

import type { CustomEventOrderHost, DirectBindingHost, DirectBindingControl, DirectDirectiveControl, DirectPairControl, OrderedValueControl, OrderedCheckboxControl, OrderedPairControl } from '../integration/custom-event-order.fixture';

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
  aggregate.selection.set({ name: '' });
  expect(host.observations.at(-1)).toMatchObject({ value: { name: '' }, parent: { aggregate: { name: '' } }, dirty: true, valid: false });
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
