import { describe, expect, it } from 'vitest';
import { field } from '../field/field';
import { form } from './form';

describe('form', () => {
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
    expect(formGroup.api.errors()).toBeNull();
    expect(formGroup.api.valid()).toBe(true);
    expect(formGroup.api.invalid()).toBe(false);
  });

  it('reports its own validator through errors', () => {
    const sameCity = (value: { city: string; billingCity: string }) =>
      value.city === value.billingCity ? null : { sameCity: true };
    const formGroup = form(
      {
        city: field('Zurich'),
        billingCity: field('Madrid'),
      },
      [sameCity],
    );
    expect(formGroup.api.errors()).toEqual({ sameCity: true });
    expect(formGroup.api.valid()).toBe(false);
  });

  it('reevaluates a cross-field validator when a field changes', () => {
    const sameCity = (value: { city: string; billingCity: string }) =>
      value.city === value.billingCity ? null : { sameCity: true };
    const formGroup = form(
      {
        city: field('Zurich'),
        billingCity: field('Madrid'),
      },
      [sameCity],
    );
    formGroup.billingCity.set('Zurich');
    expect(formGroup.api.errors()).toBeNull();
    expect(formGroup.api.valid()).toBe(true);
  });

  it('is invalid when a child is invalid, even without own errors', () => {
    const required = (value: string) => (value === '' ? { required: true } : null);
    const formGroup = form({ city: field('', [required]) });
    expect(formGroup.api.errors()).toBeNull();
    expect(formGroup.api.valid()).toBe(false);
    expect(formGroup.api.invalid()).toBe(true);
  });

  it('is invalid when a grandchild is invalid', () => {
    const required = (value: string) => (value === '' ? { required: true } : null);
    const formGroup = form({
      address: form({ city: field('', [required]) }),
    });
    expect(formGroup.address.api.valid()).toBe(false);
    expect(formGroup.api.valid()).toBe(false);
  });

  it('becomes valid once the failing child is fixed', () => {
    const required = (value: string) => (value === '' ? { required: true } : null);
    const formGroup = form({ city: field('', [required]) });
    formGroup.city.set('Zurich');
    expect(formGroup.api.valid()).toBe(true);
  });

  it('recomputes its errors after setValidators', () => {
    const sameCity = (value: { city: string; billingCity: string }) =>
      value.city === value.billingCity ? null : { sameCity: true };
    const formGroup = form(
      {
        city: field('Zurich'),
        billingCity: field('Madrid'),
      },
      [sameCity],
    );
    expect(formGroup.api.valid()).toBe(false);
    formGroup.api.setValidators([]);
    expect(formGroup.api.errors()).toBeNull();
    expect(formGroup.api.valid()).toBe(true);
  });

  it('adds validators to a form declared without them', () => {
    const formGroup = form({
      city: field('Zurich'),
      billingCity: field('Madrid'),
    });
    expect(formGroup.api.valid()).toBe(true);
    formGroup.api.setValidators([
      value => (value.city === value.billingCity ? null : { sameCity: true }),
    ]);
    expect(formGroup.api.errors()).toEqual({ sameCity: true });
    expect(formGroup.api.valid()).toBe(false);
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
    const sameCity = (value: { city: string; billingCity: string }) =>
      value.city === value.billingCity ? null : { sameCity: true };
    const formGroup = form(
      {
        city: field('Zurich'),
        billingCity: field('Zurich'),
      },
      [sameCity],
    );
    expect(formGroup.api.valid()).toBe(true);
    formGroup.api.reset({ city: 'Zurich', billingCity: 'Madrid' });
    expect(formGroup.api.errors()).toEqual({ sameCity: true });
  });

  it('starts enabled', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    expect(formGroup.api.disabled()).toBe(false);
    expect(formGroup.api.enabled()).toBe(true);
  });

  it('ignores a disabled child when computing validity', () => {
    const required = (value: string) => (value === '' ? { required: true } : null);
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
    expect(formGroup.name.dirty()).toBe(true);
    expect(formGroup.api.touched()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
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

  it('keeps every value after disabling the form', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.disable();
    expect(formGroup.api.value()).toEqual({ name: 'David', address: { city: 'Zurich' } });
  });

  it('is only disabled when every child is disabled', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.disable();
    expect(formGroup.api.disabled()).toBe(false);
    formGroup.age.disable();
    expect(formGroup.api.disabled()).toBe(true);
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

  it('reports an empty form as disabled', () => {
    const formGroup = form({});
    expect(formGroup.api.disabled()).toBe(true);
  });
});
