import { effect } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expect, it } from 'vitest';
import type { ComponentFixture } from '@angular/core/testing';
import type { AbstractControl } from '@angular/forms';

import type { ControlStateSource } from '../../src/lib/core/control-state-hook/control-state';
import type { ControlStateAdapter } from '../../src/lib/core/control-state-hook/control-state-adapter';

export type AbstractControlContractFixture = {
  control: AbstractControl<string>;
  fixture: ComponentFixture<unknown>;
  state: ControlStateAdapter<string>;
};

export const runAbstractControlAdapterContract = (
  source: ControlStateSource,
  create: () => Promise<AbstractControlContractFixture>,
  expectedName?: string,
) => {
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

  it('reconciles silent AbstractControl changes after rendering', async () => {
    const { control, fixture, state } = await create();
    control.setValue('Silent', { emitEvent: false });
    control.markAsDirty({ emitEvent: false });
    control.markAsTouched({ emitEvent: false });
    control.setErrors({ silent: true }, { emitEvent: false });

    fixture.detectChanges();

    expect(state.value()).toBe('Silent');
    expect(state.dirty()).toBe(true);
    expect(state.touched()).toBe(true);
    expect(state.invalid()).toBe(true);
    expect(state.errors()).toEqual([{ kind: 'silent' }]);
  });

  it('notifies effects when tracked AbstractControl state changes', async () => {
    const { control, state } = await create();
    const observations: string[] = [];
    const effectRef = TestBed.runInInjectionContext(() => effect(() => {
      observations.push(`${state.value()}:${state.disabled()}:${state.dirty()}:${state.pending()}:${state.touched()}:${state.errors().length}`);
    }));
    TestBed.flushEffects();

    control.setValue('Marco');
    control.markAsDirty();
    control.markAsPending();
    control.markAsTouched();
    control.setErrors({ custom: true });
    TestBed.flushEffects();

    expect(observations.at(-1)).toBe('Marco:false:true:false:true:1');

    control.disable();
    TestBed.flushEffects();

    expect(observations.at(-1)).toBe('Marco:true:true:false:true:0');
    effectRef.destroy();
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
    expect(state.name()).toBe(expectedName);
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
