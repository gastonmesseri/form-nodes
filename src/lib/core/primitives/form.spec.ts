import { signal, type Signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { form } from './form';
import { field } from './field';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';

type Context<TValue> = { readonly value: Signal<TValue> };

describe('form', () => {
  it('exposes its public api directly on the form', () => {
    const profile = form({ age: field(23) });

    expect(profile.value).toBe(profile.api.value);
    expect(profile.disabled).toBe(profile.api.disabled);
    expect(profile.set).toBe(profile.api.set);
    expect(profile.patch).toBe(profile.api.patch);
    expect(profile.reset).toBe(profile.api.reset);

    profile.disable();
    expect(profile.disabled()).toBe(true);
    profile.enable();
    expect(profile.enabled()).toBe(true);
    profile.patch({ age: 30 });
    expect(profile()).toEqual({ age: 30 });
  });

  it('exposes a stable children map with the same node instances', () => {
    const profile = form({
      name: field('David'),
      address: { city: field('Zurich') },
    });

    expect(profile.children).toBe(profile.api.children);
    expect(profile.children.name).toBe(profile.name);
    expect(profile.children.address).toBe(profile.address);
    expect(profile.children.address.children.city).toBe(profile.address.city);
  });

  it('gives a child named children precedence while preserving api.children', () => {
    const childrenField = field('child');
    const profile = form({ children: childrenField, age: field(23) });

    expect(profile.children).toBe(childrenField);
    expect(profile.children()).toBe('child');
    expect(profile.api.children.children).toBe(childrenField);
    expect(profile.api.children.age).toBe(profile.age);
  });

  it('gives children precedence over native function members', () => {
    const controls = {
      apply: field('apply'),
      arguments: field('arguments'),
      bind: field('bind'),
      call: field('call'),
      caller: field('caller'),
      length: field('length'),
      name: field('name'),
      prototype: field('prototype'),
      toString: field('toString'),
    };
    const formGroup = form(controls);

    expect(formGroup.apply).toBe(controls.apply);
    expect(formGroup.arguments).toBe(controls.arguments);
    expect(formGroup.bind).toBe(controls.bind);
    expect(formGroup.call).toBe(controls.call);
    expect(formGroup.caller).toBe(controls.caller);
    expect(formGroup.length).toBe(controls.length);
    expect(formGroup.name).toBe(controls.name);
    expect(formGroup.prototype).toBe(controls.prototype);
    expect(formGroup.toString).toBe(controls.toString);
    expect(formGroup.apply()).toBe('apply');
    expect(formGroup.arguments()).toBe('arguments');
    expect(formGroup.name()).toBe('name');
  });

  it('gives child nodes precedence over colliding direct api members', () => {
    const readonlyField = field(false);
    const disabledField = field('child');
    const resetField = field('reset child');
    const profile = form({
      age: field(23),
      readonly: readonlyField,
      disabled: disabledField,
      reset: resetField,
    });

    expect(profile.readonly).toBe(readonlyField);
    expect(profile.disabled).toBe(disabledField);
    expect(profile.reset).toBe(resetField);
    expect(profile.readonly()).toBe(false);
    expect(profile.disabled()).toBe('child');
    expect(profile.reset()).toBe('reset child');
    expect(profile.api.readonly()).toBe(false);
    expect(profile.api.disabled()).toBe(false);

    profile.api.markAsReadonly();
    profile.api.disable();
    profile.api.reset({ age: 30, readonly: true, disabled: 'updated', reset: 'updated reset' });

    expect(profile.readonly()).toBe(true);
    expect(profile.disabled()).toBe('updated');
    expect(profile.reset()).toBe('updated reset');
    expect(profile.api.readonly()).toBe(true);
    expect(profile.api.disabled()).toBe(true);
  });

  it('allows a synchronous field validator to read its owning class form on its first execution', () => {
    class ProfileComponent {
      readonly profile = form({
        name: field<string>(undefined, [required]),
        age: field(23, {
          validators: [({ value }) => {
            if (!this.profile.name()) return { kind: 'missingSiblingName' };
            return value()! > 120 ? { kind: 'maximumAge' } : null;
          }],
        }),
      });
    }

    const component = new ProfileComponent();

    expect(() => component.profile.age.errors()).not.toThrow();
    expect(component.profile.age.errors()).toMatchObject([{ kind: 'missingSiblingName' }]);
    component.profile.name.set('David');
    expect(component.profile.age.errors()).toEqual([]);
  });

  it('allows an asynchronous field validator to read its owning class form on its first execution', async () => {
    const validate = vi.fn(async (name: string | null) =>
      name === null ? { kind: 'missingSiblingName' } : null,
    );
    class ProfileComponent {
      readonly profile = form({
        name: field<string>(undefined, [required]),
        age: field(23, [asyncValidator(async (): Promise<{ kind: string } | null> =>
          validate(this.profile.name()),
        )]),
      });
    }

    const component = new ProfileComponent();

    expect(validate).not.toHaveBeenCalled();
    expect(component.profile.age.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(component.profile.age.errors()).toMatchObject([{ kind: 'missingSiblingName' }]);
    component.profile.name.set('David');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledTimes(2);
    expect(component.profile.age.errors()).toEqual([]);
  });

  it('exposes paths from the root to nested nodes', () => {
    const profile = form({
      name: field('David'),
      address: {
        city: field('Zurich'),
      },
    });

    expect(profile.api.path()).toEqual([]);
    expect(profile.name.api.path()).toEqual(['name']);
    expect(profile.address.api.path()).toEqual(['address']);
    expect(profile.address.city.api.path()).toEqual(['address', 'city']);
    expect(profile.api.parent()).toBeNull();
    expect(profile.name.api.parent()).toBe(profile);
    expect(profile.address.api.parent()).toBe(profile);
    expect(profile.address.city.api.parent()).toBe(profile.address);
    expect(profile.api.form()).toBe(profile);
    expect(profile.name.api.form()).toBe(profile);
    expect(profile.address.api.form()).toBe(profile);
    expect(profile.address.city.api.form()).toBe(profile);
  });

  it('exposes tree navigation through a field synchronous validator api', () => {
    let validatorApi: unknown;
    let validatorField: unknown;
    let validatorForm: unknown;
    let validatorParent: unknown;
    let validatorPath: readonly string[] = [];
    const profile = form({
      address: {
        city: field('Zurich', [context => {
          validatorApi = context.api;
          validatorField = context.field;
          validatorForm = context.form();
          validatorParent = context.parent();
          validatorPath = context.path();
          return null;
        }]),
      },
    });

    expect(profile.address.city.errors()).toEqual([]);
    expect(validatorApi).toBe(profile.address.city.api);
    expect(validatorField).toBe(profile.address.city);
    expect(validatorForm).toBe(profile);
    expect(validatorParent).toBe(profile.address);
    expect(validatorPath).toEqual(['address', 'city']);
    expect(profile.address.city.api.path()).toEqual(['address', 'city']);
    expect(profile.address.city.api.parent()).toBe(profile.address);
    expect(profile.address.city.api.form()).toBe(profile);
  });

  it('exposes the root form api to synchronous form validators', () => {
    let validatorApi: unknown;
    let validatorField: unknown;
    const profile = form({ name: field('David') }, [context => {
      validatorApi = context.api;
      validatorField = context.field;
      return null;
    }]);

    expect(profile.api.errors()).toEqual([]);
    expect(validatorApi).toBe(profile.api);
    expect(validatorField).toBe(profile);
    expect(profile.api.path()).toEqual([]);
    expect(profile.api.parent()).toBeNull();
    expect(profile.api.form()).toBe(profile);
  });

  it('exposes each field under its own key', () => {
    const formGroup = form({
      age: field(23),
      city: field('Zurich'),
    });
    expect(formGroup.age()).toBe(23);
    expect(formGroup.city.value()).toBe('Zurich');
  });

  it('aggregates the value of its fields', () => {
    const formGroup = form({
      age: field(23),
      city: field('Zurich'),
    });
    expect(formGroup.api.value()).toEqual({ age: 23, city: 'Zurich' });
    expect(formGroup()).toEqual({ age: 23, city: 'Zurich' });
  });

  it('reflects a field change in the form value', () => {
    const formGroup = form({ age: field(23) });
    formGroup.age.set(30);
    expect(formGroup.api.value()).toEqual({ age: 30 });
  });

  it('includes the value of nested forms', () => {
    const formGroup = form({
      age: field(23),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    expect(formGroup.api.value()).toEqual({
      age: 23,
      address: { city: 'Zurich', country: 'CH' },
    });
  });

  it('creates nested forms from plain objects', () => {
    const formGroup = form({
      name: field('David'),
      address: {
        city: field('Moscow'),
        country: field('Russia'),
      },
    });
    expect(formGroup.api.value()).toEqual({
      name: 'David',
      address: { city: 'Moscow', country: 'Russia' },
    });
    expect(formGroup.address.city()).toBe('Moscow');
    expect(formGroup.address.api.value()).toEqual({ city: 'Moscow', country: 'Russia' });
  });

  it('supports shorthand objects at multiple nesting levels', () => {
    const formGroup = form({
      profile: {
        address: {
          city: field('Moscow'),
        },
      },
    });
    formGroup.profile.address.city.set('Zurich');
    expect(formGroup()).toEqual({ profile: { address: { city: 'Zurich' } } });
  });

  it('propagates parent state through shorthand nested forms', () => {
    const formGroup = form({ address: { city: field('Moscow') } });
    formGroup.api.disable();
    expect(formGroup.address.api.disabled()).toBe(true);
    expect(formGroup.address.city.disabled()).toBe(true);
    formGroup.api.enable();
    formGroup.api.markAsReadonly();
    expect(formGroup.address.api.readonly()).toBe(true);
    expect(formGroup.address.city.readonly()).toBe(true);
  });

  it('gives access to nested fields', () => {
    const formGroup = form({
      address: form({ city: field('Zurich') }),
    });
    expect(formGroup.address.city()).toBe('Zurich');
    expect(formGroup.address.api.value()).toEqual({ city: 'Zurich' });
  });

  it('propagates a nested field change up to the root', () => {
    const formGroup = form({
      address: form({ city: field('Zurich') }),
    });
    formGroup.address.city.set('Madrid');
    expect(formGroup.api.value()).toEqual({ address: { city: 'Madrid' } });
  });

  it('assigns every value through set', () => {
    const formGroup = form({
      age: field(23),
      city: field('Zurich'),
    });
    formGroup.api.set({ age: 30, city: 'Madrid' });
    expect(formGroup.api.value()).toEqual({ age: 30, city: 'Madrid' });
  });

  it('walks down into nested forms on set', () => {
    const formGroup = form({
      age: field(23),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    formGroup.api.set({ age: 30, address: { city: 'Madrid', country: 'ES' } });
    expect(formGroup.api.value()).toEqual({
      age: 30,
      address: { city: 'Madrid', country: 'ES' },
    });
  });

  it('only touches the given keys on patch', () => {
    const formGroup = form({
      age: field(23),
      city: field('Zurich'),
    });
    formGroup.api.patch({ age: 30 });
    expect(formGroup.api.value()).toEqual({ age: 30, city: 'Zurich' });
  });

  it('patches nested forms partially', () => {
    const formGroup = form({
      age: field(23),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    formGroup.api.patch({ address: { country: 'ES' } });
    expect(formGroup.api.value()).toEqual({
      age: 23,
      address: { city: 'Zurich', country: 'ES' },
    });
  });

  it('ignores unknown keys on patch', () => {
    const formGroup = form({ age: field(23) });
    formGroup.api.patch({ age: 30, nope: 1 } as any);
    expect(formGroup.api.value()).toEqual({ age: 30 });
  });

  it('is valid with no validators and no invalid children', () => {
    const formGroup = form({ age: field(23) });
    expect(formGroup.api.errors()).toEqual([]);
    expect(formGroup.api.valid()).toBe(true);
    expect(formGroup.api.invalid()).toBe(false);
  });

  it('reports its own validator through errors', () => {
    const sameCity = ({ value }: Context<{ city: string | null; billingCity: string | null }>) =>
      value().city === value().billingCity ? null : { kind: 'sameCity' };
    const formGroup = form(
      {
        city: field('Zurich'),
        billingCity: field('Madrid'),
      },
      [sameCity],
    );
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'sameCity' }]);
    expect(formGroup.api.errors()[0]!.targetNode).toBe(formGroup);
    expect(formGroup.api.valid()).toBe(false);
  });

  it('reevaluates a cross-field validator when a field changes', () => {
    const sameCity = ({ value }: Context<{ city: string | null; billingCity: string | null }>) =>
      value().city === value().billingCity ? null : { kind: 'sameCity' };
    const formGroup = form(
      {
        city: field('Zurich'),
        billingCity: field('Madrid'),
      },
      [sameCity],
    );
    formGroup.billingCity.set('Zurich');
    expect(formGroup.api.errors()).toEqual([]);
    expect(formGroup.api.valid()).toBe(true);
  });

  it('reacts to external signals read by a synchronous form validator', () => {
    const blocked = signal(false);
    const validate = vi.fn(() => blocked() ? { kind: 'blocked' } : null);
    const formGroup = form({ name: field('David') }, [validate]);

    expect(formGroup.api.errors()).toEqual([]);
    expect(validate).toHaveBeenCalledOnce();

    blocked.set(true);

    expect(formGroup.api.errors()).toMatchObject([{ kind: 'blocked' }]);
    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('conditionally applies a synchronous form validator returned by another validator', () => {
    const enabled = signal(false);
    const sameCity = vi.fn(({ value }: Context<{ city: string | null; billingCity: string | null }>) =>
      value().city === value().billingCity ? null : { kind: 'sameCity' },
    );
    const formGroup = form(
      { city: field('Zurich'), billingCity: field('Madrid') },
      [() => enabled() ? sameCity : null],
    );

    expect(formGroup.api.errors()).toEqual([]);
    expect(sameCity).not.toHaveBeenCalled();

    enabled.set(true);

    expect(formGroup.api.errors()).toMatchObject([{ kind: 'sameCity' }]);
    expect(sameCity).toHaveBeenCalledOnce();

    enabled.set(false);

    expect(formGroup.api.errors()).toEqual([]);
    expect(sameCity).toHaveBeenCalledOnce();
  });

  it('accepts one form validator and conditionally resolves a returned validator array', () => {
    const enabled = signal(false);
    const first = () => ({ kind: 'first' });
    const second = () => ({ kind: 'second' });
    const validate = () => enabled() ? [first, second] : null;
    const formGroup = form({ name: field('David') }, validate);

    expect(formGroup.api.validators()).toEqual([validate]);
    expect(formGroup.api.errors()).toEqual([]);

    enabled.set(true);
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'first' }, { kind: 'second' }]);

    formGroup.api.setValidators(first);
    expect(formGroup.api.validators()).toEqual([first]);
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'first' }]);
  });

  it('filters empty entries from the configured form-validator array', () => {
    const invalid = () => ({ kind: 'invalid' });
    const formGroup = form({ name: field('David') }, [invalid, null, undefined]);

    expect(formGroup.api.validators()).toEqual([invalid]);
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'invalid' }]);
  });

  it('filters empty entries from a returned form-validator array', () => {
    const invalid = () => ({ kind: 'invalid' });
    const formGroup = form({ name: field('David') }, () => [invalid, null, undefined]);

    expect(formGroup.api.errors()).toMatchObject([{ kind: 'invalid' }]);
  });

  it('is invalid when a child is invalid, even without own errors', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const formGroup = form({ city: field('', [required]) });
    expect(formGroup.api.errors()).toEqual([]);
    expect(formGroup.api.valid()).toBe(false);
    expect(formGroup.api.invalid()).toBe(true);
  });

  it('reports only its own active required error', () => {
    const ownRequired = form({ name: field('David') }, [() => ({ kind: 'required' })]);
    const configuredRequired = form({ name: field('David') }, [required]);
    const childRequired = form({ name: field('', [required]) });

    expect(ownRequired.required()).toBe(true);
    expect(ownRequired.api.required()).toBe(true);
    expect(configuredRequired.errors()).toEqual([]);
    expect(configuredRequired.required()).toBe(true);
    expect(childRequired.name.required()).toBe(true);
    expect(childRequired.required()).toBe(false);
  });

  it('returns only the first matching own form error', () => {
    const formGroup = form({
      name: field('', [required]),
    }, [
      () => ({ kind: 'formError', message: 'First' }),
      () => ({ kind: 'formError', message: 'Second' }),
    ]);

    expect(formGroup.getError('formError')).toMatchObject({ kind: 'formError', message: 'First' });
    expect(formGroup.getError('formError')?.targetNode).toBe(formGroup);
    expect(formGroup.api.getError('formError')).toBe(formGroup.getError('formError'));
    expect(formGroup.getError('required')).toBeUndefined();
  });

  it('gives a child named getError precedence over the form method', () => {
    const getErrorField = field('child');
    const formGroup = form({ getError: getErrorField }, [() => ({ kind: 'formError' })]);

    expect(formGroup.getError).toBe(getErrorField);
    expect(formGroup.getError()).toBe('child');
    expect(formGroup.api.getError('formError')).toMatchObject({ kind: 'formError' });
  });

  it('gives a child named required precedence over the form required signal', () => {
    const requiredField = field('child');
    const formGroup = form({ required: requiredField }, [() => ({ kind: 'required' })]);

    expect(formGroup.required).toBe(requiredField);
    expect(formGroup.required()).toBe('child');
    expect(formGroup.api.required()).toBe(true);
  });

  it('derives validationStatus from synchronous child validation', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const formGroup = form({ city: field('', [required]) });

    expect(formGroup.api.validationStatus()).toBe('invalid');
    expect(formGroup.api.valid()).toBe(false);
    expect(formGroup.api.invalid()).toBe(true);

    formGroup.city.set('Zurich');

    expect(formGroup.api.validationStatus()).toBe('valid');
    expect(formGroup.api.valid()).toBe(true);
    expect(formGroup.api.invalid()).toBe(false);
  });

  it('runs its own asynchronous validator and exposes its validation state', async () => {
    const formGroup = form(
      {
        city: field('Zurich'),
        billingCity: field('Madrid'),
      },
      [
        asyncValidator(async ({ value }) =>
          value().city === value().billingCity ? null : { kind: 'citiesDoNotMatch' },
        ),
      ],
    );

    expect(formGroup.api.pending()).toBe(true);
    expect(formGroup.api.validationStatus()).toBe('unknown');

    await Promise.resolve();
    await Promise.resolve();

    expect(formGroup.api.pending()).toBe(false);
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'citiesDoNotMatch' }]);
    expect(formGroup.api.validationStatus()).toBe('invalid');
  });

  it('reruns its asynchronous validator when a signal read by it changes', async () => {
    const allowedCountry = signal('Switzerland');
    const validate = vi.fn(async ({ value }: Context<{ country: string | null }>) =>
      value().country === allowedCountry() ? null : { kind: 'countryNotAllowed' },
    );
    const formGroup = form({ country: field('Switzerland') }, [asyncValidator(validate)]);

    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(formGroup.api.errors()).toEqual([]);

    allowedCountry.set('Germany');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledTimes(2);
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'countryNotAllowed' }]);
  });

  it('restarts its debounced asynchronous validation when a descendant changes', async () => {
    vi.useFakeTimers();
    const validate = vi.fn(async ({ value }: Context<{ country: string | null }>) =>
      value().country === 'Germany' ? { kind: 'countryNotAllowed' } : null,
    );
    const formGroup = form(
      { country: field('Switzerland') },
      [asyncValidator(validate, { debounce: 100 })],
    );

    await Promise.resolve();
    formGroup.country.set('Germany');
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(100);

    expect(validate).toHaveBeenCalledTimes(2);
    expect(formGroup.api.pending()).toBe(false);
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'countryNotAllowed' }]);
    vi.useRealTimers();
  });

  it('passes an explicit reactive params snapshot to its asynchronous validator', async () => {
    const allowedCountry = signal('Switzerland');
    const validate = vi.fn(async ({ params }: { params: { allowed: string; country: string | null } }) =>
      params.country === params.allowed ? null : { kind: 'countryNotAllowed' },
    );
    const formGroup = form({ country: field('Switzerland') }, [asyncValidator({
      params: ({ value }) => ({ allowed: allowedCountry(), country: value().country }),
      validate,
    })]);

    await Promise.resolve();
    await Promise.resolve();
    expect(formGroup.api.errors()).toEqual([]);

    allowedCountry.set('Germany');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenLastCalledWith(expect.objectContaining({
      params: { allowed: 'Germany', country: 'Switzerland' },
    }));
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'countryNotAllowed' }]);
  });

  it('reactively includes or excludes its asynchronous validator through when', async () => {
    const enabled = signal(false);
    const validate = vi.fn(async () => ({ kind: 'countryNotAllowed' }));
    const formGroup = form({ country: field('Switzerland') }, [asyncValidator(validate, {
      when: () => enabled(),
    })]);

    expect(formGroup.api.valid()).toBe(true);
    expect(validate).not.toHaveBeenCalled();

    enabled.set(true);
    await Promise.resolve();
    expect(formGroup.api.pending()).toBe(true);
    await Promise.resolve();
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'countryNotAllowed' }]);

    enabled.set(false);
    await Promise.resolve();
    expect(formGroup.api.pending()).toBe(false);
    expect(formGroup.api.errors()).toEqual([]);
    expect(formGroup.api.valid()).toBe(true);
  });

  it('exposes its aggregate interaction state to an asynchronous validator', async () => {
    const states: Array<{ dirty: boolean; touched: boolean }> = [];
    const formGroup = form({ country: field('Switzerland') }, [asyncValidator(async ({ api }) => {
      states.push({ dirty: api.dirty(), touched: api.touched() });
      return null;
    })]);

    await Promise.resolve();
    await Promise.resolve();
    formGroup.country.markAsDirty();
    formGroup.country.markAsTouched();
    await Promise.resolve();
    await Promise.resolve();

    expect(states).toEqual([
      { dirty: false, touched: false },
      { dirty: true, touched: true },
    ]);
  });

  it('is invalid when a grandchild is invalid', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const formGroup = form({
      address: form({ city: field('', [required]) }),
    });
    expect(formGroup.address.api.valid()).toBe(false);
    expect(formGroup.api.valid()).toBe(false);
  });

  it('becomes valid once the failing child is fixed', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const formGroup = form({ city: field('', [required]) });
    formGroup.city.set('Zurich');
    expect(formGroup.api.valid()).toBe(true);
  });

  it('recomputes its errors after setValidators', () => {
    const sameCity = ({ value }: Context<{ city: string | null; billingCity: string | null }>) =>
      value().city === value().billingCity ? null : { kind: 'sameCity' };
    const formGroup = form(
      {
        city: field('Zurich'),
        billingCity: field('Madrid'),
      },
      [sameCity],
    );
    expect(formGroup.api.valid()).toBe(false);
    formGroup.api.setValidators([]);
    expect(formGroup.api.errors()).toEqual([]);
    expect(formGroup.api.valid()).toBe(true);
  });

  it('adds validators to a form declared without them', () => {
    const formGroup = form({
      city: field('Zurich'),
      billingCity: field('Madrid'),
    });
    expect(formGroup.api.valid()).toBe(true);
    formGroup.api.setValidators([
      ({ value }) => (value().city === value().billingCity ? null : { kind: 'sameCity' }),
    ]);
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'sameCity' }]);
    expect(formGroup.api.valid()).toBe(false);
  });

  it('accepts validators and state in a second-argument options object', () => {
    const sameCity = ({ value }: Context<{ city: string | null; billingCity: string | null }>) =>
      value().city === value().billingCity ? null : { kind: 'sameCity' };
    const formGroup = form(
      {
        city: field('Moscow'),
        billingCity: field('Zurich'),
      },
      {
        validators: [sameCity],
        hidden: true,
      },
    );
    expect(formGroup.api.validators()).toEqual([sameCity]);
    expect(formGroup.api.hidden()).toBe(true);
    expect(formGroup.api.errors()).toEqual([]);
    formGroup.api.show();
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'sameCity' }]);
  });

  it('accepts second-argument options without validators', () => {
    const formGroup = form({ name: field('David') }, { disabled: true });
    expect(formGroup.api.validators()).toEqual([]);
    expect(formGroup.api.disabled()).toBe(true);
  });

  it('starts untouched', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    expect(formGroup.api.touched()).toBe(false);
    expect(formGroup.api.untouched()).toBe(true);
  });

  it('is touched as soon as one child is touched', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.markAsTouched();
    expect(formGroup.api.touched()).toBe(true);
    expect(formGroup.api.untouched()).toBe(false);
    expect(formGroup.age.touched()).toBe(false);
  });

  it('is touched when a grandchild is touched', () => {
    const formGroup = form({
      address: form({ city: field('Zurich') }),
    });
    formGroup.address.city.markAsTouched();
    expect(formGroup.address.api.touched()).toBe(true);
    expect(formGroup.api.touched()).toBe(true);
  });

  it('marks every descendant as touched', () => {
    const formGroup = form({
      name: field('David'),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    formGroup.api.markAsTouched();
    expect(formGroup.name.touched()).toBe(true);
    expect(formGroup.address.city.touched()).toBe(true);
    expect(formGroup.address.country.touched()).toBe(true);
    expect(formGroup.address.api.touched()).toBe(true);
  });

  it('marks every descendant as untouched', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.markAsTouched();
    formGroup.api.markAsUntouched();
    expect(formGroup.name.touched()).toBe(false);
    expect(formGroup.address.city.touched()).toBe(false);
    expect(formGroup.api.touched()).toBe(false);
  });

  it('only marks its own subtree as touched', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.address.api.markAsTouched();
    expect(formGroup.address.city.touched()).toBe(true);
    expect(formGroup.name.touched()).toBe(false);
  });

  it('goes back to untouched when the only touched child is reset', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.markAsTouched();
    formGroup.name.markAsUntouched();
    expect(formGroup.api.touched()).toBe(false);
  });

  it('stays untouched when values change through set and patch', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.set({ name: 'Ana', address: { city: 'Madrid' } });
    formGroup.api.patch({ name: 'Leo' });
    expect(formGroup.api.touched()).toBe(false);
  });

  it('starts pristine', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    expect(formGroup.api.dirty()).toBe(false);
    expect(formGroup.api.pristine()).toBe(true);
  });

  it('is dirty as soon as one child is dirty', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.set('Ana');
    expect(formGroup.api.dirty()).toBe(true);
    expect(formGroup.api.pristine()).toBe(false);
    expect(formGroup.age.dirty()).toBe(false);
  });

  it('is dirty when a grandchild is dirty', () => {
    const formGroup = form({
      address: form({ city: field('Zurich') }),
    });
    formGroup.address.city.set('Madrid');
    expect(formGroup.address.api.dirty()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
  });

  it('becomes dirty through set', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.api.set({ name: 'Ana', age: 30 });
    expect(formGroup.name.dirty()).toBe(true);
    expect(formGroup.age.dirty()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
  });

  it('only dirties the patched keys', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.api.patch({ name: 'Ana' });
    expect(formGroup.name.dirty()).toBe(true);
    expect(formGroup.age.dirty()).toBe(false);
    expect(formGroup.api.dirty()).toBe(true);
  });

  it('only dirties the patched branch of a nested form', () => {
    const formGroup = form({
      name: field('David'),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    formGroup.api.patch({ address: { country: 'ES' } });
    expect(formGroup.address.country.dirty()).toBe(true);
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.name.dirty()).toBe(false);
  });

  it('marks every descendant as dirty', () => {
    const formGroup = form({
      name: field('David'),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    formGroup.api.markAsDirty();
    expect(formGroup.name.dirty()).toBe(true);
    expect(formGroup.address.city.dirty()).toBe(true);
    expect(formGroup.address.country.dirty()).toBe(true);
    expect(formGroup.address.api.dirty()).toBe(true);
  });

  it('marks every descendant as pristine', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.set({ name: 'Ana', address: { city: 'Madrid' } });
    formGroup.api.markAsPristine();
    expect(formGroup.name.dirty()).toBe(false);
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
  });

  it('keeps the values after markAsPristine', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.set({ name: 'Ana', address: { city: 'Madrid' } });
    formGroup.api.markAsPristine();
    expect(formGroup.api.value()).toEqual({ name: 'Ana', address: { city: 'Madrid' } });
  });

  it('only marks its own subtree as dirty', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.address.api.markAsDirty();
    expect(formGroup.address.city.dirty()).toBe(true);
    expect(formGroup.name.dirty()).toBe(false);
  });

  it('goes back to pristine when the only dirty child is reset', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.set('Ana');
    formGroup.name.markAsPristine();
    expect(formGroup.api.dirty()).toBe(false);
  });

  it('keeps a field named name accessible', () => {
    const formGroup = form({ name: field('David') });
    expect(formGroup.name()).toBe('David');
    expect(formGroup.name.value()).toBe('David');
  });

  it('keeps a field named length accessible', () => {
    const formGroup = form({ length: field(10) });
    expect(formGroup.length()).toBe(10);
    expect(formGroup.api.value()).toEqual({ length: 10 });
  });

  it('reaches nested state through the child api', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.name.api.set('Ana');
    expect(formGroup.api.value()).toEqual({ name: 'Ana', address: { city: 'Zurich' } });
    expect(formGroup.name.api.dirty()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
  });

  it('keeps every value on reset with no argument', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich'), country: field('CH') }),
    });
    formGroup.api.set({ name: 'Ana', address: { city: 'Madrid', country: 'ES' } });
    formGroup.api.reset();
    expect(formGroup.api.value()).toEqual({ name: 'Ana', address: { city: 'Madrid', country: 'ES' } });
  });

  it('clears dirty and touched on every descendant', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.set({ name: 'Ana', address: { city: 'Madrid' } });
    formGroup.api.markAsTouched();
    formGroup.api.reset();
    expect(formGroup.name.dirty()).toBe(false);
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.address.city.touched()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
    expect(formGroup.api.touched()).toBe(false);
  });

  it('assigns every value passed to reset', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich'), country: field('CH') }),
    });
    formGroup.api.reset({ name: 'Leo', address: { city: 'Bern', country: 'CH' } });
    expect(formGroup.api.value()).toEqual({ name: 'Leo', address: { city: 'Bern', country: 'CH' } });
  });

  it('stays pristine after reset with a value', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.markAsTouched();
    formGroup.api.reset({ name: 'Leo', address: { city: 'Bern' } });
    expect(formGroup.api.dirty()).toBe(false);
    expect(formGroup.api.touched()).toBe(false);
    expect(formGroup.name.dirty()).toBe(false);
  });

  it('only resets its own subtree', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.set({ name: 'Ana', address: { city: 'Madrid' } });
    formGroup.address.api.reset({ city: 'Bern' });
    expect(formGroup.api.value()).toEqual({ name: 'Ana', address: { city: 'Bern' } });
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.name.dirty()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
  });

  it('revalidates after reset with a value', () => {
    const sameCity = ({ value }: Context<{ city: string | null; billingCity: string | null }>) =>
      value().city === value().billingCity ? null : { kind: 'sameCity' };
    const formGroup = form(
      {
        city: field('Zurich'),
        billingCity: field('Zurich'),
      },
      [sameCity],
    );
    expect(formGroup.api.valid()).toBe(true);
    formGroup.api.reset({ city: 'Zurich', billingCity: 'Madrid' });
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'sameCity' }]);
  });

  it('starts enabled', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    expect(formGroup.api.disabled()).toBe(false);
    expect(formGroup.api.enabled()).toBe(true);
  });

  it('can start disabled through options', () => {
    const formGroup = form(
      {
        name: field('David'),
        address: form({ city: field('Zurich') }),
      },
      undefined,
      { disabled: true },
    );

    expect(formGroup.api.disabled()).toBe(true);
    expect(formGroup.name.disabled()).toBe(true);
    expect(formGroup.address.api.disabled()).toBe(true);
    expect(formGroup.address.city.disabled()).toBe(true);
  });

  it('skips its own validators while disabled', () => {
    const validator = vi.fn(() => ({ kind: 'unavailable' }));
    const formGroup = form({ name: field('David') }, [validator], { disabled: true });

    expect(formGroup.api.errors()).toEqual([]);
    expect(formGroup.api.valid()).toBe(true);
    expect(validator).not.toHaveBeenCalled();

    formGroup.api.enable();
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'unavailable' }]);
    expect(validator).toHaveBeenCalledOnce();
  });

  it('ignores a disabled child when computing validity', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const formGroup = form({
      name: field('', [required]),
      age: field(23),
    });
    expect(formGroup.api.valid()).toBe(false);
    formGroup.name.disable();
    expect(formGroup.name.valid()).toBe(true);
    expect(formGroup.api.valid()).toBe(true);
    formGroup.name.enable();
    expect(formGroup.api.valid()).toBe(false);
  });

  it('ignores a disabled child when computing touched and dirty', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.disable();
    formGroup.name.markAsTouched();
    formGroup.name.markAsDirty();
    expect(formGroup.name.touched()).toBe(false);
    expect(formGroup.name.dirty()).toBe(false);
    expect(formGroup.api.touched()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
    formGroup.name.enable();
    expect(formGroup.name.dirty()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
    formGroup.age.markAsTouched();
    expect(formGroup.api.touched()).toBe(true);
  });

  it('disables every descendant', () => {
    const formGroup = form({
      name: field('David'),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    formGroup.api.disable();
    expect(formGroup.name.disabled()).toBe(true);
    expect(formGroup.address.city.disabled()).toBe(true);
    expect(formGroup.address.country.disabled()).toBe(true);
    expect(formGroup.address.api.disabled()).toBe(true);
    expect(formGroup.api.disabled()).toBe(true);
  });

  it('enables every descendant', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.disable();
    formGroup.api.enable();
    expect(formGroup.name.disabled()).toBe(false);
    expect(formGroup.address.city.disabled()).toBe(false);
    expect(formGroup.api.disabled()).toBe(false);
  });

  it('preserves a child own disabled state after its parent is re-enabled', () => {
    const formGroup = form({
      name: field('David', undefined, { disabled: true }),
      address: form({ city: field('Zurich') }),
    });

    formGroup.api.disable();
    formGroup.api.enable();

    expect(formGroup.api.disabled()).toBe(false);
    expect(formGroup.name.disabled()).toBe(true);
    expect(formGroup.address.api.disabled()).toBe(false);
    expect(formGroup.address.city.disabled()).toBe(false);
  });

  it('hides descendant interaction state while disabled and restores it when enabled', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });

    formGroup.name.markAsTouched();
    formGroup.address.city.markAsDirty();
    expect(formGroup.api.touched()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);

    formGroup.api.disable();
    expect(formGroup.name.touched()).toBe(false);
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.api.touched()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);

    formGroup.api.enable();
    expect(formGroup.name.touched()).toBe(true);
    expect(formGroup.address.city.dirty()).toBe(true);
    expect(formGroup.api.touched()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
  });

  it('keeps every value after disabling the form', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.disable();
    expect(formGroup.api.value()).toEqual({ name: 'David', address: { city: 'Zurich' } });
  });

  it('does not become disabled when every child is disabled', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.disable();
    expect(formGroup.api.disabled()).toBe(false);
    formGroup.age.disable();
    expect(formGroup.api.disabled()).toBe(false);
  });

  it('only disables its own subtree', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.address.api.disable();
    expect(formGroup.address.city.disabled()).toBe(true);
    expect(formGroup.name.disabled()).toBe(false);
    expect(formGroup.api.disabled()).toBe(false);
  });

  it('reports an empty form as enabled', () => {
    const formGroup = form({});
    expect(formGroup.api.disabled()).toBe(false);
    expect(formGroup.api.enabled()).toBe(true);
  });

  it('starts writable', () => {
    const formGroup = form({ name: field('David') });
    expect(formGroup.api.readonly()).toBe(false);
    expect(formGroup.api.writable()).toBe(true);
  });

  it('propagates initial readonly state to every descendant', () => {
    const formGroup = form(
      {
        name: field('David'),
        address: form({ city: field('Zurich') }),
      },
      undefined,
      { readonly: true },
    );

    expect(formGroup.api.readonly()).toBe(true);
    expect(formGroup.name.readonly()).toBe(true);
    expect(formGroup.address.api.readonly()).toBe(true);
    expect(formGroup.address.city.readonly()).toBe(true);
  });

  it('skips its own validators while readonly', () => {
    const validator = vi.fn(() => ({ kind: 'unavailable' }));
    const formGroup = form({ name: field('David') }, [validator], { readonly: true });

    expect(formGroup.api.errors()).toEqual([]);
    expect(formGroup.api.valid()).toBe(true);
    expect(validator).not.toHaveBeenCalled();

    formGroup.api.markAsWritable();
    expect(formGroup.api.errors()).toMatchObject([{ kind: 'unavailable' }]);
    expect(validator).toHaveBeenCalledOnce();
  });

  it('does not become readonly when every child is readonly', () => {
    const formGroup = form({ name: field('David'), age: field(23) });
    formGroup.name.markAsReadonly();
    formGroup.age.markAsReadonly();
    expect(formGroup.api.readonly()).toBe(false);
  });

  it('preserves child-owned readonly state after its parent becomes writable', () => {
    const formGroup = form({
      name: field('David', undefined, { readonly: true }),
      address: form({ city: field('Zurich') }),
    });

    formGroup.api.markAsReadonly();
    formGroup.api.markAsWritable();

    expect(formGroup.api.readonly()).toBe(false);
    expect(formGroup.name.readonly()).toBe(true);
    expect(formGroup.address.api.readonly()).toBe(false);
    expect(formGroup.address.city.readonly()).toBe(false);
  });

  it('hides descendant interaction state while readonly and restores it when writable', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });

    formGroup.name.markAsTouched();
    formGroup.address.city.markAsDirty();
    formGroup.api.markAsReadonly();
    expect(formGroup.api.touched()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
    expect(formGroup.name.touched()).toBe(false);
    expect(formGroup.address.city.dirty()).toBe(false);

    formGroup.api.markAsWritable();
    expect(formGroup.api.touched()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
    expect(formGroup.name.touched()).toBe(true);
    expect(formGroup.address.city.dirty()).toBe(true);
  });

  it('starts visible and can be hidden and shown', () => {
    const formGroup = form({ name: field('David') });
    expect(formGroup.api.hidden()).toBe(false);
    expect(formGroup.api.visible()).toBe(true);
    formGroup.api.hide();
    expect(formGroup.api.hidden()).toBe(true);
    expect(formGroup.name.hidden()).toBe(true);
    formGroup.api.show();
    expect(formGroup.api.hidden()).toBe(false);
    expect(formGroup.name.hidden()).toBe(false);
  });

  it('propagates initial hidden state to every descendant', () => {
    const formGroup = form(
      { name: field('David'), address: { city: field('Moscow') } },
      undefined,
      { hidden: true },
    );
    expect(formGroup.api.hidden()).toBe(true);
    expect(formGroup.name.hidden()).toBe(true);
    expect(formGroup.address.api.hidden()).toBe(true);
    expect(formGroup.address.city.hidden()).toBe(true);
  });

  it('preserves child-owned hidden state after its parent is shown', () => {
    const formGroup = form({
      name: field('David', undefined, { hidden: true }),
      address: { city: field('Moscow') },
    });
    formGroup.api.hide();
    formGroup.api.show();
    expect(formGroup.api.hidden()).toBe(false);
    expect(formGroup.name.hidden()).toBe(true);
    expect(formGroup.address.api.hidden()).toBe(false);
    expect(formGroup.address.city.hidden()).toBe(false);
  });

  it('ignores hidden descendants when aggregating state', () => {
    const required = ({ value }: Context<string | null>) => (value() === '' ? { kind: 'required' } : null);
    const formGroup = form({ name: field('', [required]), age: field(23) });
    formGroup.name.markAsTouched();
    formGroup.name.markAsDirty();
    expect(formGroup.api.valid()).toBe(false);
    expect(formGroup.api.touched()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
    formGroup.name.hide();
    expect(formGroup.api.valid()).toBe(true);
    expect(formGroup.api.touched()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
  });

  it('reacts to form state source functions', () => {
    const locked = signal(false);
    const readonly = signal(false);
    const hidden = signal(false);
    const formGroup = form(
      { address: { city: field('Moscow') } },
      undefined,
      {
        disabled: () => locked(),
        readonly,
        hidden,
      },
    );
    locked.set(true);
    expect(formGroup.api.disabled()).toBe(true);
    expect(formGroup.address.city.disabled()).toBe(true);
    locked.set(false);
    readonly.set(true);
    expect(formGroup.address.city.readonly()).toBe(true);
    readonly.set(false);
    hidden.set(true);
    expect(formGroup.address.city.hidden()).toBe(true);
  });
});
