import moment from 'moment';
import { describe, expect, it, vi } from 'vitest';
import { Injector, signal, type Signal } from '@angular/core';

import { form } from './form';
import { field } from './field';
import { array } from './array';
import { group } from './group';
import { createFormPrimitives } from './create-form-primitives';
import { validator } from '../validation/validator';
import type { InternalNode, Node, NodeType } from '../types/node.type';
import { oneOf } from '../validation/validators/one-of';
import { equalTo } from '../validation/validators/equal-to';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';
import { requiredIf } from '../validation/validators/required-if';
import { uniqueItems } from '../validation/validators/unique-items';
import { between } from '../validation/validators/between';
import { dateBetween } from '../validation/validators/date-between';

type Context<TValue> = { readonly value: Signal<TValue> };

const nodeTypeOf = (node: Node): NodeType => {
  return node.$api.nodeType();
};

describe('form', () => {
  it('creates shorthand descendants with configured field defaults', () => {
    const { form: configuredForm } = createFormPrimitives({ nullable: false });
    const explicit = field('existing');
    const birthday = new Date('1990-06-15T00:00:00.000Z');
    const profile = configuredForm({
      name: '',
      birthday,
      roles: ['admin'],
      explicit,
      address: { city: '' },
    });

    expect(profile()).toEqual({
      name: '',
      birthday,
      roles: ['admin'],
      explicit: 'existing',
      address: { city: '' },
    });
    expect(profile.name.nodeType()).toBe('field');
    expect(profile.address.nodeType()).toBe('group');
  });

  it('keeps configured defaults for dynamically added shorthand descendants', () => {
    const { form: configuredForm } = createFormPrimitives({ nullable: false });
    const profile = configuredForm({ name: '' });

    const added = profile.add({ nickname: '', address: { city: '' } });

    expect(added.nickname()).toBe('');
    expect(added.address.city()).toBe('');
  });

  it('exposes its public node type', () => {
    const profile = form({ name: field('') });

    expect(profile.nodeType()).toBe('form');
    expect(profile.$api.nodeType()).toBe('form');
  });

  it('normalizes concise values to fields and plain objects to groups', () => {
    const birthday = new Date('1990-06-15T00:00:00.000Z');
    const profile = form({
      name: '',
      age: null,
      siblings: 2,
      birthday,
      sister: undefined,
      address: {
        city: 'Zurich',
      },
    });

    expect(profile()).toEqual({
      name: '',
      age: null,
      siblings: 2,
      birthday,
      sister: null,
      address: { city: 'Zurich' },
    });
    profile.name.set('Marco');
    profile.address.city.set('Bern');

    expect(profile.name()).toBe('Marco');
    expect(profile.address.city()).toBe('Bern');
  });

  it('normalizes every supported atomic shorthand category consistently', () => {
    const uniqueValue = Symbol('value');
    const calculate = (value: number) => value * 2;
    const createdAt = new Date('2026-09-03T00:00:00.000Z');
    const roles = ['admin'];
    const values = form({
      text: 'draft',
      count: 1,
      enabled: false,
      largeCount: 1n,
      uniqueValue,
      empty: null,
      missing: undefined,
      createdAt,
      calculate,
      roles,
    });

    expect(values()).toEqual({
      text: 'draft',
      count: 1,
      enabled: false,
      largeCount: 1n,
      uniqueValue,
      empty: null,
      missing: null,
      createdAt,
      calculate,
      roles,
    });
    expect([
      values.text,
      values.count,
      values.enabled,
      values.largeCount,
      values.uniqueValue,
      values.empty,
      values.missing,
      values.createdAt,
      values.calculate,
      values.roles,
    ].map(nodeTypeOf)).toEqual(Array.from({ length: 10 }, () => 'field'));
    expect(values.roles()).toBe(roles);
  });

  it('normalizes a real Moment instance to a field and preserves its identity', () => {
    const appointment = moment('2026-09-03T14:30:00Z');
    const booking = form({ appointment });

    expect(nodeTypeOf(booking.appointment)).toBe('field');
    expect(booking.appointment()).toBe(appointment);
    expect(booking.appointment()?.toISOString()).toBe('2026-09-03T14:30:00.000Z');
  });

  it('normalizes empty, populated, tuple, and nested array values to fields', () => {
    const coordinates = [47.37, 8.54] as const;
    const companies = [{ companyId: 23, companyName: 'Apple' }];
    const values = form({ empty: [], roles: ['admin'], coordinates, matrix: [[1, 2], [3, 4]], companies });

    expect(values()).toEqual({ empty: [], roles: ['admin'], coordinates, matrix: [[1, 2], [3, 4]], companies });
    expect([values.empty, values.roles, values.coordinates, values.matrix, values.companies].map(nodeTypeOf))
      .toEqual(['field', 'field', 'field', 'field', 'field']);
    expect(values.coordinates()).toBe(coordinates);
    expect(values.companies()).toBe(companies);
  });

  it('preserves special atomic shorthand values at every nested depth', () => {
    const invalidDate = new Date(Number.NaN);
    const marker = Symbol('marker');
    const values = form({
      emptyText: '',
      disabledFlag: false,
      notANumber: Number.NaN,
      positiveInfinity: Number.POSITIVE_INFINITY,
      negativeInfinity: Number.NEGATIVE_INFINITY,
      negativeZero: -0,
      largeCount: 1n,
      marker,
      invalidDate,
      empty: null,
      missing: undefined,
      nested: {
        invalidDate,
        negativeZero: -0,
      },
    });

    expect(values.emptyText()).toBe('');
    expect(values.disabledFlag()).toBe(false);
    expect(values.notANumber()).toBeNaN();
    expect(values.positiveInfinity()).toBe(Number.POSITIVE_INFINITY);
    expect(values.negativeInfinity()).toBe(Number.NEGATIVE_INFINITY);
    expect(Object.is(values.negativeZero(), -0)).toBe(true);
    expect(values.largeCount()).toBe(1n);
    expect(values.marker()).toBe(marker);
    expect(values.invalidDate()).toBe(invalidDate);
    expect(values.empty()).toBeNull();
    expect(values.missing()).toBeNull();
    expect(values.nested.invalidDate()).toBe(invalidDate);
    expect(Object.is(values.nested.negativeZero(), -0)).toBe(true);
  });

  it('validates structural declaration surfaces without evaluating accessors', () => {
    const read = vi.fn(() => 'unsafe');
    const accessorDefinition = {
      profile: Object.defineProperty({}, 'name', { enumerable: true, get: read }),
    };
    const nonIdentifierAccessorDefinition = {
      profile: Object.defineProperty({}, 'postal-code', { enumerable: true, get: read }),
    };
    const symbolKey = Symbol('secret');
    const symbolDefinition = { [symbolKey]: field('hidden') };
    const prototypeDefinition = Object.fromEntries([['__proto__', field('unsafe')]]);

    expect(() => form(accessorDefinition as never)).toThrow(
      'form: accessor shorthand is not supported at "profile.name"; declare a data property with an explicit node or, if this object is intended as a field value, wrap it with field(value)',
    );
    expect(read).not.toHaveBeenCalled();
    expect(() => form(nonIdentifierAccessorDefinition as never)).toThrow(
      'form: accessor shorthand is not supported at "profile[\\"postal-code\\"]"; declare a data property with an explicit node or, if this object is intended as a field value, wrap it with field(value)',
    );
    expect(read).not.toHaveBeenCalled();
    expect(() => form(symbolDefinition as never)).toThrow(
      'form: symbol child key Symbol(secret) is not supported; use a string key, or if this object is intended as a field value, wrap it with field(value)',
    );
    expect(() => form(prototypeDefinition as never)).toThrow(
      'form: unsafe child key "__proto__" is not supported at "__proto__"; if this object is intended as a field value, wrap it with field(value)',
    );
    const nestedArray = form({ profile: { 'postal-code': ['8000'] } });
    expect(nestedArray.profile['postal-code'].nodeType()).toBe('field');
  });

  it('uses only own enumerable properties from a declaration', () => {
    const inherited = { inherited: field('ignored') };
    const own = field('included');
    const definitions = Object.create(inherited) as { own: typeof own; inherited?: typeof own };
    definitions.own = own;
    Object.defineProperty(definitions, 'hidden', { enumerable: false, value: field('ignored') });

    const values = form(definitions);

    expect(values()).toEqual({ own: 'included' });
    expect(values.children['inherited']).toBeUndefined();
    expect(values.children['hidden']).toBeUndefined();
  });

  it('makes an implicit field behaviorally equivalent to field(value)', () => {
    const profile = form({ implicit: '', explicit: field('') });

    expect(profile.implicit.nodeType()).toBe('field');
    expect(profile.implicit.parent()).toBe(profile);
    expect(profile.explicit.parent()).toBe(profile);
    expect(profile.implicit.form()).toBe(profile);
    expect(profile.implicit.path()).toEqual(['implicit']);
    expect(profile.explicit.path()).toEqual(['explicit']);

    profile.implicit.setValidators(required);
    profile.explicit.setValidators(required);
    expect(profile.implicit.errors().map(({ kind, message }) => ({ kind, message }))).toEqual(
      profile.explicit.errors().map(({ kind, message }) => ({ kind, message })),
    );

    profile.set({ implicit: 'set', explicit: 'set' });
    expect(profile.implicit()).toBe(profile.explicit());
    profile.patch({ implicit: 'patched', explicit: 'patched' });
    expect(profile.implicit()).toBe(profile.explicit());

    profile.implicit.markAsTouched();
    profile.explicit.markAsTouched();
    profile.implicit.markAsDirty();
    profile.explicit.markAsDirty();
    profile.reset({ implicit: 'reset', explicit: 'reset' });

    expect(profile.implicit()).toBe(profile.explicit());
    expect(profile.implicit.touched()).toBe(profile.explicit.touched());
    expect(profile.implicit.dirty()).toBe(profile.explicit.dirty());
    expect(profile.implicit.errors().map(({ kind, message }) => ({ kind, message }))).toEqual(
      profile.explicit.errors().map(({ kind, message }) => ({ kind, message })),
    );
  });

  it('propagates availability and injector ownership equally to implicit and explicit fields', async () => {
    const dependency = signal(0);
    const implicitValidator = vi.fn(async () => {
      dependency();
      return null;
    });
    const explicitValidator = vi.fn(async () => {
      dependency();
      return null;
    });
    const injector = Injector.create({ providers: [] });
    const unavailable = form({ implicit: '', explicit: field('') }, {
      disabled: true,
      readonly: true,
    });

    expect(unavailable.implicit.disabled()).toBe(true);
    expect(unavailable.explicit.disabled()).toBe(true);
    expect(unavailable.implicit.readonly()).toBe(true);
    expect(unavailable.explicit.readonly()).toBe(true);

    const profile = form({ implicit: '', explicit: field('') }, { injector });
    profile.implicit.setValidators(asyncValidator(implicitValidator));
    profile.explicit.setValidators(asyncValidator(explicitValidator));

    expect(profile.implicit.pending()).toBe(true);
    expect(profile.explicit.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(implicitValidator).toHaveBeenCalledOnce();
    expect(explicitValidator).toHaveBeenCalledOnce();

    injector.destroy();
    dependency.set(1);
    await Promise.resolve();
    await Promise.resolve();
    expect(implicitValidator).toHaveBeenCalledOnce();
    expect(explicitValidator).toHaveBeenCalledOnce();
  });

  it.each([
    new RegExp('forms'),
    new URL('https://example.com'),
    new Map([['name', 'Marco']]),
    new Set(['admin']),
    new Uint8Array([1, 2]),
    new (class {})(),
    new (class Account { name = 'Marco'; })(),
    () => 'computed',
  ])('normalizes non-plain objects and functions to fields', (value) => {
    const concise = form({ value });
    expect(nodeTypeOf(concise.value)).toBe('field');
    expect(concise.value()).toBe(value);
  });

  it('accepts null-prototype objects as structural group shorthand', () => {
    const address = Object.assign(Object.create(null), { city: 'Zurich' }) as { city: string };
    const profile = form({ address });

    expect(nodeTypeOf(profile.address)).toBe('group');
    expect(profile.address.city()).toBe('Zurich');
    expect(profile()).toEqual({ address: { city: 'Zurich' } });
  });

  it('normalizes inline and pretyped plain objects to equivalent groups', () => {
    type Company = { companyId: number; companyName: string };
    const defaultCompany: Company = { companyId: 23, companyName: 'Apple' };
    const profile = form({
      inlineCompany: { companyId: 7, companyName: 'Google' },
      company: defaultCompany,
    });

    expect(profile()).toEqual({
      inlineCompany: { companyId: 7, companyName: 'Google' },
      company: { companyId: 23, companyName: 'Apple' },
    });
    expect(nodeTypeOf(profile.inlineCompany)).toBe('group');
    expect(nodeTypeOf(profile.company)).toBe('group');
    expect(profile.inlineCompany.companyName()).toBe('Google');
    expect(profile.company.companyName()).toBe('Apple');
  });

  it('normalizes an inline company object to a group and a class instance to a field', () => {
    class User {}
    const user = new User();
    const myForm = form({
      company: { companyId: 23, companyName: 'Apple' },
      user,
    });

    expect(myForm.company.nodeType()).toBe('group');
    expect(myForm.company()).toEqual({ companyId: 23, companyName: 'Apple' });
    expect(myForm.user.nodeType()).toBe('field');
    expect(myForm.user()).toBe(user);
  });

  it('uses the runtime prototype when a structural annotation hides a class instance', () => {
    type Company = { companyId: number; companyName: string };
    class CompanyModel implements Company {
      companyId = 23;
      companyName = 'Apple';
    }
    const company: Company = new CompanyModel();

    const profile = form({ company });
    expect(profile.company()).toBe(company);
    expect(profile.company.nodeType()).toBe('field');
  });

  it('preserves every explicit node definition without wrapping it', () => {
    const explicitField = field('Marco');
    const explicitGroup = group({ city: field('Zurich') });
    const explicitForm = form({ step: field(1) });
    const explicitArray = array(field(''));
    const root = form({ explicitField, explicitGroup, explicitForm, explicitArray });

    expect(root.explicitField).toBe(explicitField);
    expect(root.explicitGroup).toBe(explicitGroup);
    expect(root.explicitForm).toBe(explicitForm);
    expect(root.explicitArray).toBe(explicitArray);
    expect([
      nodeTypeOf(root.explicitField),
      nodeTypeOf(root.explicitGroup),
      nodeTypeOf(root.explicitForm),
      nodeTypeOf(root.explicitArray),
    ]).toEqual(['field', 'group', 'form', 'array']);
  });

  it('aggregates between errors from nested numeric fields', () => {
    const reservation = form({ guests: field(11, [between(1, 10)]) });

    expect(reservation.invalid()).toBe(true);
    expect(reservation.errors()).toEqual([]);
    expect(reservation.allErrors()).toContainEqual(expect.objectContaining({
      kind: 'between',
      min: 1,
      max: 10,
      actual: 11,
      targetNode: reservation.guests,
    }));
    reservation.guests.set(10);
    expect(reservation.valid()).toBe(true);
  });

  it('aggregates dateBetween errors from nested date fields', () => {
    const booking = form({
      departure: field<Date>(new Date('2027-01-01'), [dateBetween('2026-01-01', '2026-12-31')]),
    });

    expect(booking.invalid()).toBe(true);
    expect(booking.allErrors()).toContainEqual(expect.objectContaining({
      kind: 'dateBetween',
      minDate: new Date('2026-01-01T00:00:00.000Z'),
      maxDate: new Date('2026-12-31T00:00:00.000Z'),
      actual: new Date('2027-01-01T00:00:00.000Z'),
      targetNode: booking.departure,
    }));
    booking.departure.set(new Date('2026-06-01'));
    expect(booking.valid()).toBe(true);
  });

  it('reactively validates a field against a sibling without exposing either value', () => {
    const password = field('secret');
    const profile = form({
      password,
      confirmation: field('different', [equalTo(() => password())]),
    });

    expect(profile.confirmation.errors()).toEqual([{
      kind: 'equalTo',
      message: 'Please enter the matching value.',
      targetNode: profile.confirmation,
    }]);
    expect(profile.confirmation.errors()[0]).not.toHaveProperty('actual');
    expect(profile.confirmation.errors()[0]).not.toHaveProperty('expected');

    profile.confirmation.set('secret');
    expect(profile.confirmation.errors()).toEqual([]);

    profile.password.set('changed');
    expect(profile.confirmation.getError('equalTo')?.message).toBe('Please enter the matching value.');
  });

  it('submits valid forms, exposes submitting state through the tree, and prevents concurrent submissions', async () => {
    let resolve!: () => void;
    const pendingAction = new Promise<void>((done) => { resolve = done; });
    const action = vi.fn(() => pendingAction);
    const profile = form({ name: field('Marco'), details: form({ age: field(42) }) }, { submission: { action } });

    const first = profile.submit();

    expect(profile.submitting()).toBe(true);
    expect(profile.name.submitting()).toBe(true);
    expect(profile.details.submitting()).toBe(true);
    expect(profile.touched()).toBe(true);
    expect(profile.name.touched()).toBe(true);
    expect(action).toHaveBeenCalledWith(profile, { name: 'Marco', details: { age: 42 } });
    expect(await profile.submit()).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);

    resolve();
    expect(await first).toBe(true);
    expect(profile.submitting()).toBe(false);
    expect(profile.name.submitting()).toBe(false);
    expect(profile.details.submitting()).toBe(false);
  });

  it('blocks invalid submissions by default and supports validation override options', async () => {
    const action = vi.fn();
    const onInvalid = vi.fn();
    const blocked = form({ name: field('', [required]) }, { submission: { action, onInvalid } });

    expect(await blocked.submit()).toBe(false);
    expect(action).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledWith(blocked);
    expect(blocked.name.touched()).toBe(true);

    const forced = form({ name: field('', [required]) }, {
      submission: { action, ignoreValidators: 'all' },
    });
    expect(await forced.submit()).toBe(true);
    expect(action).toHaveBeenCalledWith(forced, { name: '' });
  });

  it('allows pending validation by default and can require fully valid state', async () => {
    const action = vi.fn();
    const unresolved = new Promise<null>(() => {});
    const allowingPending = form({
      name: field('Marco', [asyncValidator(() => unresolved)]),
    }, { submission: { action } });
    const requiringValid = form({
      name: field('Marco', [asyncValidator(() => unresolved)]),
    }, { submission: { action, ignoreValidators: 'none' } });

    expect(allowingPending.pending()).toBe(true);
    expect(await allowingPending.submit()).toBe(true);
    expect(await requiringValid.submit()).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('tolerates submission without an action and always clears submitting after rejection', async () => {
    const withoutSubmission = form({ name: field('Marco') });
    expect(await withoutSubmission.submit()).toBe(false);
    expect(withoutSubmission.touched()).toBe(true);
    expect(withoutSubmission.name.touched()).toBe(true);

    const failure = new Error('submit failed');
    const profile = form({ name: field('Marco') }, {
      submission: { action: () => Promise.reject(failure) },
    });
    await expect(profile.submit()).rejects.toBe(failure);
    expect(profile.submitting()).toBe(false);
  });

  it('aggregates a dynamic array child through the public form api', () => {
    const profile = form({
      name: field('Marco'),
      sons: array(() => ({ name: field(''), age: field(23) }), [{ name: 'Mono', age: 11 }]),
    });

    expect(profile()).toEqual({ name: 'Marco', sons: [{ name: 'Mono', age: 11 }] });
    profile.sons.push({ name: 'Lia', age: 7 });
    expect(profile()).toEqual({
      name: 'Marco',
      sons: [{ name: 'Mono', age: 11 }, { name: 'Lia', age: 7 }],
    });
    expect(profile.dirty()).toBe(false);
  });

  it('aggregates a unique-items error owned by a nested array', () => {
    const profile = form({
      names: array(field(''), ['Marco', 'Marco'], [uniqueItems()]),
    });

    expect(profile.invalid()).toBe(true);
    expect(profile.errors()).toEqual([]);
    expect(profile.allErrors()).toMatchObject([{
      kind: 'uniqueItems',
      duplicateIndexes: [0, 1],
      targetNode: profile.names,
    }]);

    profile.names[1]!.set('Lia');
    expect(profile.valid()).toBe(true);
  });

  it('grows an array child through form.set and propagates the complete value', () => {
    const factory = vi.fn(() => ({ name: field(''), age: field(0) }));
    const profile = form({
      owner: field('Marco'),
      sons: array(factory, [{ name: 'son1', age: 11 }]),
    });
    const first = profile.sons[0]!;

    profile.set({
      owner: 'Marcos',
      sons: [{ name: 'son1 updated', age: 12 }, { name: 'son2', age: 15 }],
    });

    expect(profile()).toEqual({
      owner: 'Marcos',
      sons: [{ name: 'son1 updated', age: 12 }, { name: 'son2', age: 15 }],
    });
    expect(profile.value()).toEqual(profile());
    expect(profile.sons.length()).toBe(2);
    expect(profile.sons[0]).toBe(first);
    expect(profile.sons[1]!.parent()).toBe(profile.sons);
    expect(profile.sons[1]!.path()).toEqual(['sons', '1']);
    expect(profile.sons[1]!.name.path()).toEqual(['sons', '1', 'name']);
    expect(profile.sons[1]!.form()).toBe(profile);
    expect(factory).toHaveBeenCalledTimes(2);
    expect(profile.dirty()).toBe(false);
  });

  it('normalizes a null array branch passed through form.set', () => {
    const profile = form({ sons: array(field(''), ['Marco']) });
    const first = profile.sons[0]!;

    profile.set({ sons: null });

    expect(profile()).toEqual({ sons: [] });
    expect(profile.sons.length()).toBe(0);
    expect(first.parent()).toBeNull();
  });

  it('shrinks and empties an array child through form.set while detaching removed nodes', () => {
    const profile = form({
      sons: array(
        { name: field(''), age: field(0) },
        [{ name: 'son1', age: 11 }, { name: 'son2', age: 15 }, { name: 'son3', age: 18 }],
      ),
    });
    const first = profile.sons[0]!;
    const second = profile.sons[1]!;
    const third = profile.sons[2]!;

    profile.set({ sons: [{ name: 'only son', age: 12 }] });

    expect(profile()).toEqual({ sons: [{ name: 'only son', age: 12 }] });
    expect(profile.sons.length()).toBe(1);
    expect(profile.sons[0]).toBe(first);
    expect(second.parent()).toBeNull();
    expect(second.path()).toEqual([]);
    expect(third.parent()).toBeNull();
    expect(third.path()).toEqual([]);

    profile.set({ sons: [] });

    expect(profile()).toEqual({ sons: [] });
    expect(profile.sons.length()).toBe(0);
    expect(profile.sons[0]).toBeUndefined();
    expect(first.parent()).toBeNull();
    expect(first.path()).toEqual([]);
  });

  it('can regrow an array child through form.set after it was emptied', () => {
    const profile = form({ sons: array({ name: field(''), age: field(0) }) });

    profile.set({ sons: [] });
    profile.set({ sons: [{ name: 'son1', age: 11 }, { name: 'son2', age: 15 }] });

    expect(profile()).toEqual({
      sons: [{ name: 'son1', age: 11 }, { name: 'son2', age: 15 }],
    });
    expect(profile.sons[0]!.path()).toEqual(['sons', '0']);
    expect(profile.sons[1]!.path()).toEqual(['sons', '1']);
    expect(profile.sons.every(son => son.parent() === profile.sons)).toBe(true);
  });

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

  it('gives a child named api precedence while preserving $api', () => {
    const apiField = field('child api');
    const profile = form({ api: apiField, age: field(23) });

    expect(profile.api).toBe(apiField);
    expect(profile.api()).toBe('child api');
    expect(profile.$api.children.api).toBe(apiField);
    expect(profile.$api.value()).toEqual({ api: 'child api', age: 23 });

    profile.$api.patch({ api: 'updated' });
    expect(profile()).toEqual({ api: 'updated', age: 23 });
  });

  it('gives the real $api runtime precedence over illegally declared children', () => {
    const illegalRootField = field('root child');
    const illegalNestedField = field('nested child');
    const profile = form({
      $api: illegalRootField,
      nested: { $api: illegalNestedField },
    } as any) as any;

    expect(profile.$api).not.toBe(illegalRootField);
    expect(profile.$api.value()).toEqual({
      $api: 'root child',
      nested: { $api: 'nested child' },
    });
    expect(profile.$api.children.$api).toBe(illegalRootField);

    expect(profile.nested.$api).not.toBe(illegalNestedField);
    expect(profile.nested.$api.value()).toEqual({ $api: 'nested child' });
    expect(profile.nested.$api.children.$api).toBe(illegalNestedField);
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
      constructor: field('constructor'),
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
    expect(formGroup.constructor).toBe(controls.constructor);
    expect(formGroup.length).toBe(controls.length);
    expect(formGroup.name).toBe(controls.name);
    expect(formGroup.prototype).toBe(controls.prototype);
    expect(formGroup.toString).toBe(controls.toString);
    expect(formGroup.apply()).toBe('apply');
    expect(formGroup.arguments()).toBe('arguments');
    expect(formGroup.constructor()).toBe('constructor');
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
    expect(profile.keyInParent()).toBeNull();
    expect(profile.name.keyInParent()).toBe('name');
    expect(profile.address.keyInParent()).toBe('address');
    expect(profile.address.city.keyInParent()).toBe('city');
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
        city: field('Zurich', [(context) => {
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
    const profile = form({ name: field('David') }, [(context) => {
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

  it('aggregates only committed values while a nested control update is debouncing', async () => {
    vi.useFakeTimers();
    try {
      const validate = vi.fn(({ value }: Context<{ address: { city: string | null } }>) => {
        value();
        return null;
      });
      const profile = form(
        { address: { city: field('Zurich', { debounce: 100 }) } },
        { validators: [validate] },
      );

      expect(profile.errors()).toEqual([]);
      expect(validate).toHaveBeenCalledOnce();

      profile.address.city.setControlValue('Bern');

      expect(profile.address.city.controlValue()).toBe('Bern');
      expect(profile.address.city.value()).toBe('Zurich');
      expect(profile.address.value()).toEqual({ city: 'Zurich' });
      expect(profile.value()).toEqual({ address: { city: 'Zurich' } });
      expect(profile.controlValue()).toEqual({ address: { city: 'Zurich' } });
      expect(validate).toHaveBeenCalledOnce();

      profile.address.city.flush();

      expect(profile.address.value()).toEqual({ city: 'Bern' });
      expect(profile.value()).toEqual({ address: { city: 'Bern' } });
      expect(profile.controlValue()).toEqual({ address: { city: 'Bern' } });
      expect(profile.errors()).toEqual([]);
      expect(validate).toHaveBeenCalledTimes(2);
      await vi.runAllTimersAsync();
      expect(profile.value()).toEqual({ address: { city: 'Bern' } });
    } finally {
      vi.useRealTimers();
    }
  });

  it('inherits control debounce and flushes only the requested form subtree', async () => {
    vi.useFakeTimers();
    try {
      const profile = form({
        name: field('Marco'),
        address: form({
          city: field('Zurich'),
          country: field('Switzerland', { debounce: 0 }),
        }),
      }, { debounce: 100 });

      profile.name.setControlValue('Mark');
      profile.address.city.setControlValue('Bern');
      profile.address.country.setControlValue('Germany');

      expect(profile()).toEqual({
        name: 'Marco',
        address: { city: 'Zurich', country: 'Germany' },
      });
      expect(profile.debouncing()).toBe(true);
      expect(profile.address.debouncing()).toBe(true);
      expect(profile.address.country.debouncing()).toBe(false);

      profile.address.flush();

      expect(profile()).toEqual({
        name: 'Marco',
        address: { city: 'Bern', country: 'Germany' },
      });
      expect(profile.address.debouncing()).toBe(false);
      expect(profile.debouncing()).toBe(true);

      profile.flush();

      expect(profile()).toEqual({
        name: 'Mark',
        address: { city: 'Bern', country: 'Germany' },
      });
      expect(profile.debouncing()).toBe(false);
      await vi.runAllTimersAsync();
    } finally {
      vi.useRealTimers();
    }
  });

  it('debounces a control bound directly to the form independently from its children', async () => {
    vi.useFakeTimers();
    try {
      const profile = form({ name: field('Marco', { debounce: 0 }) }, { debounce: 100 });
      const internal = profile as unknown as InternalNode;

      internal.$api._setControlValue({ name: 'Mark' });

      expect(profile.controlValue()).toEqual({ name: 'Mark' });
      expect(profile()).toEqual({ name: 'Marco' });
      expect(profile.name.controlValue()).toBe('Marco');
      expect(profile.debouncing()).toBe(true);
      expect(profile.dirty()).toBe(true);

      await vi.advanceTimersByTimeAsync(100);

      expect(profile()).toEqual({ name: 'Mark' });
      expect(profile.name.dirty()).toBe(false);
      expect(profile.debouncing()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('discards a pending direct form control value after a descendant changes', async () => {
    vi.useFakeTimers();
    try {
      const profile = form({ name: field('Marco') }, { debounce: 100 });
      (profile as unknown as InternalNode).$api._setControlValue({ name: 'stale' });

      profile.name.set('current');

      expect(profile.controlValue()).toEqual({ name: 'current' });
      expect(profile.debouncing()).toBe(false);
      await vi.runAllTimersAsync();
      expect(profile()).toEqual({ name: 'current' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('flushes its own and selected descendant buffers when marked as touched', () => {
    const profile = form({ name: field('Marco') }, { debounce: 'blur' });
    profile.name.setControlValue('child');

    profile.markAsTouched({ skipDescendants: true });

    expect(profile()).toEqual({ name: 'Marco' });
    expect(profile.name.controlValue()).toBe('child');
    expect(profile.name.touched()).toBe(false);
    expect(profile.debouncing()).toBe(true);

    profile.markAsTouched();

    expect(profile()).toEqual({ name: 'child' });
    expect(profile.name.touched()).toBe(true);
    expect(profile.debouncing()).toBe(false);

    (profile as unknown as InternalNode).$api._setControlValue({ name: 'aggregate' });
    profile.markAsTouched({ skipDescendants: true });

    expect(profile()).toEqual({ name: 'aggregate' });
    expect(profile.debouncing()).toBe(false);
  });

  it('aborts and restores a pending direct control value on reset', () => {
    let abortSignal!: AbortSignal;
    const profile = form({ name: field('Marco') }, {
      debounce: (signal) => {
        abortSignal = signal;
        return new Promise<void>(() => {});
      },
    });
    (profile as unknown as InternalNode).$api._setControlValue({ name: 'pending' });

    profile.reset();

    expect(abortSignal.aborted).toBe(true);
    expect(profile.controlValue()).toEqual({ name: 'Marco' });
    expect(profile()).toEqual({ name: 'Marco' });
    expect(profile.pristine()).toBe(true);
    expect(profile.debouncing()).toBe(false);
  });

  it('uses the nearest configured ancestor control debounce', async () => {
    vi.useFakeTimers();
    try {
      const profile = form({
        name: field('Marco'),
        address: form({ city: field('Zurich') }, { debounce: 50 }),
      }, { debounce: 100 });

      profile.name.setControlValue('Mark');
      profile.address.city.setControlValue('Bern');
      await vi.advanceTimersByTimeAsync(50);

      expect(profile.name()).toBe('Marco');
      expect(profile.address.city()).toBe('Bern');
      expect(profile.debouncing()).toBe(true);

      await vi.advanceTimersByTimeAsync(50);

      expect(profile.name()).toBe('Mark');
      expect(profile.debouncing()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('inherits blur debounce and reports it through the form', () => {
    const profile = form({ name: field('initial') }, { debounce: 'blur' });

    profile.name.setControlValue('pending');
    expect(profile.name()).toBe('initial');
    expect(profile.debouncing()).toBe(true);

    (profile.name as unknown as InternalNode).$api._flushControlValueOnBlur();
    expect(profile()).toEqual({ name: 'pending' });
    expect(profile.debouncing()).toBe(false);
  });

  it('inherits an asynchronous control debouncer into descendant fields', async () => {
    let resolve!: () => void;
    const profile = form({ name: field('initial') }, {
      debounce: () => new Promise<void>((done) => { resolve = done; }),
    });

    profile.name.setControlValue('pending');
    expect(profile()).toEqual({ name: 'initial' });
    expect(profile.debouncing()).toBe(true);

    resolve();
    await Promise.resolve();
    expect(profile()).toEqual({ name: 'pending' });
    expect(profile.debouncing()).toBe(false);
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

  it('propagates parent state through shorthand nested groups', () => {
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

  it('updates programmatically from the complete form value', () => {
    const formGroup = form({
      name: field('Marco'),
      address: form({ city: field('Zurich') }),
    });

    formGroup.update(value => ({
      ...value,
      name: 'Mark',
      address: { ...value.address, city: 'Bern' },
    }));

    expect(formGroup()).toEqual({ name: 'Mark', address: { city: 'Bern' } });
    expect(formGroup.pristine()).toBe(true);
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

  it('is not required without an own required validator or required error', () => {
    const withoutValidators = form({ name: field('David') });
    const unrelatedValidator = form({ name: field('David') }, [() => ({ kind: 'unrelated' })]);

    expect(withoutValidators.required()).toBe(false);
    expect(withoutValidators.api.required()).toBe(false);
    expect(unrelatedValidator.required()).toBe(false);
  });

  it('aggregates a child requiredIf rule when its condition changes', () => {
    const requireName = signal(false);
    const formGroup = form({
      name: field('', [requiredIf(() => requireName())]),
    });

    expect(formGroup.valid()).toBe(true);
    expect(formGroup.name.required()).toBe(false);

    requireName.set(true);
    expect(formGroup.invalid()).toBe(true);
    expect(formGroup.name.getError('required')).toMatchObject({ kind: 'required' });
    expect(formGroup.name.required()).toBe(true);

    formGroup.name.set('David');
    expect(formGroup.valid()).toBe(true);
  });

  it('aggregates a child built-in validator controlled by when', () => {
    const requireName = signal(false);
    const formGroup = form({
      name: field('', [required({ when: () => requireName() })]),
    });

    expect(formGroup.valid()).toBe(true);

    requireName.set(true);
    expect(formGroup.invalid()).toBe(true);
    expect(formGroup.name.required()).toBe(true);

    requireName.set(false);
    expect(formGroup.valid()).toBe(true);
    expect(formGroup.name.required()).toBe(false);
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

  it('collects own and descendant errors in structural tree order', () => {
    const formGroup = form({
      name: field('', [required]),
      address: form({
        city: field('', [() => ({ kind: 'cityError' })]),
      }, [() => ({ kind: 'addressError' })]),
    }, [() => ({ kind: 'formError' })]);

    expect(formGroup.errors().map(error => error.kind)).toEqual(['formError']);
    expect(formGroup.allErrors().map(error => error.kind)).toEqual([
      'formError',
      'required',
      'addressError',
      'cityError',
    ]);
    expect(formGroup.allErrors().map(error => error.targetNode)).toEqual([
      formGroup,
      formGroup.name,
      formGroup.address,
      formGroup.address.city,
    ]);

    formGroup.name.set('David');

    expect(formGroup.allErrors().map(error => error.kind)).toEqual([
      'formError',
      'addressError',
      'cityError',
    ]);
    expect(formGroup.api.allErrors()).toBe(formGroup.allErrors());
  });

  it('gives a child named getError precedence over the form method', () => {
    const getErrorField = field('child');
    const formGroup = form({ getError: getErrorField }, [() => ({ kind: 'formError' })]);

    expect(formGroup.getError).toBe(getErrorField);
    expect(formGroup.getError()).toBe('child');
    expect(formGroup.api.getError('formError')).toMatchObject({ kind: 'formError' });
  });

  it('gives a child named allErrors precedence over the form signal', () => {
    const allErrorsField = field('child');
    const formGroup = form({ allErrors: allErrorsField }, [() => ({ kind: 'formError' })]);

    expect(formGroup.allErrors).toBe(allErrorsField);
    expect(formGroup.allErrors()).toBe('child');
    expect(formGroup.api.allErrors().map(error => error.kind)).toEqual(['formError']);
  });

  it('gives a child named required precedence over the form required signal', () => {
    const requiredField = field('child');
    const formGroup = form({ required: requiredField }, [() => ({ kind: 'required' })]);

    expect(formGroup.required).toBe(requiredField);
    expect(formGroup.required()).toBe('child');
    expect(formGroup.api.required()).toBe(true);
  });

  it('focuses safely without bindings and gives a child named focus precedence', () => {
    const focusField = field('child');
    const formGroup = form({ focus: focusField, name: field('David') });

    expect(formGroup.focus).toBe(focusField);
    expect(formGroup.focus()).toBe('child');
    expect(() => formGroup.api.focus()).not.toThrow();
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

  it('suppresses aggregate pending state while non-interactive and restores it afterwards', () => {
    const formGroup = form({
      name: field('David', [asyncValidator(() => new Promise<null>(() => {}))]),
    });
    expect(formGroup.pending()).toBe(true);

    formGroup.disable();
    expect(formGroup.pending()).toBe(false);
    expect(formGroup.valid()).toBe(true);
    formGroup.enable();
    expect(formGroup.pending()).toBe(true);

    formGroup.markAsReadonly();
    expect(formGroup.pending()).toBe(false);
    expect(formGroup.valid()).toBe(true);
    formGroup.markAsWritable();
    expect(formGroup.pending()).toBe(true);

    formGroup.hide();
    expect(formGroup.pending()).toBe(false);
    expect(formGroup.valid()).toBe(true);
    formGroup.show();
    expect(formGroup.pending()).toBe(true);
  });

  it('remains pending until every form-level asynchronous validator finishes', async () => {
    let resolveFirst!: (result: { kind: string }) => void;
    let resolveSecond!: (result: { kind: string }) => void;
    const formGroup = form({ country: field('Switzerland') }, [
      asyncValidator(() => new Promise<{ kind: string }>((resolve) => { resolveFirst = resolve; })),
      asyncValidator(() => new Promise<{ kind: string }>((resolve) => { resolveSecond = resolve; })),
    ]);

    await Promise.resolve();
    resolveSecond({ kind: 'second' });
    await Promise.resolve();
    await Promise.resolve();

    expect(formGroup.api.errors()).toMatchObject([{ kind: 'second' }]);
    expect(formGroup.api.pending()).toBe(true);
    expect(formGroup.api.validationStatus()).toBe('invalid');

    resolveFirst({ kind: 'first' });
    await Promise.resolve();
    await Promise.resolve();

    expect(formGroup.api.errors()).toMatchObject([{ kind: 'first' }, { kind: 'second' }]);
    expect(formGroup.api.pending()).toBe(false);
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

  it('stops form-level reactive validation when its owning injector is destroyed', async () => {
    const allowedCountry = signal('Switzerland');
    const validate = vi.fn(async ({ value }: Context<{ country: string | null }>) =>
      value().country === allowedCountry() ? null : { kind: 'countryNotAllowed' },
    );
    const injector = Injector.create({ providers: [] });
    const formGroup = form(
      { country: field('Switzerland') },
      [asyncValidator(validate)],
      { injector },
    );

    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();

    injector.destroy();
    allowedCountry.set('Germany');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(formGroup.api.pending()).toBe(false);
    expect(formGroup.api.errors()).toEqual([]);
  });

  it('inherits async-validation ownership from an ancestor form injector', async () => {
    const dependency = signal('initial');
    const validate = vi.fn(async () => {
      dependency();
      return null;
    });
    const address = form(
      { city: field('Zurich') },
      [asyncValidator(validate)],
    );
    const injector = Injector.create({ providers: [] });
    form({ address }, { injector });

    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();

    injector.destroy();
    dependency.set('after destroy');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(address.pending()).toBe(false);
  });

  it('stops injector inheritance at a nested form boundary', async () => {
    const dependency = signal('initial');
    const validate = vi.fn(async () => {
      dependency();
      return null;
    });
    const city = field('Zurich', [asyncValidator(validate)]);
    const address = form({ city }, { inheritInjector: false });
    const injector = Injector.create({ providers: [] });
    form({ address }, { injector });

    await Promise.resolve();
    await Promise.resolve();
    injector.destroy();
    dependency.set('after destroy');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('aborts pending form-level validation when its owning injector is destroyed', async () => {
    let abortSignal: AbortSignal | undefined;
    let resolveValidation!: (result: { kind: string } | null) => void;
    const injector = Injector.create({ providers: [] });
    const formGroup = form(
      { country: field('Switzerland') },
      [asyncValidator(({ abortSignal: currentSignal }) => {
        abortSignal = currentSignal;
        return new Promise((resolve) => { resolveValidation = resolve; });
      })],
      { injector },
    );

    await Promise.resolve();
    expect(formGroup.api.pending()).toBe(true);

    injector.destroy();
    expect(abortSignal?.aborted).toBe(true);
    expect(formGroup.api.pending()).toBe(false);

    resolveValidation({ kind: 'lateError' });
    await Promise.resolve();
    await Promise.resolve();
    expect(formGroup.api.errors()).toEqual([]);
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

  it('runs a reusable aggregate validator authored with validator()', () => {
    const matchingCities = validator<{ city: string | null; billingCity: string | null }>(({ value }) => {
      return value().city === value().billingCity ? null : { kind: 'citiesDoNotMatch' };
    });
    const formGroup = form(
      { city: field('Zurich'), billingCity: field('Madrid') },
      [matchingCities],
    );

    expect(formGroup.getError('citiesDoNotMatch')).toMatchObject({ kind: 'citiesDoNotMatch' });
    formGroup.billingCity.set('Zurich');
    expect(formGroup.getError('citiesDoNotMatch')).toBeUndefined();
  });

  it('updates a reactive built-in validator message on the aggregate value', () => {
    const message = signal('Choose the expected profile');
    const formGroup = form(
      { name: field('David') },
      [oneOf([{ name: 'Marco' as string | null }], { message: () => message() })],
    );

    expect(formGroup.getError('oneOf')?.message).toBe('Choose the expected profile');

    message.set('Select another profile');
    expect(formGroup.getError('oneOf')?.message).toBe('Select another profile');
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

  it('can mark an empty form as touched through its own interaction state', () => {
    const formGroup = form({});

    formGroup.markAsTouched();

    expect(formGroup.touched()).toBe(true);
    formGroup.markAsUntouched();
    expect(formGroup.untouched()).toBe(true);
  });

  it('can mark only the form itself as touched', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });

    formGroup.markAsTouched({ skipDescendants: true });

    expect(formGroup.touched()).toBe(true);
    expect(formGroup.name.untouched()).toBe(true);
    expect(formGroup.address.untouched()).toBe(true);
    expect(formGroup.address.city.untouched()).toBe(true);
  });

  it('only clears its own touched state through markAsUntouched', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.markAsTouched();
    formGroup.api.markAsUntouched();
    expect(formGroup.name.touched()).toBe(true);
    expect(formGroup.address.city.touched()).toBe(true);
    expect(formGroup.api.touched()).toBe(true);
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
    formGroup.name.setControlValue('Ana');
    expect(formGroup.api.dirty()).toBe(true);
    expect(formGroup.api.pristine()).toBe(false);
    expect(formGroup.age.dirty()).toBe(false);
  });

  it('is dirty when a grandchild is dirty', () => {
    const formGroup = form({
      address: form({ city: field('Zurich') }),
    });
    formGroup.address.city.setControlValue('Madrid');
    expect(formGroup.address.api.dirty()).toBe(true);
    expect(formGroup.api.dirty()).toBe(true);
  });

  it('stays pristine through programmatic set', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.api.set({ name: 'Ana', age: 30 });
    expect(formGroup.name.dirty()).toBe(false);
    expect(formGroup.age.dirty()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
  });

  it('preserves existing descendant dirty state through programmatic set', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.markAsDirty();

    formGroup.set({ name: 'Ana', age: 30 });

    expect(formGroup.name.dirty()).toBe(true);
    expect(formGroup.age.dirty()).toBe(false);
    expect(formGroup.dirty()).toBe(true);
  });

  it('stays pristine through programmatic patch', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.api.patch({ name: 'Ana' });
    expect(formGroup.name.dirty()).toBe(false);
    expect(formGroup.age.dirty()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
  });

  it('keeps every branch pristine through a nested programmatic patch', () => {
    const formGroup = form({
      name: field('David'),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    formGroup.api.patch({ address: { country: 'ES' } });
    expect(formGroup.address.country.dirty()).toBe(false);
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.name.dirty()).toBe(false);
  });

  it('marks only the form itself as dirty, including when empty', () => {
    const formGroup = form({
      name: field('David'),
      address: form({
        city: field('Zurich'),
        country: field('CH'),
      }),
    });
    formGroup.api.markAsDirty();
    expect(formGroup.dirty()).toBe(true);
    expect(formGroup.name.dirty()).toBe(false);
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.address.country.dirty()).toBe(false);
    expect(formGroup.address.api.dirty()).toBe(false);

    const emptyForm = form({});
    emptyForm.markAsDirty();
    expect(emptyForm.dirty()).toBe(true);
  });

  it('only clears the form own dirty state through markAsPristine', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.markAsDirty();
    formGroup.name.markAsDirty();
    formGroup.api.markAsPristine();
    expect(formGroup.name.dirty()).toBe(true);
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.api.dirty()).toBe(true);
  });

  it('keeps the values after markAsPristine', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.api.set({ name: 'Ana', address: { city: 'Madrid' } });
    formGroup.api.markAsDirty();
    formGroup.api.markAsPristine();
    expect(formGroup.api.value()).toEqual({ name: 'Ana', address: { city: 'Madrid' } });
  });

  it('marks a nested form without dirtying its descendants or siblings', () => {
    const formGroup = form({
      name: field('David'),
      address: form({ city: field('Zurich') }),
    });
    formGroup.address.api.markAsDirty();
    expect(formGroup.address.dirty()).toBe(true);
    expect(formGroup.address.city.dirty()).toBe(false);
    expect(formGroup.name.dirty()).toBe(false);
    expect(formGroup.dirty()).toBe(true);
  });

  it('goes back to pristine when the only dirty child is reset', () => {
    const formGroup = form({
      name: field('David'),
      age: field(23),
    });
    formGroup.name.setControlValue('Ana');
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
    expect(formGroup.name.api.dirty()).toBe(false);
    expect(formGroup.api.dirty()).toBe(false);
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
    formGroup.name.setControlValue('Ana');
    formGroup.address.city.setControlValue('Madrid');
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

  it('inherits disabled reasons in ancestor-to-descendant order and preserves their sources', () => {
    const formGroup = form({
      name: field('David', { disabled: 'Name is immutable' }),
      address: form({ city: field('Zurich') }),
    });

    formGroup.disable('Profile is locked');

    expect(formGroup.disabledReasons()).toEqual([{
      sourceNode: formGroup,
      message: 'Profile is locked',
    }]);
    expect(formGroup.name.disabledReasons()).toEqual([
      { sourceNode: formGroup, message: 'Profile is locked' },
      { sourceNode: formGroup.name, message: 'Name is immutable' },
    ]);
    expect(formGroup.address.city.disabledReasons()).toEqual([{
      sourceNode: formGroup,
      message: 'Profile is locked',
    }]);

    formGroup.enable();

    expect(formGroup.disabledReasons()).toEqual([]);
    expect(formGroup.name.disabledReasons()).toEqual([{
      sourceNode: formGroup.name,
      message: 'Name is immutable',
    }]);
    expect(formGroup.address.city.disabledReasons()).toEqual([]);
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

  it('warns and ignores unknown keys passed to set', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const profile = form({ name: field('David') });

    profile.set({ name: 'Mark', unknown: true } as any);

    expect(profile()).toEqual({ name: 'Mark' });
    expect(warning).toHaveBeenCalledWith('form: unknown key "unknown" ignored on set');
    warning.mockRestore();
  });

  it('adds, reads, and removes dynamic children while updating aggregate state', () => {
    const profile = form({ name: field('David') });
    const age = profile.add('age', field(23));

    expect(age()).toBe(23);
    expect(profile.get('age')).toBe(age);
    expect(profile.children['age']).toBe(age);
    expect((profile as unknown as Record<string, unknown>)['age']).toBeUndefined();
    expect(profile()).toEqual({ name: 'David', age: 23 });
    expect(age.parent()).toBe(profile);
    expect(age.form()).toBe(profile);
    expect(age.path()).toEqual(['age']);

    age.set(24);
    expect(profile()).toEqual({ name: 'David', age: 24 });

    expect(profile.remove('missing')).toBeUndefined();
    expect(profile.remove('age')).toBe(age);
    expect(profile.get('age')).toBeUndefined();
    expect(profile.children['age']).toBeUndefined();
    expect(profile()).toEqual({ name: 'David' });
    expect(age.parent()).toBeNull();
    expect(age.form()).toBeNull();
    expect(age.path()).toEqual([]);
  });

  it('normalizes one dynamically added field shorthand', () => {
    class Account {
      name = 'Gem';
    }
    const profile = form({ name: field('David') });
    const age = profile.add('age', 23);
    const accountValue = new Account();
    const account = profile.add('account', accountValue);
    const missing = profile.add('missing', undefined);
    const rolesValue = ['admin'];
    const roles = profile.add('roles', rolesValue);

    expect(age.nodeType()).toBe('field');
    expect(age()).toBe(23);
    expect(age.parent()).toBe(profile);
    expect(account.nodeType()).toBe('field');
    expect(account()).toBe(accountValue);
    expect(missing()).toBeNull();
    expect(roles.nodeType()).toBe('field');
    expect(roles()).toBe(rolesValue);
    expect(profile()).toEqual({ name: 'David', age: 23, account: accountValue, missing: null, roles: ['admin'] });
  });

  it('adds several dynamic children atomically and normalizes shorthand groups', () => {
    const profile = form({ name: field('David') });

    const added = profile.add({
      age: 23,
      nickname: null,
      missing: undefined,
      address: { city: 'Zurich' },
    });

    expect(added.age).toBe(profile.get('age'));
    expect(added.age.nodeType()).toBe('field');
    expect(added.nickname.nodeType()).toBe('field');
    expect(added.missing.nodeType()).toBe('field');
    expect(added.missing()).toBeNull();
    expect(added.address).toBe(profile.get('address'));
    expect(added.address.nodeType()).toBe('group');
    expect(added.address.city.nodeType()).toBe('field');
    expect(added.address.city.parent()).toBe(added.address);
    expect(added.address.city.form()).toBe(profile);
    expect(profile()).toEqual({
      name: 'David',
      age: 23,
      nickname: null,
      missing: null,
      address: { city: 'Zurich' },
    });
  });

  it('detaches, reparents, replaces, and resets dynamically added shorthand fields', () => {
    const source = form({ name: 'David' });
    const target = group({ enabled: true }, { readonly: true });
    const status = source.add('status', 'draft');

    status.markAsDirty();
    status.markAsTouched();
    source.disable();
    expect(status.disabled()).toBe(true);
    expect(status.parent()).toBe(source);
    expect(status.form()).toBe(source);

    expect(source.remove('status')).toBe(status);
    expect(status.parent()).toBeNull();
    expect(status.form()).toBeNull();
    expect(status.disabled()).toBe(false);
    expect(status.dirty()).toBe(true);
    expect(status.touched()).toBe(true);

    expect(target.add('status', status)).toBe(status);
    expect(status.parent()).toBe(target);
    expect(status.form()).toBe(target);
    expect(status.readonly()).toBe(true);

    status.set('published');
    target.reset();
    expect(status()).toBe('published');
    expect(status.pristine()).toBe(true);
    expect(status.untouched()).toBe(true);

    expect(target.remove('status')).toBe(status);
    const replacement = target.add('status', 'archived');
    expect(replacement).not.toBe(status);
    expect(replacement()).toBe('archived');
    expect(target()).toEqual({ enabled: true, status: 'archived' });
  });

  it('normalizes arrays in an atomic shorthand batch', () => {
    const profile = form({ name: 'David' });

    const added = profile.add({ age: 23, roles: [] });

    expect(added.roles.nodeType()).toBe('field');
    expect(profile()).toEqual({ name: 'David', age: 23, roles: [] });
  });

  it('includes dynamic children in validation and interaction aggregation', () => {
    const profile = form({ name: field('David') });
    const email = profile.add('email', field('', [required]));

    expect(profile.invalid()).toBe(true);
    expect(profile.allErrors()).toContainEqual(expect.objectContaining({ targetNode: email }));

    email.markAsTouched();
    email.markAsDirty();
    expect(profile.touched()).toBe(true);
    expect(profile.dirty()).toBe(true);

    profile.remove('email');
    expect(profile.valid()).toBe(true);
    expect(profile.allErrors()).toEqual([]);
    expect(profile.touched()).toBe(false);
    expect(profile.dirty()).toBe(false);
  });

  it('protects fixed keys and rejects attached or duplicate dynamic children', () => {
    const profile = form({ name: field('David') });
    const other = form({ age: field(23) });

    expect(() => profile.remove('name')).toThrowError('form: initially declared child "name" cannot be removed');
    expect(() => (profile.add as any)('name', field('Mark'))).toThrowError('form: child "name" already exists');
    expect(() => (profile.add as any)('$api', field(1))).toThrowError('form: "$api" is reserved and cannot be added as a dynamic child');
    expect(() => profile.add('age', other.age)).toThrowError('form: a dynamic child must not already have a parent');
    expect(() => (profile.add as any)('invalid')).toThrowError('form: add(key, definition) requires a definition argument');

    profile.add('age', field(23));
    expect(() => profile.add({ city: field('Zurich'), age: field(24) })).toThrowError('form: child "age" already exists');
    expect(profile.get('city')).toBeUndefined();
  });

  it('keeps dynamic child values when reset receives only the fixed shape', () => {
    const profile = form({ name: field('David') });
    const age = profile.add('age', field(23));
    age.markAsDirty();

    profile.reset({ name: 'Mark' });

    expect(profile()).toEqual({ name: 'Mark', age: 23 });
    expect(age.pristine()).toBe(true);
  });

  it('keeps API operations reachable when a dynamic child uses a colliding name', () => {
    const profile = form({ name: field('David') });
    const setChild = profile.add('set', field('dynamic'));

    expect(profile.children['set']).toBe(setChild);
    expect(profile.get('set')).toBe(setChild);
    expect(typeof profile.set).toBe('function');

    profile.set({ name: 'Mark' });
    expect(profile()).toEqual({ name: 'Mark', set: 'dynamic' });
    expect(profile.remove('set')).toBe(setChild);
    expect(typeof profile.set).toBe('function');
  });

  it('applies inherited availability state to children added later', () => {
    const profile = form({ name: field('David') }, {
      disabled: 'Locked',
      readonly: true,
      hidden: true,
    });
    const age = profile.add('age', field(23));

    expect(age.disabled()).toBe(true);
    expect(age.disabledReasons()).toContainEqual({ sourceNode: profile, message: 'Locked' });
    expect(age.readonly()).toBe(true);
    expect(age.hidden()).toBe(true);
  });

  it('gives a dynamic child the parent injector as its async-validation owner', async () => {
    const dependency = signal('initial');
    const validate = vi.fn(async () => {
      dependency();
      return null;
    });
    const city = field('Zurich', [asyncValidator(validate)]);
    const injector = Injector.create({ providers: [] });
    const profile = form({ name: field('David') }, { injector });

    profile.add('city', city);
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();

    injector.destroy();
    dependency.set('after destroy');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(city.pending()).toBe(false);
  });

  it('ignores markAsTouched while the form is non-interactive', () => {
    const profile = form({ name: field('David') }, { disabled: true });

    profile.markAsTouched();

    expect(profile.untouched()).toBe(true);
    expect(profile.name.untouched()).toBe(true);
  });
});
