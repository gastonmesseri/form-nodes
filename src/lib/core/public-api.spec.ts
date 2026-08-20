import { signal } from '@angular/core';
import { describe, expectTypeOf, it } from 'vitest';

import { form } from './primitives/form';
import { field } from './primitives/field';
import type { ValidationErrors } from './validation/validation.type';

describe('types', () => {
  it('infers the value of each field', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
      address: form({ city: field('Zurich') }),
    });
    expectTypeOf(formGroup.age()).toEqualTypeOf<number>();
    expectTypeOf(formGroup.name.value()).toEqualTypeOf<string>();
    expectTypeOf(formGroup.address.city()).toEqualTypeOf<string>();
    expectTypeOf(formGroup.api.value()).toEqualTypeOf<{
      name: string;
      age: number;
      address: { city: string };
    }>();
  });

  it('infers shorthand nested forms', () => {
    const formGroup = form({
      name: field('David'),
      address: {
        city: field('Moscow'),
        location: {
          latitude: field(55.7558),
        },
      },
    });
    expectTypeOf(formGroup.address.city()).toEqualTypeOf<string>();
    expectTypeOf(formGroup.address.location.latitude()).toEqualTypeOf<number>();
    expectTypeOf(formGroup.api.value()).toEqualTypeOf<{
      name: string;
      address: { city: string; location: { latitude: number } };
    }>();
    expectTypeOf(formGroup.api.patch).toBeCallableWith({
      address: { location: { latitude: 47.3769 } },
    });
  });

  it('types errors as a wide error object', () => {
    const required = (value: string) => (value === '' ? { required: true } : null);
    const fieldNode = field('', [required]);
    expectTypeOf(fieldNode.errors()).toEqualTypeOf<ValidationErrors | null>();
  });

  it('types form errors as a wide error object', () => {
    const formGroup = form({ age: field(23) });
    expectTypeOf(formGroup.api.errors()).toEqualTypeOf<ValidationErrors | null>();
  });

  it('accepts validators on a field declared without them', () => {
    const required = (value: string) => (value === '' ? { required: true } : null);
    const fieldNode = field('David');
    expectTypeOf(fieldNode.setValidators).toBeCallableWith([required]);
  });

  it('types validators inside field options', () => {
    field('David', {
      validators: [value => {
        expectTypeOf(value).toEqualTypeOf<string>();
        return null;
      }],
      disabled: false,
    });
  });

  it('types the value a form validator receives', () => {
    const formGroup = form({
      city: field('Zurich'),
      age: field(23),
    });
    formGroup.api.setValidators([
      value => {
        expectTypeOf(value).toEqualTypeOf<{ city: string; age: number }>();
        return null;
      },
    ]);
  });

  it('types validators inside form options', () => {
    form(
      { city: field('Moscow'), age: field(23) },
      {
        validators: [value => {
          expectTypeOf(value).toEqualTypeOf<{ city: string; age: number }>();
          return null;
        }],
        readonly: false,
      },
    );
  });

  it('rejects a third argument after second-argument options', () => {
    // @ts-expect-error options must be passed either as the second or third argument
    field('David', { disabled: true }, { hidden: true });
    // @ts-expect-error options must be passed either as the second or third argument
    form({ name: field('David') }, { disabled: true }, { hidden: true });
  });

  it('requires every key on set but not on patch', () => {
    const formGroup = form({
      age: field(23),
      city: field('Zurich'),
    });
    // @ts-expect-error 'city' is missing
    expectTypeOf(formGroup.api.set).toBeCallableWith({ age: 30 });
    expectTypeOf(formGroup.api.patch).toBeCallableWith({ age: 30 });
  });

  it('rejects wrong types and unknown keys', () => {
    const formGroup = form({ age: field(23) });
    // @ts-expect-error 'age' is a number
    expectTypeOf(formGroup.api.set).toBeCallableWith({ age: '30' });
    // @ts-expect-error 'nope' does not exist
    expectTypeOf(formGroup.api.patch).toBeCallableWith({ nope: 1 });
  });

  it('rejects a field named api', () => {
    // @ts-expect-error 'api' is a reserved key
    expectTypeOf(form).toBeCallableWith({ api: field(1) });
  });

  it('does not expose patch on the field root', () => {
    const fieldNode = field('David');
    // @ts-expect-error patch lives on api only
    expectTypeOf(fieldNode.patch).toBeCallableWith('Ana');
  });

  it('requires every key on reset when a value is passed', () => {
    const formGroup = form({
      age: field(23),
      city: field('Zurich'),
    });
    expectTypeOf(formGroup.api.reset).toBeCallableWith();
    expectTypeOf(formGroup.api.reset).toBeCallableWith({ age: 30, city: 'Madrid' });
    // @ts-expect-error 'city' is missing
    expectTypeOf(formGroup.api.reset).toBeCallableWith({ age: 30 });
  });

  it('types the value a field reset accepts', () => {
    const fieldNode = field(23);
    expectTypeOf(fieldNode.reset).toBeCallableWith();
    expectTypeOf(fieldNode.reset).toBeCallableWith(30);
    // @ts-expect-error the field holds a number
    expectTypeOf(fieldNode.reset).toBeCallableWith('30');
  });

  it('accepts initial disabled options', () => {
    expectTypeOf(field).toBeCallableWith('David', undefined, { disabled: true });
    form(
      { name: field('David') },
      undefined,
      { disabled: true },
    );
  });

  it('accepts initial readonly options', () => {
    expectTypeOf(field).toBeCallableWith('David', undefined, { readonly: true });
    form(
      { name: field('David') },
      undefined,
      { readonly: true },
    );
  });

  it('accepts initial hidden options', () => {
    expectTypeOf(field).toBeCallableWith('David', undefined, { hidden: true });
    form(
      { name: field('David') },
      undefined,
      { hidden: true },
    );
  });

  it('accepts signals and functions as state sources', () => {
    const state = signal(false);
    expectTypeOf(field).toBeCallableWith('David', undefined, {
      disabled: state,
      readonly: () => state(),
      hidden: () => false,
    });
  });

  it('allows typed state functions to reference their containing form', () => {
    const formGroup = form({
      age: field(17),
      guardian: field('', undefined, {
        hidden: (): boolean => formGroup.age() >= 18,
      }),
    });
    expectTypeOf(formGroup.guardian.hidden()).toEqualTypeOf<boolean>();
  });
});
