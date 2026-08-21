import { signal } from '@angular/core';
import { describe, expectTypeOf, it } from 'vitest';

import { form } from './primitives/form';
import { field } from './primitives/field';
import { required } from './validation/validators/required';
import type { FieldContext, ValidationError } from './validation/validation.type';

describe('types', () => {
  it('infers the value of each field', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
      address: form({ city: field('Zurich') }),
    });
    expectTypeOf(formGroup.age()).toEqualTypeOf<number | null>();
    expectTypeOf(formGroup.name.value()).toEqualTypeOf<string | null>();
    expectTypeOf(formGroup.address.city()).toEqualTypeOf<string | null>();
    expectTypeOf(formGroup.api.value()).toEqualTypeOf<{
      name: string | null;
      age: number | null;
      address: { city: string | null };
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
    expectTypeOf(formGroup.address.city()).toEqualTypeOf<string | null>();
    expectTypeOf(formGroup.address.location.latitude()).toEqualTypeOf<number | null>();
    expectTypeOf(formGroup.api.value()).toEqualTypeOf<{
      name: string | null;
      address: { city: string | null; location: { latitude: number | null } };
    }>();
    expectTypeOf(formGroup.api.patch).toBeCallableWith({
      address: { location: { latitude: 47.3769 } },
    });
  });

  it('types field errors as a readonly error array', () => {
    const required = ({ value }: FieldContext<string>) =>
      value() === '' ? { kind: 'required' } : null;
    const fieldNode = field('', [required], { nullable: false });
    expectTypeOf(fieldNode.errors()).toEqualTypeOf<readonly ValidationError[]>();
  });

  it('types form errors as a readonly error array', () => {
    const formGroup = form({ age: field(23) });
    expectTypeOf(formGroup.api.errors()).toEqualTypeOf<readonly ValidationError[]>();
  });

  it('accepts validators on a field declared without them', () => {
    const required = ({ value }: FieldContext<string>) =>
      value() === '' ? { kind: 'required' } : null;
    const fieldNode = field('David', { nullable: false });
    expectTypeOf(fieldNode.setValidators).toBeCallableWith([required]);
  });

  it('types validators inside field options', () => {
    field('David', {
      validators: [context => {
        expectTypeOf(context).toEqualTypeOf<FieldContext<string>>();
        expectTypeOf(context.value()).toEqualTypeOf<string>();
        return null;
      }],
      nullable: false,
      disabled: false,
    });
  });

  it('types the context a form validator receives', () => {
    const formGroup = form({
      city: field('Zurich'),
      age: field(23),
    });
    formGroup.api.setValidators([
      context => {
        expectTypeOf(context.value()).toEqualTypeOf<{
          city: string | null;
          age: number | null;
        }>();
        return null;
      },
    ]);
  });

  it('types validators inside form options', () => {
    form(
      { city: field('Moscow'), age: field(23) },
      {
        validators: [context => {
          expectTypeOf(context.value()).toEqualTypeOf<{
            city: string | null;
            age: number | null;
          }>();
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

  it('includes null in field values by default', () => {
    const fieldNode = field<string>(null, []);
    expectTypeOf(fieldNode()).toEqualTypeOf<string | null>();
    expectTypeOf(fieldNode.set).toBeCallableWith(null);
    expectTypeOf(fieldNode.reset).toBeCallableWith(null);
  });

  it('rejects a direct string as required configuration', () => {
    if (false) {
      // @ts-expect-error required messages must use the options object
      field('David', [required('Name is required')]);
    }
  });

  it('removes null from the field type when nullable is false', () => {
    const fieldNode = field('David', { nullable: false });
    expectTypeOf(fieldNode()).toEqualTypeOf<string>();
    expectTypeOf(fieldNode.set).toBeCallableWith('Ana');
    // @ts-expect-error a non-nullable field cannot be set to null
    expectTypeOf(fieldNode.set).toBeCallableWith(null);
    // @ts-expect-error a non-nullable field cannot be initialized with null
    field<string>(null, { nullable: false });
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
      age: field(17, { nullable: false }),
      guardian: field('', undefined, {
        hidden: (): boolean => formGroup.age() >= 18,
      }),
    });
    expectTypeOf(formGroup.guardian.hidden()).toEqualTypeOf<boolean>();
  });
});
