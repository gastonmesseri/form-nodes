import { describe, expect, it, vi } from 'vitest';

import { form } from './form';
import { field } from './field';
import { group } from './group';
import { array } from './array';
import { required } from '../validation/validators/required';
import type { InternalNode } from '../types/node.type';

describe('group', () => {
  it('exposes an internal runtime discriminant for every node kind', () => {
    const fieldNode = field('');
    const groupNode = group({ name: field('') });
    const formNode = form({ name: field('') });
    const arrayNode = array(field(''));

    expect((fieldNode as unknown as InternalNode).$api._nodeType).toBe('field');
    expect((groupNode as unknown as InternalNode).$api._nodeType).toBe('group');
    expect((formNode as unknown as InternalNode).$api._nodeType).toBe('form');
    expect((arrayNode as unknown as InternalNode).$api._nodeType).toBe('array');
  });

  it('preserves the node type when object and array templates are cloned', () => {
    const people = array({ name: field('') });
    const workflows = array(form({ step: field(1) }));

    const person = people.push();
    const workflow = workflows.push();

    expect((person as unknown as InternalNode).$api._nodeType).toBe('group');
    expect((workflow as unknown as InternalNode).$api._nodeType).toBe('form');
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
    const zip = address.add('zip', field('8001'));

    expect(address()).toEqual({ city: 'Zurich', zip: '8001' });
    expect(address.zip).toBe(zip);
    expect(zip.parent()).toBe(address);
    expect(zip.form()).toBe(address);
    expect(address).not.toHaveProperty('submit');

    expect(address.remove('zip')).toBe(zip);
    expect(address()).toEqual({ city: 'Zurich' });
    expect(zip.parent()).toBeNull();
  });
});
