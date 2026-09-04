import { describe, expect, it, vi } from 'vitest';

import { form } from './form';
import { field } from './field';
import { group } from './group';
import { createFormPrimitives } from './create-form-primitives';
import { array } from './array';
import { required } from '../validation/validators/required';

describe('group', () => {
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
  });

  it('retains an explicit nested form as an independent submission boundary', async () => {
    const action = vi.fn();
    const profile = form({ payment: form({ card: field('4242') }, { submission: { action } }) });

    expect(await profile.payment.submit()).toBe(true);
    expect(action).toHaveBeenCalledWith(profile.payment, { card: '4242' });
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
      submission: { action: () => pending },
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
    expect(address.children['zip']).toBe(zip);
    expect((address as unknown as Record<string, unknown>)['zip']).toBeUndefined();
    expect(zip.parent()).toBe(address);
    expect(zip.form()).toBe(address);
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
