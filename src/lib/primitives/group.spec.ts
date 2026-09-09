import { computed, signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { form } from './form';
import { field } from './field';
import { group } from './group';
import { array } from './array';
import { required } from '../validation/validators/required';
import { createFormPrimitives } from './create-form-primitives';

describe('group', () => {
  it('enumerates an initially empty record through add, updates, and removal', () => {
    const parent = form({ record: group({}) });
    const record = parent.record;
    const visit = vi.fn();
    expect(Object.values(record.children)).toEqual([]);
    record.forEachChild(visit);
    expect(visit).not.toHaveBeenCalled();
    const name = record.add('name', field('Marco'));
    const age = record.add('age', field(18));
    expect(Object.values(record.children)).toEqual([name, age]);
    record.forEachChild(visit);
    expect(visit).not.toHaveBeenCalled();
    record.forEachChild(visit, { includeDynamic: true });
    expect(visit.mock.calls).toEqual([[name, 'name'], [age, 'age']]);
    record.forEachChild(child => child.markAsTouched(), { includeDynamic: true });
    expect(name.touched()).toBe(true);
    expect(age.touched()).toBe(true);
    name.set('Lia');
    expect(parent()).toEqual({ record: { name: 'Lia', age: 18 } });
    record.remove('age');
    expect(Object.values(record.children)).toEqual([name]);
    expect(record.get('age')).toBeUndefined();
    expect(parent()).toEqual({ record: { name: 'Lia' } });
  });

  it('exposes missing, added, and removed children through the runtime map', () => {
    const parent = form({ branch: group({ name: field('Marco'), age: field(30) }) });
    const branch = parent.branch;
    expect(Object.values(branch.children)).toEqual([branch.name, branch.age]);
    expect(branch.children.active?.value()).toBeUndefined();
    const active = branch.add('active', field(true));
    expect(branch.children.active).toBe(active);
    expect(branch.children.active?.value()).toBe(true);
    expect(branch.$api.children.active).toBe(active);
    expect(Object.values(branch.children)).toEqual([branch.name, branch.age, active]);
    expect(branch.get('active')).toBe(active);
    branch.remove('active');
    expect(branch.children.active?.value()).toBeUndefined();
    expect(Object.values(branch.children)).toEqual([branch.name, branch.age]);
    expect(branch.get('active')).toBeUndefined();
  });

  it('visits only declared children by default and includes dynamic nodes only when requested', () => {
    const branch = group({ name: field('Marco'), age: field(30) });
    const added = branch.add('extra', field(true));
    const visit = vi.fn((child: { markAsTouched(): void }) => child.markAsTouched());
    branch.forEachChild(visit);
    expect(visit.mock.calls.map(([child]) => child)).toEqual([branch.name, branch.age]);
    expect(branch.name.touched()).toBe(true);
    expect(added.touched()).toBe(false);
    visit.mockClear();
    branch.forEachChild(visit, { includeDynamic: false });
    expect(visit.mock.calls.map(([child]) => child)).toEqual([branch.name, branch.age]);
    visit.mockClear();
    branch.forEachChild(visit, {});
    expect(visit.mock.calls.map(([child]) => child)).toEqual([branch.name, branch.age]);
    visit.mockClear();
    branch.forEachChild(visit, { includeDynamic: true });
    expect(visit.mock.calls.map(([child]) => child)).toEqual([branch.name, branch.age, added]);
    expect(added.touched()).toBe(true);
    expect(Object.values(branch.children)).toEqual([branch.name, branch.age, added]);
    expect(branch()).toEqual({ name: 'Marco', age: 30, extra: true });
  });

  it('tracks runtime inclusion options without reading excluded dynamic values', () => {
    const branch = group({ name: field('Marco'), age: field(30) });
    const extra = branch.add('extra', field(true));
    const includeDynamic = signal(false);
    const read = vi.fn(() => {
      const values: unknown[] = [];
      branch.forEachChild(child => values.push(child()), { includeDynamic: includeDynamic() });
      return values;
    });
    const values = computed(read);
    expect(values()).toEqual(['Marco', 30]);
    extra.set(false);
    expect(values()).toEqual(['Marco', 30]);
    expect(read).toHaveBeenCalledTimes(1);
    includeDynamic.set(true);
    expect(values()).toEqual(['Marco', 30, false]);
    extra.set(true);
    expect(values()).toEqual(['Marco', 30, true]);
    branch.remove('extra');
    expect(values()).toEqual(['Marco', 30]);
    expect(read).toHaveBeenCalledTimes(4);
  });

  it('visits only direct child nodes, including dynamic children, in a stable snapshot', () => {
    const profile = form({ branch: group({ name: field('Marco'), address: { city: field('Zurich') }, tags: array(field('')) }) });
    const branch = profile.branch;
    const removed = branch.add('removed', field(1));
    const visited: unknown[] = [];
    const result = branch.forEachChild((child, key) => {
      visited.push([key, child]);
      if (key === 'name') {
        branch.remove('removed');
        branch.add('later', field(2));
      }
    }, { includeDynamic: true });
    expect(result).toBeUndefined();
    expect(visited).toEqual([
      ['name', branch.name], ['address', branch.address], ['tags', branch.tags], ['removed', removed],
    ]);
    const keys: string[] = [];
    branch.forEachChild((_child, key) => keys.push(key), { includeDynamic: true });
    expect(keys).toEqual(['name', 'address', 'tags', 'later']);
  });

  it('tracks structural changes and callback value reads without reading other child values', () => {
    const branch = group({ name: field('Marco'), age: field(30) });
    const visits = vi.fn(() => {
      const values: unknown[] = [];
      branch.forEachChild((child, key) => values.push(key === 'name' ? child() : key), { includeDynamic: true });
      return values;
    });
    const observed = computed(visits);
    expect(observed()).toEqual(['Marco', 'age']);
    branch.age.set(31);
    expect(observed()).toEqual(['Marco', 'age']);
    expect(visits).toHaveBeenCalledTimes(1);
    branch.name.set('Lia');
    expect(observed()).toEqual(['Lia', 'age']);
    branch.add('extra', field(true));
    expect(observed()).toEqual(['Lia', 'age', 'extra']);
    branch.remove('extra');
    expect(observed()).toEqual(['Lia', 'age']);
    expect(visits).toHaveBeenCalledTimes(4);
  });

  it('handles empty nodes, child-name collisions, and callback errors', () => {
    const visit = vi.fn();
    group({}).forEachChild(visit);
    expect(visit).not.toHaveBeenCalled();
    const branch = group({ forEachChild: field('child'), next: field('next') });
    expect(branch.forEachChild()).toBe('child');
    branch.$api.forEachChild(visit);
    expect(visit.mock.calls).toEqual([[branch.forEachChild, 'forEachChild'], [branch.next, 'next']]);
    const fail = vi.fn(() => { throw new Error('Iteration failed'); });
    expect(() => branch.$api.forEachChild(fail)).toThrow('Iteration failed');
    expect(fail).toHaveBeenCalledTimes(1);
  });

  it('preserves configured equality in group templates, updates, and independent array clones', () => {
    const configured = createFormPrimitives({ nullable: false });
    const template = configured.group({ name: configured.field('Marco') }, {
      equal: (a, b) => a.name.toLowerCase() === b.name.toLowerCase(),
    });
    const people = array(template, { initialValue: 2 });
    const first = people[0]!;
    const second = people[1]!;
    const initial = people();
    first.name.set('MARCO');
    second.name.set('MARCO');
    expect(people()).toBe(initial);
    expect(people.value.control()).toEqual([{ name: 'MARCO' }, { name: 'MARCO' }]);
    const updater = vi.fn(value => ({ name: `${value.name}!` }));
    first.update(updater);
    expect(updater).toHaveBeenCalledExactlyOnceWith(initial[0]);
    expect(first.name()).toBe('Marco!');
    expect(second()).toBe(initial[1]);
    expect(template()).toEqual({ name: 'Marco' });
    people.push({ name: 'Lia' });
    expect(people()).toEqual([{ name: 'Marco!' }, { name: 'Marco' }, { name: 'Lia' }]);
  });

  it('prefers positional validators over option validators and propagates their results to the form', () => {
    const positional = vi.fn(({ value }: { value: () => { city: string | null } }) => {
      return value().city ? null : { kind: 'cityRequired' };
    });
    const optionValidator = vi.fn(() => ({ kind: 'optionError' }));
    const address = group({ city: field('') }, positional, { validators: optionValidator });
    const profile = form({ address });

    expect(address.errors()).toMatchObject([{ kind: 'cityRequired' }]);
    expect(profile.invalid()).toBe(true);
    expect(positional).toHaveBeenCalledOnce();
    expect(optionValidator).not.toHaveBeenCalled();

    address.city.set('Zurich');
    expect(profile.valid()).toBe(true);
    expect(address.errors()).toEqual([]);
    expect(positional).toHaveBeenCalledTimes(2);
    expect(optionValidator).not.toHaveBeenCalled();
  });

  it('keeps extracted actions bound while propagating changes to its owning form', () => {
    const profile = form({ address: group({ city: field('Zurich') }) });
    const { set, update, patch, reset, add, remove, markAsTouched } = profile.address;

    set({ city: 'Bern' });
    update(value => ({ city: `${value.city}!` }));
    patch({ city: 'Basel' });
    const postcode = add('postcode', field('', [required]));
    expect(profile()).toEqual({ address: { city: 'Basel', postcode: '' } });
    expect(postcode.form()).toBe(profile);
    expect(profile.invalid()).toBe(true);

    markAsTouched();
    expect(profile.touched()).toBe(true);
    expect(postcode.touched()).toBe(true);
    expect(remove('postcode')).toBe(postcode);
    expect(postcode.parent()).toBeNull();
    expect(profile.valid()).toBe(true);
    reset();
    expect(profile()).toEqual({ address: { city: 'Basel' } });
    expect(profile.untouched()).toBe(true);
    reset({ city: 'Geneva' });
    expect(profile()).toEqual({ address: { city: 'Geneva' } });
    expect(profile.pristine()).toBe(true);
  });

  it('exposes one node signal under both validator aliases', () => {
    let receivedNode: unknown;
    const validate = (context: { node: () => unknown; field: () => unknown }) => {
      expect(context.node).toBe(context.field);
      receivedNode = context.node();
      return null;
    };
    const target = group({ email: field('') }, { validators: validate });
    expect(target.errors()).toEqual([]);
    expect(receivedNode).toBe(target);
  });

  it('creates shorthand descendants with configured field defaults', () => {
    const { group: configuredGroup } = createFormPrimitives({ nullable: false });
    const address = configuredGroup({ city: '' });

    const added = address.add({ postcode: '' });

    expect(address()).toEqual({ city: '', postcode: '' });
    expect(added.postcode()).toBe('');
  });

  it('accepts positional validators and options on configured groups', () => {
    const { group: configuredGroup } = createFormPrimitives({ inheritInjector: false });
    const address = configuredGroup(
      { city: field('') },
      [required],
      { inheritInjector: true },
    );
    const locallyConfigured = configuredGroup(
      { city: field('Zurich') },
      { inheritInjector: true },
    );

    expect(address.invalid()).toBe(false);
    expect(locallyConfigured()).toEqual({ city: 'Zurich' });
  });

  it('normalizes concise values to fields', () => {
    const address = group({ city: 'Zurich', postcode: 8000 });

    expect(address()).toEqual({ city: 'Zurich', postcode: 8000 });
    address.city.set('Bern');
    expect(address.city()).toBe('Bern');
  });

  it('normalizes special shorthand values consistently at the root and nested depths', () => {
    const invalidDate = new Date(Number.NaN);
    const marker = Symbol('marker');
    const values = group({
      emptyText: '',
      disabledFlag: false,
      notANumber: Number.NaN,
      positiveInfinity: Number.POSITIVE_INFINITY,
      negativeZero: -0,
      largeCount: 1n,
      marker,
      invalidDate,
      empty: null,
      missing: undefined,
      nested: { invalidDate, negativeZero: -0 },
    });

    expect(values.emptyText()).toBe('');
    expect(values.disabledFlag()).toBe(false);
    expect(values.notANumber()).toBeNaN();
    expect(values.positiveInfinity()).toBe(Number.POSITIVE_INFINITY);
    expect(Object.is(values.negativeZero(), -0)).toBe(true);
    expect(values.largeCount()).toBe(1n);
    expect(values.marker()).toBe(marker);
    expect(values.invalidDate()).toBe(invalidDate);
    expect(values.empty()).toBeNull();
    expect(values.missing()).toBeUndefined();
    expect(values.nested.invalidDate()).toBe(invalidDate);
    expect(Object.is(values.nested.negativeZero(), -0)).toBe(true);
  });

  it('reports complete group paths for invalid structural shorthand', () => {
    const read = vi.fn(() => 'unsafe');
    const accessorDefinition = {
      address: Object.defineProperty({}, 'city', { enumerable: true, get: read }),
    };

    expect(() => group(accessorDefinition as never)).toThrow(
      'group: accessor shorthand is not supported at "address.city"; declare a data property with an explicit node or, if this object is intended as a field value, wrap it with field(value)',
    );
    expect(read).not.toHaveBeenCalled();
  });

  it('normalizes array values to fields at every nested depth', () => {
    const roles = ['admin'];
    const settings = group({ roles, account: { permissions: [] } });

    expect(settings.roles.nodeType()).toBe('field');
    expect(settings.roles()).toBe(roles);
    expect(settings.account.permissions.nodeType()).toBe('field');
    expect(settings()).toEqual({ roles: ['admin'], account: { permissions: [] } });
  });

  it('normalizes a non-plain object to a field', () => {
    const expression = new RegExp('forms');
    expect(group({ expression }).expression()).toBe(expression);
  });

  it('exposes a public runtime discriminant for every node kind', () => {
    const fieldNode = field('');
    const groupNode = group({ name: field('') });
    const formNode = form({ name: field('') });
    const arrayNode = array(field(''));

    expect(fieldNode.nodeType()).toBe('field');
    expect(groupNode.nodeType()).toBe('group');
    expect(formNode.nodeType()).toBe('form');
    expect(arrayNode.nodeType()).toBe('array');
  });

  it('preserves the node type when object and array templates are cloned', () => {
    const people = array({ name: field('') });
    const workflows = array(form({ step: field(1) }));

    const person = people.push();
    const workflow = workflows.push();

    expect(person.nodeType()).toBe('group');
    expect(workflow.nodeType()).toBe('form');
  });

  it('creates a fixed object aggregate without submission behavior', () => {
    const address = group({ city: field('Zurich'), zip: field('8001') });

    expect(address()).toEqual({ city: 'Zurich', zip: '8001' });
    expect(address).not.toHaveProperty('submit');
    expect(address.api).not.toHaveProperty('submit');

    address.patch({ city: 'Bern' });
    expect(address()).toEqual({ city: 'Bern', zip: '8001' });
  });

  it('supports aggregate validators and structural options', () => {
    const address = group({ city: field('', [required]) }, { disabled: true });

    expect(address.disabled()).toBe(true);
    expect(address.valid()).toBe(true);

    address.enable();
    expect(address.invalid()).toBe(true);
    expect(address.allErrors()).toContainEqual(expect.objectContaining({ targetNode: address.city }));
  });

  it('normalizes nested shorthand objects to groups', () => {
    const profile = form({ address: { city: field('Zurich') } });

    expect(profile.address).not.toHaveProperty('submit');
    expect(profile.address.parent()).toBe(profile);
    expect(profile.address.city.form()).toBe(profile);
    expect(profile.address.root()).toBe(profile);
  });

  it('keeps a standalone group outside a form workflow while exposing its structural root', () => {
    const address = group({ city: field('Zurich') });

    expect(address.form()).toBeNull();
    expect(address.city.form()).toBeNull();
    expect(address.root()).toBe(address);
    expect(address.city.root()).toBe(address);
  });

  it('retains an explicit nested form as an independent submission boundary', async () => {
    const action = vi.fn();
    const profile = form({ payment: form({ card: field('4242') }, { onSubmit: action }) });

    expect(await profile.payment.submit()).toBe(true);
    expect(action).toHaveBeenCalledWith({ card: '4242' }, profile.payment);
    expect(profile.payment.form()).toBe(profile.payment);
    expect(profile.payment.card.form()).toBe(profile.payment);
    expect(profile.payment.root()).toBe(profile);
    expect(profile.payment.card.root()).toBe(profile);
  });

  it('uses groups for shorthand array item templates and clones them as groups', () => {
    const people = array({ name: field('') }, [{ name: 'Marco' }]);

    people.push({ name: 'Lia' });

    expect(people[0]).not.toHaveProperty('submit');
    expect(people[1]).not.toHaveProperty('submit');
    expect(people()).toEqual([{ name: 'Marco' }, { name: 'Lia' }]);
  });

  it('clones implicit and explicit fields with equivalent independent state', () => {
    const rows = array(form({ implicit: '', explicit: field('') }), [{ implicit: 'one', explicit: 'one' }]);
    const first = rows[0]!;
    const second = rows.push({ implicit: 'two', explicit: 'two' });

    expect(first.implicit.nodeType()).toBe('field');
    expect(second.implicit.nodeType()).toBe('field');
    expect(first.implicit()).toBe(first.explicit());
    expect(second.implicit()).toBe(second.explicit());
    expect(second.implicit).not.toBe(first.implicit);
    expect(second.explicit).not.toBe(first.explicit);

    second.implicit.markAsTouched();
    second.explicit.markAsTouched();
    second.implicit.markAsDirty();
    second.explicit.markAsDirty();
    second.reset();

    expect(second.implicit.touched()).toBe(second.explicit.touched());
    expect(second.implicit.dirty()).toBe(second.explicit.dirty());
  });

  it('inherits submission state from its owning form', async () => {
    let resolve!: () => void;
    const pending = new Promise<void>((done) => { resolve = done; });
    const profile = form({ address: group({ city: field('Zurich') }) }, {
      onSubmit: () => pending,
    });

    const submission = profile.submit();
    expect(profile.address.submitting()).toBe(true);
    expect(profile.address.city.submitting()).toBe(true);

    resolve();
    await submission;
    expect(profile.address.submitting()).toBe(false);
  });

  it('supports dynamic children without turning a group into a submission boundary', () => {
    const address = group({ city: field('Zurich') });
    const zip = address.add('zip', '8001');

    expect(address()).toEqual({ city: 'Zurich', zip: '8001' });
    expect(address.get('zip')).toBe(zip);
    expect(Reflect.get(address.children, 'zip')).toBe(zip);
    expect((address as unknown as Record<string, unknown>)['zip']).toBeUndefined();
    expect(zip.parent()).toBe(address);
    expect(zip.form()).toBeNull();
    expect(zip.root()).toBe(address);
    expect(address).not.toHaveProperty('submit');

    expect(address.remove('zip')).toBe(zip);
    expect(address.get('zip')).toBeUndefined();
    expect(address()).toEqual({ city: 'Zurich' });
    expect(zip.parent()).toBeNull();
  });

  it('normalizes batch field and group shorthands added dynamically', () => {
    const filters = group({ query: '' });
    const added = filters.add({ page: 1, roles: ['admin'], range: { minimum: 0, maximum: 100 } });

    expect(added.page.nodeType()).toBe('field');
    expect(added.roles.nodeType()).toBe('field');
    expect(added.range.nodeType()).toBe('group');
    expect(added.range.minimum.nodeType()).toBe('field');
    expect(added.range.maximum.nodeType()).toBe('field');
    expect(filters()).toEqual({ query: '', page: 1, roles: ['admin'], range: { minimum: 0, maximum: 100 } });
  });
});

it('creates independent empty groups and adopts later children', () => {
  const details = group();
  const other = group();
  expect(details()).toEqual({});
  expect(details.valid()).toBe(true);
  const name = details.add('name', field('Ada'));
  expect(name.parent()).toBe(details);
  expect(other()).toEqual({});
  details.markAsTouched();
  expect(name.touched()).toBe(true);
  details.reset();
  expect(name.touched()).toBe(false);
  details.remove('name');
  expect(details()).toEqual({});
});

it.each([false, true])('preserves configured defaults for empty factories with nullable: %s', (nullable) => {
  const primitives = createFormPrimitives({ nullable, validatorMessages: { required: 'Required here.' } });
  const profile = primitives.form();
  const details = primitives.group();
  const values = primitives.array();
  expect(profile()).toEqual({});
  expect(details()).toEqual({});
  expect(values()).toEqual([]);
  const name = profile.add('name', 'Ada');
  const city = details.add('city', 'Zurich');
  expect(name()).toBe('Ada');
  expect(city()).toBe('Zurich');
  const item = values.push();
  expect(item()).toBe(null);
  item.setValidators([required]);
  expect(item.getError('required')?.message).toBe('Required here.');
  expect(values.invalid()).toBe(true);
  item.set('Grace');
  expect(values.valid()).toBe(true);
  values.resetToInitial();
  expect(values()).toEqual([]);
});

it('includes nested errors through the descendants option while retaining own errors', () => {
  const details = group({ city: field('', [required]) });
  expect(details.errors()).toEqual([]);
  expect(details.errors({ descendants: true })).toBe(details.allErrors());
  expect(details.errors({ descendants: true })[0]?.targetNode).toBe(details.city);
  details.city.set('Zurich');
  expect(details.errors({ descendants: true })).toEqual([]);
});
