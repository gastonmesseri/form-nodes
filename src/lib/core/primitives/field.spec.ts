import { signal, type Signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { field } from './field';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';

type Context<TValue> = { readonly value: Signal<TValue> };

describe('field', () => {
  it('exposes an empty path when it is a root node', () => {
    const name = field('David');

    expect(name.api.path()).toEqual([]);
    expect(name.api.parent()).toBeNull();
    expect(name.api.form()).toBeNull();
  });

  it('exposes the initial value when called and through value()', () => {
    const fieldNode = field('David');
    expect(fieldNode()).toBe('David');
    expect(fieldNode.value()).toBe('David');
  });

  it('starts as null when no initial value is given', () => {
    const fieldNode = field<string>();
    expect(fieldNode()).toBeNull();
  });

  it('accepts an explicit null initial value', () => {
    const fieldNode = field<string>(null, []);
    expect(fieldNode()).toBeNull();
    fieldNode.set('David');
    expect(fieldNode()).toBe('David');
    fieldNode.set(null);
    expect(fieldNode()).toBeNull();
  });

  it('keeps a non-null initial value when nullable is false', () => {
    const fieldNode = field('David', { nullable: false });
    expect(fieldNode()).toBe('David');
    fieldNode.reset();
    expect(fieldNode()).toBe('David');
  });

  it('updates the value through set', () => {
    const fieldNode = field(23);
    fieldNode.set(30);
    expect(fieldNode()).toBe(30);
    expect(fieldNode.value()).toBe(30);
  });

  it('is valid with an empty error array when it has no validators', () => {
    const fieldNode = field('David');
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.valid()).toBe(true);
    expect(fieldNode.invalid()).toBe(false);
  });

  it('passes a stable reactive value context to validators', () => {
    const contexts: Context<string | null>[] = [];
    const validator = (context: Context<string | null>) => {
      contexts.push(context);
      return context.value() === '' ? { kind: 'required' } : null;
    };
    const fieldNode = field('', [validator]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    fieldNode.set('David');
    expect(fieldNode.errors()).toEqual([]);
    expect(contexts).toHaveLength(2);
    expect(contexts[0]).toBe(contexts[1]);
    expect(contexts[0]!.value()).toBe('David');
  });

  it('exposes the complete field api to synchronous validators', () => {
    let validatorApi: unknown;
    let validatorField: unknown;
    let disabled: unknown;
    const fieldNode = field('David', [context => {
      validatorApi = context.api;
      validatorField = context.field;
      disabled = context.disabled;
      return null;
    }]);

    expect(fieldNode.errors()).toEqual([]);
    expect(validatorApi).toBe(fieldNode.api);
    expect(validatorField).toBe(fieldNode);
    expect(disabled).toBe(fieldNode.disabled);
    expect(fieldNode.api.path()).toEqual([]);
    expect(fieldNode.api.parent()).toBeNull();
    expect(fieldNode.api.form()).toBeNull();
  });

  it('reports the error of a failing validator', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    expect(fieldNode.valid()).toBe(false);
    expect(fieldNode.invalid()).toBe(true);
  });

  it('derives validationStatus from synchronous validation', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);

    expect(fieldNode.validationStatus()).toBe('invalid');
    expect(fieldNode.valid()).toBe(false);
    expect(fieldNode.invalid()).toBe(true);

    fieldNode.set('David');

    expect(fieldNode.validationStatus()).toBe('valid');
    expect(fieldNode.valid()).toBe(true);
    expect(fieldNode.invalid()).toBe(false);
  });

  it('runs an asynchronous validator and exposes its validation state', async () => {
    const fieldNode = field('David', [
      asyncValidator(async ({ value }) => value() === 'David' ? { kind: 'nameTaken' } : null),
    ]);

    expect(fieldNode.pending()).toBe(true);
    expect(fieldNode.validationStatus()).toBe('unknown');

    await Promise.resolve();
    await Promise.resolve();

    expect(fieldNode.pending()).toBe(false);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'nameTaken' }]);
    expect(fieldNode.validationStatus()).toBe('invalid');
  });

  it('reruns an asynchronous validator when a signal read by it changes', async () => {
    const available = signal(true);
    const validate = vi.fn(async ({ value }: Context<string | null>) =>
      available() || value() === null ? null : { kind: 'unavailable' },
    );
    const fieldNode = field('David', [asyncValidator(validate)]);

    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(fieldNode.errors()).toEqual([]);

    available.set(false);
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledTimes(2);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'unavailable' }]);
  });

  it('restarts debounced asynchronous validation when its value changes', async () => {
    vi.useFakeTimers();
    const validate = vi.fn(async ({ value }: Context<string | null>) =>
      value() === 'David' ? { kind: 'nameTaken' } : null,
    );
    const fieldNode = field('Daniel', [asyncValidator(validate, { debounce: 100 })]);

    await Promise.resolve();
    fieldNode.set('David');
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(100);

    expect(validate).toHaveBeenCalledTimes(2);
    expect(fieldNode.pending()).toBe(false);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'nameTaken' }]);
    vi.useRealTimers();
  });

  it('passes an explicit reactive params snapshot to an asynchronous validator', async () => {
    const country = signal('Switzerland');
    const validate = vi.fn(async ({ params }: { params: { country: string; name: string | null } }) =>
      params.country === 'Switzerland' && params.name === 'David' ? { kind: 'nameTaken' } : null,
    );
    const fieldNode = field('David', [asyncValidator({
      params: ({ value }) => ({ country: country(), name: value() }),
      validate,
    })]);

    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledWith(expect.objectContaining({
      params: { country: 'Switzerland', name: 'David' },
    }));
    expect(fieldNode.errors()).toMatchObject([{ kind: 'nameTaken' }]);
  });

  it('only reruns a parameterized asynchronous validator when its shallow params change', async () => {
    const person = signal({ firstName: 'David', lastName: 'Smith' });
    const validate = vi.fn(async () => null);
    field('profile', [asyncValidator({
      params: () => ({ username: person().firstName }),
      validate,
    })]);

    await Promise.resolve();
    await Promise.resolve();
    person.set({ firstName: 'David', lastName: 'Jones' });
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();

    person.set({ firstName: 'Daniel', lastName: 'Jones' });
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('reactively includes or excludes an asynchronous validator through when', async () => {
    const enabled = signal(false);
    const validate = vi.fn(async () => ({ kind: 'nameTaken' }));
    const fieldNode = field('David', [asyncValidator(validate, {
      when: () => enabled(),
    })]);

    expect(fieldNode.valid()).toBe(true);
    expect(validate).not.toHaveBeenCalled();

    enabled.set(true);
    await Promise.resolve();
    expect(fieldNode.pending()).toBe(true);
    await Promise.resolve();
    expect(fieldNode.errors()).toMatchObject([{ kind: 'nameTaken' }]);

    enabled.set(false);
    await Promise.resolve();
    expect(fieldNode.pending()).toBe(false);
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.valid()).toBe(true);
  });

  it('exposes its interaction and availability state to an asynchronous validator', async () => {
    const states: Array<{ dirty: boolean; disabled: boolean; hidden: boolean; readonly: boolean; touched: boolean }> = [];
    const fieldNode = field('David', [asyncValidator(async ({ api }) => {
      states.push({
        dirty: api.dirty(),
        disabled: api.disabled(),
        hidden: api.hidden(),
        readonly: api.readonly(),
        touched: api.touched(),
      });
      return null;
    })]);

    await Promise.resolve();
    await Promise.resolve();
    fieldNode.markAsDirty();
    fieldNode.markAsTouched();
    await Promise.resolve();
    await Promise.resolve();

    expect(states).toEqual([
      { dirty: false, disabled: false, hidden: false, readonly: false, touched: false },
      { dirty: true, disabled: false, hidden: false, readonly: false, touched: true },
    ]);
  });

  it('collects the errors of several validators in order', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const minLength = ({ value }: Context<string | null>) =>
      value() !== null && value()!.length < 3
        ? { kind: 'minLength', minLength: 3, actualLength: value()!.length }
        : null;
    const fieldNode = field('', [required, minLength]);
    expect(fieldNode.errors()).toMatchObject([
      { kind: 'required' },
      { kind: 'minLength', minLength: 3, actualLength: 0 },
    ]);
    expect(fieldNode.errors().every((error) => error.targetNode === fieldNode)).toBe(true);
  });

  it('leaves out the keys of validators that pass', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const minLength = ({ value }: Context<string | null>) =>
      value() !== null && value()!.length < 3 ? { kind: 'minLength' } : null;
    const fieldNode = field('ab', [required, minLength]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'minLength' }]);
  });

  it('recomputes errors when the value changes', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.valid()).toBe(false);
    fieldNode.set('David');
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.valid()).toBe(true);
  });

  it('reacts to external signals read by a synchronous validator', () => {
    const blocked = signal(false);
    const validate = vi.fn(() => blocked() ? { kind: 'blocked' } : null);
    const fieldNode = field('David', [validate]);

    expect(fieldNode.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledOnce();

    blocked.set(true);

    expect(fieldNode.errors()).toMatchObject([{ kind: 'blocked' }]);
    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('conditionally applies a synchronous validator returned by another validator', () => {
    const otherAge = signal(23);
    const validate = vi.fn(() => otherAge() > 30 ? required : null);
    const name = field('', [validate]);

    expect(name.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledOnce();

    otherAge.set(31);

    expect(name.errors()).toMatchObject([{ kind: 'required' }]);
    expect(validate).toHaveBeenCalledTimes(2);

    otherAge.set(30);

    expect(name.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledTimes(3);
  });

  it('accepts one validator and normalizes it through validators()', () => {
    const fieldNode = field('', required);

    expect(fieldNode.validators()).toEqual([required]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);

    fieldNode.setValidators(() => ({ kind: 'replacement' }));

    expect(fieldNode.validators()).toHaveLength(1);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'replacement' }]);
  });

  it('filters empty entries from the configured validator array', () => {
    const fieldNode = field('', [required, null, undefined]);

    expect(fieldNode.validators()).toEqual([required]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
  });

  it('conditionally applies an array of synchronous validators returned by one validator', () => {
    const enabled = signal(false);
    const tooShort = ({ value }: Context<string | null>) => value() === 'a' ? { kind: 'tooShort' } : null;
    const name = field('', { validators: () => enabled() ? [required, tooShort] : null });

    expect(name.errors()).toEqual([]);

    enabled.set(true);
    expect(name.errors()).toMatchObject([{ kind: 'required' }]);

    name.set('a');
    expect(name.errors()).toMatchObject([{ kind: 'tooShort' }]);

    enabled.set(false);
    expect(name.errors()).toEqual([]);
  });

  it('filters empty entries from a returned validator array', () => {
    const fieldNode = field('', () => [required, null, undefined]);

    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
  });

  it('exposes the current validators through validators()', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.validators()).toEqual([required]);
  });

  it('recomputes errors after setValidators', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.valid()).toBe(false);
    fieldNode.setValidators([]);
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.valid()).toBe(true);
  });

  it('adds validators to a field declared without them', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('');
    expect(fieldNode.valid()).toBe(true);
    fieldNode.setValidators([required]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    expect(fieldNode.valid()).toBe(false);
  });

  it('applies a newly set validator to the current value', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('David', [required]);
    expect(fieldNode.valid()).toBe(true);
    fieldNode.setValidators([({ value }: Context<string | null>) => (value() === 'David' ? { kind: 'required' } : null)]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
  });

  it('accepts validators and state in a second-argument options object', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', {
      validators: [required],
      disabled: true,
    });
    expect(fieldNode.validators()).toEqual([required]);
    expect(fieldNode.disabled()).toBe(true);
    expect(fieldNode.errors()).toEqual([]);
    fieldNode.enable();
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
  });

  it('accepts second-argument options without validators', () => {
    const fieldNode = field('David', { readonly: true });
    expect(fieldNode.validators()).toEqual([]);
    expect(fieldNode.readonly()).toBe(true);
  });

  it('exposes the same state through the root and through api', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.api.value()).toBe(fieldNode.value());
    expect(fieldNode.api.valid()).toBe(fieldNode.valid());
    expect(fieldNode.api.errors()).toEqual(fieldNode.errors());
    fieldNode.api.set('David');
    expect(fieldNode()).toBe('David');
    expect(fieldNode.dirty()).toBe(true);
  });

  it('patches like it sets, through api', () => {
    const fieldNode = field('David');
    fieldNode.api.patch('Ana');
    expect(fieldNode()).toBe('Ana');
    expect(fieldNode.dirty()).toBe(true);
  });

  it('starts untouched', () => {
    const fieldNode = field('David');
    expect(fieldNode.touched()).toBe(false);
    expect(fieldNode.untouched()).toBe(true);
  });

  it('becomes touched through markAsTouched', () => {
    const fieldNode = field('David');
    fieldNode.markAsTouched();
    expect(fieldNode.touched()).toBe(true);
    expect(fieldNode.untouched()).toBe(false);
  });

  it('goes back to untouched through markAsUntouched', () => {
    const fieldNode = field('David');
    fieldNode.markAsTouched();
    fieldNode.markAsUntouched();
    expect(fieldNode.touched()).toBe(false);
    expect(fieldNode.untouched()).toBe(true);
  });

  it('stays untouched when the value changes', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    expect(fieldNode.touched()).toBe(false);
  });

  it('keeps touched independent from validity', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.valid()).toBe(false);
    expect(fieldNode.touched()).toBe(false);
  });

  it('starts pristine', () => {
    const fieldNode = field('David');
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.pristine()).toBe(true);
  });

  it('becomes dirty when the value is set', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    expect(fieldNode.dirty()).toBe(true);
    expect(fieldNode.pristine()).toBe(false);
  });

  it('becomes dirty even when set to the same value', () => {
    const fieldNode = field('David');
    fieldNode.set('David');
    expect(fieldNode.dirty()).toBe(true);
  });

  it('becomes dirty through markAsDirty', () => {
    const fieldNode = field('David');
    fieldNode.markAsDirty();
    expect(fieldNode.dirty()).toBe(true);
    expect(fieldNode.pristine()).toBe(false);
  });

  it('goes back to pristine through markAsPristine', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    fieldNode.markAsPristine();
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.pristine()).toBe(true);
  });

  it('keeps the value after markAsPristine', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    fieldNode.markAsPristine();
    expect(fieldNode()).toBe('Ana');
  });

  it('keeps dirty and touched independent', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    expect(fieldNode.dirty()).toBe(true);
    expect(fieldNode.touched()).toBe(false);
    fieldNode.markAsPristine();
    fieldNode.markAsTouched();
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.touched()).toBe(true);
  });

  it('starts visible and can be hidden and shown', () => {
    const fieldNode = field('David');
    expect(fieldNode.hidden()).toBe(false);
    expect(fieldNode.visible()).toBe(true);
    fieldNode.hide();
    expect(fieldNode.hidden()).toBe(true);
    expect(fieldNode.visible()).toBe(false);
    fieldNode.show();
    expect(fieldNode.hidden()).toBe(false);
    expect(fieldNode.visible()).toBe(true);
  });

  it('can start hidden through options', () => {
    const fieldNode = field('David', undefined, { hidden: true });
    expect(fieldNode.hidden()).toBe(true);
    expect(fieldNode.visible()).toBe(false);
  });

  it('skips validation while hidden', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.valid()).toBe(false);
    fieldNode.hide();
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.valid()).toBe(true);
    fieldNode.show();
    expect(fieldNode.valid()).toBe(false);
  });

  it('hides interaction state and restores it when shown', () => {
    const fieldNode = field('David');
    fieldNode.markAsTouched();
    fieldNode.markAsDirty();
    fieldNode.hide();
    expect(fieldNode.touched()).toBe(false);
    expect(fieldNode.dirty()).toBe(false);
    fieldNode.show();
    expect(fieldNode.touched()).toBe(true);
    expect(fieldNode.dirty()).toBe(true);
  });

  it('does not become touched while hidden', () => {
    const fieldNode = field('David', undefined, { hidden: true });
    fieldNode.markAsTouched();
    fieldNode.show();
    expect(fieldNode.touched()).toBe(false);
  });

  it('reacts to signal state sources', () => {
    const disabled = signal(false);
    const readonly = signal(false);
    const hidden = signal(false);
    const fieldNode = field('David', undefined, { disabled, readonly, hidden });
    disabled.set(true);
    expect(fieldNode.disabled()).toBe(true);
    disabled.set(false);
    readonly.set(true);
    expect(fieldNode.readonly()).toBe(true);
    readonly.set(false);
    hidden.set(true);
    expect(fieldNode.hidden()).toBe(true);
  });

  it('tracks signals read by state source functions', () => {
    const age = signal(17);
    const fieldNode = field('', undefined, { hidden: () => age() >= 18 });
    expect(fieldNode.hidden()).toBe(false);
    age.set(18);
    expect(fieldNode.hidden()).toBe(true);
  });

  it('does not let actions override an active reactive source', () => {
    const locked = signal(true);
    const fieldNode = field('David', undefined, {
      disabled: locked,
      readonly: locked,
      hidden: locked,
    });
    fieldNode.enable();
    fieldNode.markAsWritable();
    fieldNode.show();
    expect(fieldNode.disabled()).toBe(true);
    expect(fieldNode.readonly()).toBe(true);
    expect(fieldNode.hidden()).toBe(true);
    locked.set(false);
    expect(fieldNode.disabled()).toBe(false);
    expect(fieldNode.readonly()).toBe(false);
    expect(fieldNode.hidden()).toBe(false);
  });

  it('stays pristine when only the validators change', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('David');
    fieldNode.setValidators([required]);
    expect(fieldNode.dirty()).toBe(false);
  });

  it('keeps the value on reset with no argument', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    fieldNode.reset();
    expect(fieldNode()).toBe('Ana');
  });

  it('clears dirty and touched on reset', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    fieldNode.markAsTouched();
    fieldNode.reset();
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.pristine()).toBe(true);
    expect(fieldNode.touched()).toBe(false);
    expect(fieldNode.untouched()).toBe(true);
  });

  it('assigns the value passed to reset', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    fieldNode.reset('Leo');
    expect(fieldNode()).toBe('Leo');
  });

  it('stays pristine and untouched after reset with a value', () => {
    const fieldNode = field('David');
    fieldNode.set('Ana');
    fieldNode.markAsTouched();
    fieldNode.reset('Leo');
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.touched()).toBe(false);
  });

  it('resets to an empty string', () => {
    const fieldNode = field('David');
    fieldNode.reset('');
    expect(fieldNode()).toBe('');
  });

  it('resets to zero', () => {
    const fieldNode = field(23);
    fieldNode.reset(0);
    expect(fieldNode()).toBe(0);
  });

  it('revalidates after reset with a value', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('David', [required]);
    expect(fieldNode.valid()).toBe(true);
    fieldNode.reset('');
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    expect(fieldNode.valid()).toBe(false);
  });

  it('keeps the validators after reset', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    fieldNode.reset('David');
    expect(fieldNode.validators()).toEqual([required]);
    expect(fieldNode.valid()).toBe(true);
  });

  it('starts enabled', () => {
    const fieldNode = field('David');
    expect(fieldNode.disabled()).toBe(false);
    expect(fieldNode.enabled()).toBe(true);
  });

  it('can start disabled through options', () => {
    const fieldNode = field('David', undefined, { disabled: true });
    expect(fieldNode.disabled()).toBe(true);
    expect(fieldNode.enabled()).toBe(false);
  });

  it('toggles between disable and enable', () => {
    const fieldNode = field('David');
    fieldNode.disable();
    expect(fieldNode.disabled()).toBe(true);
    expect(fieldNode.enabled()).toBe(false);
    fieldNode.enable();
    expect(fieldNode.disabled()).toBe(false);
    expect(fieldNode.enabled()).toBe(true);
  });

  it('keeps its value when disabled', () => {
    const fieldNode = field('David');
    fieldNode.disable();
    expect(fieldNode()).toBe('David');
    expect(fieldNode.value()).toBe('David');
  });

  it('still writes the value when disabled', () => {
    const fieldNode = field('David');
    fieldNode.disable();
    fieldNode.set('Ana');
    expect(fieldNode()).toBe('Ana');
  });

  it('hides dirty state while disabled and restores it when enabled', () => {
    const fieldNode = field('David');
    fieldNode.disable();
    fieldNode.set('Ana');
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.pristine()).toBe(true);
    fieldNode.markAsPristine();
    fieldNode.markAsDirty();
    expect(fieldNode.dirty()).toBe(false);
    fieldNode.enable();
    expect(fieldNode.dirty()).toBe(true);
  });

  it('hides touched state while disabled and restores it when enabled', () => {
    const fieldNode = field('David');
    fieldNode.markAsTouched();
    fieldNode.disable();
    expect(fieldNode.touched()).toBe(false);
    expect(fieldNode.untouched()).toBe(true);
    fieldNode.enable();
    expect(fieldNode.touched()).toBe(true);
  });

  it('does not become touched while disabled', () => {
    const fieldNode = field('David');
    fieldNode.disable();
    fieldNode.markAsTouched();
    expect(fieldNode.touched()).toBe(false);
  });

  it('becomes touched again once enabled', () => {
    const fieldNode = field('David');
    fieldNode.disable();
    fieldNode.markAsTouched();
    fieldNode.enable();
    fieldNode.markAsTouched();
    expect(fieldNode.touched()).toBe(true);
  });

  it('skips validation while disabled', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    fieldNode.disable();
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.valid()).toBe(true);
    expect(fieldNode.invalid()).toBe(false);
  });

  it('validates again once enabled', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    fieldNode.disable();
    fieldNode.enable();
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    expect(fieldNode.valid()).toBe(false);
  });

  it('keeps its validators while disabled', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required]);
    fieldNode.disable();
    expect(fieldNode.validators()).toEqual([required]);
  });

  it('starts writable', () => {
    const fieldNode = field('David');
    expect(fieldNode.readonly()).toBe(false);
    expect(fieldNode.writable()).toBe(true);
  });

  it('can start readonly through options', () => {
    const fieldNode = field('David', undefined, { readonly: true });
    expect(fieldNode.readonly()).toBe(true);
    expect(fieldNode.writable()).toBe(false);
  });

  it('toggles between readonly and writable', () => {
    const fieldNode = field('David');
    fieldNode.markAsReadonly();
    expect(fieldNode.readonly()).toBe(true);
    fieldNode.markAsWritable();
    expect(fieldNode.readonly()).toBe(false);
  });

  it('preserves its value and underlying dirty state while readonly', () => {
    const fieldNode = field('David', undefined, { readonly: true });
    fieldNode.set('Ana');
    expect(fieldNode()).toBe('Ana');
    expect(fieldNode.dirty()).toBe(false);
    expect(fieldNode.pristine()).toBe(true);
    fieldNode.markAsWritable();
    expect(fieldNode.dirty()).toBe(true);
  });

  it('does not become touched while readonly', () => {
    const fieldNode = field('David', undefined, { readonly: true });
    fieldNode.markAsTouched();
    expect(fieldNode.touched()).toBe(false);
    fieldNode.markAsWritable();
    expect(fieldNode.touched()).toBe(false);
  });

  it('hides touched state while readonly and restores it when writable', () => {
    const fieldNode = field('David');
    fieldNode.markAsTouched();
    fieldNode.markAsReadonly();
    expect(fieldNode.touched()).toBe(false);
    fieldNode.markAsWritable();
    expect(fieldNode.touched()).toBe(true);
  });

  it('skips validation while readonly and validates again when writable', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const fieldNode = field('', [required], { readonly: true });
    expect(fieldNode.errors()).toEqual([]);
    expect(fieldNode.valid()).toBe(true);
    fieldNode.markAsWritable();
    expect(fieldNode.errors()).toMatchObject([{ kind: 'required' }]);
    expect(fieldNode.valid()).toBe(false);
  });
});
