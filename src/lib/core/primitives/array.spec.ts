import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { array } from './array';
import { field } from './field';
import { form } from './form';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';

describe('array', () => {
  it('creates independent form items from a shorthand template', () => {
    const template = { name: field(''), age: field(23) };
    const sons = array(template, 2);

    expect(sons()).toEqual([{ name: '', age: 23 }, { name: '', age: 23 }]);
    expect(sons.at(0)).not.toBe(sons.at(1));
    expect(sons.at(0)!.name).not.toBe(sons.at(1)!.name);
    expect(sons.at(0)!.name).not.toBe(template.name);

    sons.at(0)!.name.set('Mono');

    expect(sons.at(1)!.name()).toBe('');
    expect(template.name()).toBe('');
    expect(template.name.parent()).toBeNull();
  });

  it('exposes current items through readonly numeric properties while remaining callable', () => {
    const sons = array({ name: field('') }, [{ name: 'Mono' }, { name: 'Lia' }]);
    const mono = sons[0]!;

    expect(sons()).toEqual([{ name: 'Mono' }, { name: 'Lia' }]);
    expect(sons[0]).toBe(sons.at(0));
    expect(sons[1]).toBe(sons.at(1));
    expect(sons[2]).toBeUndefined();
    expect(0 in sons).toBe(true);
    expect(2 in sons).toBe(false);

    sons.move(0, 1);

    expect(sons[1]).toBe(mono);
    expect(() => { (sons as any)[0] = mono; }).toThrow(TypeError);
    expect(() => { delete (sons as any)[0]; }).toThrow(TypeError);
  });

  it('iterates node snapshots through forEach, for-of, spread, and Array.from', () => {
    const sons = array({ name: field('') }, [{ name: 'Mono' }, { name: 'Lia' }]);
    const visited: Array<{ node: typeof sons[0]; index: number; owner: typeof sons }> = [];

    sons.forEach((node, index, owner) => {
      visited.push({ node, index, owner });
      if (index === 0) sons.push({ name: 'Noa' });
    });

    expect(visited.map(({ node }) => node!.name())).toEqual(['Mono', 'Lia']);
    expect(visited.map(({ index }) => index)).toEqual([0, 1]);
    expect(visited.every(({ owner }) => owner === sons)).toBe(true);
    expect([...sons]).toEqual(sons.items());
    expect(Array.from(sons)).toEqual(sons.items());

    const iteratedNames: string[] = [];
    for (const son of sons) iteratedNames.push(son.name()!);
    expect(iteratedNames).toEqual(['Mono', 'Lia', 'Noa']);
  });

  it('creates node snapshots through map and filter', () => {
    const sons = array(
      { name: field(''), age: field(0) },
      [{ name: 'Mono', age: 11 }, { name: 'Lia', age: 7 }],
    );

    const names = sons.map((son, index, owner) => {
      expect(owner).toBe(sons);
      return `${index}:${son.name()}`;
    });
    const older = sons.filter((son, index, owner) => {
      expect(owner).toBe(sons);
      return index === 0 && son.age()! > 10;
    });

    expect(names).toEqual(['0:Mono', '1:Lia']);
    expect(older).toEqual([sons[0]]);
  });

  it('short-circuits node snapshots through find, some, and every', () => {
    const sons = array(
      { name: field(''), age: field(0) },
      [{ name: 'Mono', age: 11 }, { name: 'Lia', age: 7 }, { name: 'Noa', age: 4 }],
    );
    const findVisits: string[] = [];
    const someVisits: string[] = [];
    const everyVisits: string[] = [];

    const found = sons.find((son, index, owner) => {
      expect(owner).toBe(sons);
      findVisits.push(`${index}:${son.name()}`);
      return son.name() === 'Lia';
    });
    const hasYoungChild = sons.some((son) => {
      someVisits.push(son.name()!);
      return son.age()! < 10;
    });
    const allNamed = sons.every((son) => {
      everyVisits.push(son.name()!);
      return son.name() !== '';
    });

    expect(found).toBe(sons[1]);
    expect(findVisits).toEqual(['0:Mono', '1:Lia']);
    expect(hasYoungChild).toBe(true);
    expect(someVisits).toEqual(['Mono', 'Lia']);
    expect(allNamed).toBe(true);
    expect(everyVisits).toEqual(['Mono', 'Lia', 'Noa']);
  });

  it('finds node indexes and compares nodes by identity', () => {
    const sons = array(
      { name: field('') },
      [{ name: 'Mono' }, { name: 'Lia' }, { name: 'Noa' }],
    );
    const lia = sons[1]!;
    const visits: string[] = [];

    const index = sons.findIndex((son, itemIndex, owner) => {
      expect(owner).toBe(sons);
      visits.push(`${itemIndex}:${son.name()}`);
      return son.name() === 'Lia';
    });

    expect(index).toBe(1);
    expect(visits).toEqual(['0:Mono', '1:Lia']);
    expect(sons.findIndex((son) => son.name() === 'Missing')).toBe(-1);
    expect(sons.includes(lia)).toBe(true);
    expect(sons.includes(lia, 2)).toBe(false);
    expect(sons.indexOf(lia)).toBe(1);
    expect(sons.indexOf(lia, 2)).toBe(-1);
    expect(sons.includes({} as typeof lia)).toBe(false);
  });

  it('applies initial values to items cloned from a shorthand template', () => {
    const sons = array(
      { name: field(''), age: field(23) },
      [{ name: 'Mono', age: 11 }, { name: 'Lia', age: 7 }],
    );

    expect(sons()).toEqual([{ name: 'Mono', age: 11 }, { name: 'Lia', age: 7 }]);
    expect(sons.pristine()).toBe(true);
    expect(sons.untouched()).toBe(true);
  });

  it('clones declarative validators and state options without runtime state', () => {
    const template = field('', [required], { disabled: true });
    template.set('changed');
    template.markAsTouched();
    const names = array(template, 1);

    expect(names.at(0)!()).toBe('');
    expect(names.at(0)!.required()).toBe(true);
    expect(names.at(0)!.disabled()).toBe(true);
    expect(names.at(0)!.pristine()).toBe(true);
    expect(names.at(0)!.untouched()).toBe(true);
  });

  it('uses the declared template value for items added later', () => {
    const template = field('initial');
    const names = array(template);
    template.set('changed outside the array');

    const added = names.push();

    expect(added()).toBe('initial');
  });

  it('recursively clones nested form and array templates', () => {
    const families = array({
      surname: field(''),
      sons: array({ name: field(''), age: field(0) }, 1),
    }, 2);

    expect(families()).toEqual([
      { surname: '', sons: [{ name: '', age: 0 }] },
      { surname: '', sons: [{ name: '', age: 0 }] },
    ]);
    expect(families.at(0)!.sons).not.toBe(families.at(1)!.sons);
    expect(families.at(0)!.sons.at(0)!.name).not.toBe(families.at(1)!.sons.at(0)!.name);
  });

  it('creates independent form items from a count and factory defaults', () => {
    const factory = vi.fn(() => ({ name: field(''), age: field(23) }));
    const sons = array(factory, 2);

    expect(factory).toHaveBeenCalledTimes(2);
    expect(sons()).toEqual([{ name: '', age: 23 }, { name: '', age: 23 }]);
    expect(sons.length()).toBe(2);
    expect(sons.items()[0]).not.toBe(sons.items()[1]);

    sons.at(0)!.name.set('Mono');

    expect(sons.at(0)!.name()).toBe('Mono');
    expect(sons.at(1)!.name()).toBe('');
  });

  it('creates pristine and untouched form items from initial values', () => {
    const sons = array(
      () => ({ name: field(''), age: field(23) }),
      [{ name: 'Mono', age: 11 }, { name: 'Lia', age: 7 }],
    );

    expect(sons()).toEqual([{ name: 'Mono', age: 11 }, { name: 'Lia', age: 7 }]);
    expect(sons.pristine()).toBe(true);
    expect(sons.untouched()).toBe(true);
    expect(sons.items().every((item) => item.pristine() && item.untouched())).toBe(true);
  });

  it('can mark an empty array as touched through its own interaction state', () => {
    const names = array(field(''));

    names.markAsTouched();

    expect(names.touched()).toBe(true);
    expect(names.untouched()).toBe(false);
    names.markAsUntouched();
    expect(names.untouched()).toBe(true);
  });

  it('marks descendants as touched by default and can skip them', () => {
    const names = array(field(''), ['Marco', 'Lia']);

    names.markAsTouched({ skipDescendants: true });

    expect(names.touched()).toBe(true);
    expect(names.items().every((item) => item.untouched())).toBe(true);

    names.markAsUntouched();
    names.markAsTouched();

    expect(names.touched()).toBe(true);
    expect(names.items().every((item) => item.touched())).toBe(true);
  });

  it('only clears its own touched state through markAsUntouched', () => {
    const names = array(field(''), ['Marco']);
    names.at(0)!.markAsTouched();

    names.markAsUntouched();

    expect(names.at(0)!.touched()).toBe(true);
    expect(names.touched()).toBe(true);
  });

  it('ignores markAsTouched while non-interactive without losing stored state', () => {
    const names = array(field(''));

    names.disable();
    names.markAsTouched();
    names.enable();
    expect(names.untouched()).toBe(true);

    names.markAsTouched({ skipDescendants: true });
    names.disable();
    expect(names.untouched()).toBe(true);
    names.enable();
    expect(names.touched()).toBe(true);
  });

  it('supports primitive field items', () => {
    const tags = array(() => field(''), ['first', 'second']);

    expect(tags()).toEqual(['first', 'second']);
    expect(tags.at(0)!()).toBe('first');
    tags.at(1)!.set('updated');
    expect(tags()).toEqual(['first', 'updated']);
  });

  it('accepts a field node directly as the template for primitive items', () => {
    const names = array(field('Marco'), []);

    expect(names()).toEqual([]);
    expect(names.length()).toBe(0);

    const defaultName = names.push();
    const explicitName = names.push('Lia');

    expect(defaultName()).toBe('Marco');
    expect(explicitName()).toBe('Lia');
    expect(names()).toEqual(['Marco', 'Lia']);
    expect(names[0]).toBe(defaultName);
    expect(names[1]).toBe(explicitName);
  });

  it('treats null-only arrays as initial values rather than validator shorthand', () => {
    const values = array(field<string>(null), [null]);

    expect(values()).toEqual([null]);
    expect(values.length()).toBe(1);
  });

  it('pushes and inserts either defaults or explicit values', () => {
    const sons = array(() => ({ name: field(''), age: field(23) }));

    const defaultSon = sons.push();
    const explicitSon = sons.push({ name: 'Mono', age: 11 });
    const insertedSon = sons.insert(1, { name: 'Lia', age: 7 });

    expect(defaultSon()).toEqual({ name: '', age: 23 });
    expect(explicitSon()).toEqual({ name: 'Mono', age: 11 });
    expect(insertedSon()).toEqual({ name: 'Lia', age: 7 });
    expect(sons()).toEqual([
      { name: '', age: 23 },
      { name: 'Lia', age: 7 },
      { name: 'Mono', age: 11 },
    ]);
    expect(sons.dirty()).toBe(false);
  });

  it('keeps structural mutations programmatic and preserves existing dirty state', () => {
    const names = array(field(''), ['Marco']);

    names.push('Lia');
    names.insert(1, 'Noa');
    names.move(2, 0);
    names.removeAt(1);
    expect(names.dirty()).toBe(false);

    names.markAsDirty();
    names.set(['Ana', 'Leo']);
    names.clear();
    expect(names.dirty()).toBe(true);
  });

  it('marks and clears only the array own dirty state', () => {
    const names = array(field(''), ['Marco']);

    names.markAsDirty();
    expect(names.dirty()).toBe(true);
    expect(names.at(0)!.dirty()).toBe(false);

    names.at(0)!.markAsDirty();
    names.markAsPristine();
    expect(names.at(0)!.dirty()).toBe(true);
    expect(names.dirty()).toBe(true);

    const emptyNames = array(field(''));
    emptyNames.markAsDirty();
    expect(emptyNames.dirty()).toBe(true);
  });

  it('preserves node identity and state while moving items and updates paths', () => {
    const sons = array(
      () => ({ name: field('') }),
      [{ name: 'Mono' }, { name: 'Lia' }],
    );
    const lia = sons.at(1)!;
    lia.name.markAsTouched();

    sons.move(1, 0);

    expect(sons.at(0)).toBe(lia);
    expect(sons.at(0)!.touched()).toBe(true);
    expect(sons.at(0)!.path()).toEqual(['0']);
    expect(sons.at(1)!.path()).toEqual(['1']);
    expect(sons.at(0)!.name.path()).toEqual(['0', 'name']);
  });

  it('detaches removed items and reindexes the remaining items', () => {
    const sons = array(() => ({ name: field('') }), 3);
    const removed = sons.removeAt(1)!;

    expect(removed.parent()).toBeNull();
    expect(removed.path()).toEqual([]);
    expect(sons.length()).toBe(2);
    expect(sons.at(1)!.path()).toEqual(['1']);
    expect(sons.removeAt(99)).toBeUndefined();
  });

  it('sets values while preserving common node identities', () => {
    const sons = array(() => ({ name: field('') }), [{ name: 'Mono' }]);
    const first = sons.at(0)!;

    sons.set([{ name: 'Updated' }, { name: 'Lia' }]);

    expect(sons.at(0)).toBe(first);
    expect(sons()).toEqual([{ name: 'Updated' }, { name: 'Lia' }]);
    expect(sons.dirty()).toBe(false);
  });

  it('creates new nodes and propagates their structure when set grows the array', () => {
    const factory = vi.fn(() => ({ name: field(''), age: field(0) }));
    const sons = array(factory, [{ name: 'son1', age: 11 }]);
    const first = sons[0]!;

    sons.set([{ name: 'son1 updated', age: 12 }, { name: 'son2', age: 15 }]);

    expect(sons()).toEqual([{ name: 'son1 updated', age: 12 }, { name: 'son2', age: 15 }]);
    expect(sons.value()).toEqual(sons());
    expect(sons.length()).toBe(2);
    expect(sons[0]).toBe(first);
    expect(sons[1]!.parent()).toBe(sons);
    expect(sons[1]!.path()).toEqual(['1']);
    expect(sons[1]!.name.path()).toEqual(['1', 'name']);
    expect(sons[1]!.form()).toBe(sons);
    expect(factory).toHaveBeenCalledTimes(2);
    expect(sons.dirty()).toBe(false);
  });

  it('removes and detaches surplus nodes when set shrinks the array', () => {
    const sons = array(
      { name: field(''), age: field(0) },
      [{ name: 'son1', age: 11 }, { name: 'son2', age: 15 }, { name: 'son3', age: 18 }],
    );
    const first = sons[0]!;
    const second = sons[1]!;
    const third = sons[2]!;

    sons.set([{ name: 'only son', age: 12 }]);

    expect(sons()).toEqual([{ name: 'only son', age: 12 }]);
    expect(sons.length()).toBe(1);
    expect(sons[0]).toBe(first);
    expect(first.path()).toEqual(['0']);
    expect(second.parent()).toBeNull();
    expect(second.path()).toEqual([]);
    expect(third.parent()).toBeNull();
    expect(third.path()).toEqual([]);
  });

  it('empties and later recreates nodes through set using the same definition', () => {
    const sons = array({ name: field(''), age: field(0) }, [{ name: 'son1', age: 11 }]);
    const removed = sons[0]!;

    sons.set([]);

    expect(sons()).toEqual([]);
    expect(sons.length()).toBe(0);
    expect(sons[0]).toBeUndefined();
    expect(removed.parent()).toBeNull();
    expect(removed.path()).toEqual([]);

    sons.set([{ name: 'son2', age: 15 }, { name: 'son3', age: 18 }]);

    expect(sons()).toEqual([{ name: 'son2', age: 15 }, { name: 'son3', age: 18 }]);
    expect(sons[0]).not.toBe(removed);
    expect(sons[0]!.parent()).toBe(sons);
    expect(sons[0]!.path()).toEqual(['0']);
    expect(sons[1]!.path()).toEqual(['1']);
  });

  it('resets values and interaction state while reconciling length', () => {
    const sons = array(() => ({ name: field('') }), [{ name: 'Mono' }]);
    sons.push({ name: 'Lia' });
    sons.at(0)!.name.markAsTouched();
    sons.markAsTouched({ skipDescendants: true });

    sons.reset([{ name: 'Noa' }]);

    expect(sons()).toEqual([{ name: 'Noa' }]);
    expect(sons.pristine()).toBe(true);
    expect(sons.untouched()).toBe(true);
  });

  it('aggregates validation and interaction state from dynamic items', () => {
    const names = array(() => field('', [required]), 1);

    expect(names.invalid()).toBe(true);
    names.at(0)!.setControlValue('Mono');
    expect(names.valid()).toBe(true);
    expect(names.dirty()).toBe(true);
    names.at(0)!.markAsTouched();
    expect(names.touched()).toBe(true);
  });

  it('runs reactive validators on the array value', () => {
    const minimum = signal(2);
    const names = array(() => field('Mono'), 1, {
      validators: [({ value }) => value().length < minimum() ? { kind: 'minimumItems' } : null],
    });

    expect(names.getError('minimumItems')).toMatchObject({ kind: 'minimumItems' });
    names.push('Lia');
    expect(names.errors()).toEqual([]);
    minimum.set(3);
    expect(names.invalid()).toBe(true);
  });

  it('accepts validator shorthand with the default empty initial value', () => {
    const names = array(field(''), [
      ({ value }) => value().length === 0 ? { kind: 'emptyArray' } : null,
    ]);

    expect(names()).toEqual([]);
    expect(names.getError('emptyArray')).toMatchObject({ kind: 'emptyArray' });
  });

  it('accepts initial values followed by validator shorthand and options', () => {
    const names = array(
      field(''),
      ['Mono'],
      [({ value }) => value().length < 2 ? { kind: 'minimumItems' } : null],
      { readonly: true },
    );

    expect(names()).toEqual(['Mono']);
    expect(names.getError('minimumItems')).toBeUndefined();
    expect(names.readonly()).toBe(true);

    names.markAsWritable();
    expect(names.getError('minimumItems')).toMatchObject({ kind: 'minimumItems' });
  });

  it('runs and aggregates asynchronous validation', async () => {
    const names = array(() => field(''), ['Mono'], {
      validators: [asyncValidator(async ({ value }) =>
        value().includes('blocked') ? { kind: 'blockedName' } : null,
      )],
    });

    expect(names.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(names.valid()).toBe(true);

    names.push('blocked');
    await Promise.resolve();
    expect(names.pending()).toBe(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(names.getError('blockedName')).toMatchObject({ kind: 'blockedName' });
  });

  it('propagates configured state to current and future items', () => {
    const disabled = signal(true);
    const names = array(() => field(''), 1, { disabled });

    expect(names.at(0)!.disabled()).toBe(true);
    const added = names.push('Mono');
    expect(added.disabled()).toBe(true);

    disabled.set(false);
    expect(names.at(0)!.enabled()).toBe(true);
    expect(added.enabled()).toBe(true);
  });

  it('rejects invalid initial counts and mutation indexes', () => {
    expect(() => array(() => field(''), -1)).toThrow(RangeError);
    expect(() => array(() => field(''), 1.5)).toThrow(RangeError);
    const names = array(() => field(''), 1);
    expect(() => names.insert(2)).toThrow(RangeError);
    expect(() => names.move(0, 1)).toThrow(RangeError);
  });

  it('rejects factories that reuse the same live node', () => {
    const shared = field('');

    expect(() => array(() => shared, 2)).toThrow('factory must return a fresh node definition');
  });

  it('rejects factory objects that reuse nested live nodes', () => {
    const sharedDefinition = { name: field('') };

    expect(() => array(() => sharedDefinition, 2)).toThrow('factory must return a fresh node definition');
  });

  it('clears all items and detaches retained references', () => {
    const names = array(() => field(''), ['Mono']);
    const item = names.at(0)!;

    names.clear();

    expect(names()).toEqual([]);
    expect(item.parent()).toBeNull();
    expect(names.dirty()).toBe(false);
  });

  it('can be nested inside forms and other arrays', () => {
    const profile = form({
      name: field('Marco'),
      sons: array(() => ({
        name: field(''),
        aliases: array(() => field(''), ['M']),
      }), [{ name: 'Mono', aliases: ['M'] }]),
    });

    expect(profile()).toEqual({
      name: 'Marco',
      sons: [{ name: 'Mono', aliases: ['M'] }],
    });
    expect(profile.sons.parent()).toBe(profile);
    expect(profile.sons.path()).toEqual(['sons']);
    expect(profile.sons.at(0)!.name.path()).toEqual(['sons', '0', 'name']);
    expect(profile.sons.at(0)!.aliases.at(0)!.path()).toEqual(['sons', '0', 'aliases', '0']);
    expect(profile.sons.at(0)!.name.form()).toBe(profile);
  });
});
