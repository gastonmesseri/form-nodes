import { expect, it } from 'vitest';
import type { ComponentFixture } from '@angular/core/testing';
import type { AbstractControl } from '@angular/forms';

import type { BoundControlSource } from '../../src/lib/core/bound-control-hook/bound-control';
import type { BoundControlAdapter } from '../../src/lib/core/bound-control-hook/bound-control-adapter';

export type AbstractControlContractFixture = {
  control: AbstractControl<string>;
  fixture: ComponentFixture<unknown>;
  state: BoundControlAdapter<string>;
};

export const runAbstractControlAdapterContract = (source: BoundControlSource, create: () => Promise<AbstractControlContractFixture>) => {
  it(`connects to a same-host ${source} directive`, async () => {
    const { state } = await create();
    expect(state.source).toBe(source);
    expect(state.connected()).toBe(true);
  });

  it('tracks value changes', async () => {
    const { control, state } = await create();
    expect(state.value()).toBe('');
    control.setValue('Marco');
    expect(state.value()).toBe('Marco');
  });

  it('tracks disabled changes', async () => {
    const { control, state } = await create();
    expect(state.disabled()).toBe(false);
    control.disable();
    expect(state.disabled()).toBe(true);
    control.enable();
    expect(state.disabled()).toBe(false);
  });

  it('tracks dirty changes', async () => {
    const { control, state } = await create();
    expect(state.dirty()).toBe(false);
    control.markAsDirty();
    expect(state.dirty()).toBe(true);
    control.markAsPristine();
    expect(state.dirty()).toBe(false);
  });

  it('tracks and normalizes error changes', async () => {
    const { control, state } = await create();
    expect(state.errors()).toEqual([]);
    control.setErrors({ object: { reason: 'taken' }, flag: true, primitive: 'reason' });
    expect(state.errors()).toEqual([
      { kind: 'object', reason: 'taken' },
      { kind: 'flag' },
      { kind: 'primitive', value: 'reason' },
    ]);
    control.setErrors(null);
    expect(state.errors()).toEqual([]);
  });

  it('tracks invalid changes', async () => {
    const { control, state } = await create();
    expect(state.invalid()).toBe(false);
    control.setErrors({ custom: true });
    expect(state.invalid()).toBe(true);
    control.setErrors(null);
    expect(state.invalid()).toBe(false);
  });

  it('tracks pending changes', async () => {
    const { control, state } = await create();
    expect(state.pending()).toBe(false);
    control.markAsPending();
    expect(state.pending()).toBe(true);
    control.updateValueAndValidity();
    expect(state.pending()).toBe(false);
  });

  it('tracks touched changes', async () => {
    const { control, state } = await create();
    expect(state.touched()).toBe(false);
    control.markAsTouched();
    expect(state.touched()).toBe(true);
    control.markAsUntouched();
    expect(state.touched()).toBe(false);
  });

  it('marks the control as touched', async () => {
    const { control, state } = await create();
    expect(control.touched).toBe(false);
    state.markAsTouched();
    expect(control.touched).toBe(true);
    expect(state.touched()).toBe(true);
  });

  it('provides neutral values for state unavailable from AbstractControl', async () => {
    const { state } = await create();
    expect(state.disabledReasons()).toEqual([]);
    expect(state.hidden()).toBe(false);
    expect(state.max()).toBeUndefined();
    expect(state.maxLength()).toBeUndefined();
    expect(state.min()).toBeUndefined();
    expect(state.minLength()).toBeUndefined();
    expect(state.name()).toBeUndefined();
    expect(state.pattern()).toEqual([]);
    expect(state.readonly()).toBe(false);
    expect(state.required()).toBe(false);
  });

  it('disconnects when its component is destroyed', async () => {
    const { fixture, state } = await create();
    expect(state.connected()).toBe(true);
    fixture.destroy();
    expect(state.connected()).toBe(false);
  });
};
