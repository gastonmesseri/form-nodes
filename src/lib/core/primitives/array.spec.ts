import { Injector, signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { form } from './form';
import { array } from './array';
import { field } from './field';
import { validator } from '../validation/validator';
import type { InternalNode } from '../types/node.type';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';
import { minLength } from '../validation/validators/min-length';
import { uniqueItems } from '../validation/validators/unique-items';

describe('array', () => {
  it('exposes the same API through api and $api', () => {
    const names = array(field(''), []);

    expect(names.$api).toBe(names.api);
  });

  it('allows focusing safely when no descendant UI control is bound', () => {
    const names = array(field('Marco'), 1);

    expect(() => names.focus()).not.toThrow();
  });

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
    expect(sons.findIndex(son => son.name() === 'Missing')).toBe(-1);
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
    expect(sons.items().every(item => item.pristine() && item.untouched())).toBe(true);
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
    expect(names.items().every(item => item.untouched())).toBe(true);

    names.markAsUntouched();
    names.markAsTouched();

    expect(names.touched()).toBe(true);
    expect(names.items().every(item => item.touched())).toBe(true);
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
    names.swap(0, 1);
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
    expect(sons.keyInParent()).toBeNull();
    expect(lia.keyInParent()).toBe(1);
    lia.name.markAsTouched();

    sons.move(1, 0);

    expect(sons.at(0)).toBe(lia);
    expect(sons.at(0)!.touched()).toBe(true);
    expect(sons.at(0)!.path()).toEqual(['0']);
    expect(sons.at(1)!.path()).toEqual(['1']);
    expect(sons.at(0)!.name.path()).toEqual(['0', 'name']);
    expect(lia.keyInParent()).toBe(0);
    expect(sons.at(1)!.keyInParent()).toBe(1);
    expect(lia.name.keyInParent()).toBe('name');
  });

  it('moves items one position up or down while preserving identity and state', () => {
    const names = array(field(''), ['Marco', 'Lia', 'Noa']);
    const lia = names.at(1)!;
    lia.markAsTouched();

    names.moveUp(1);

    expect(names()).toEqual(['Lia', 'Marco', 'Noa']);
    expect(names.at(0)).toBe(lia);
    expect(lia.touched()).toBe(true);
    expect(lia.path()).toEqual(['0']);

    names.moveDown(0);

    expect(names()).toEqual(['Marco', 'Lia', 'Noa']);
    expect(names.at(1)).toBe(lia);
    expect(lia.touched()).toBe(true);
    expect(lia.path()).toEqual(['1']);
  });

  it('keeps boundary items in place and rejects invalid move-step indexes', () => {
    const names = array(field(''), ['Marco', 'Lia']);
    const first = names.at(0);
    const last = names.at(1);

    names.moveUp(0);
    names.moveDown(1);

    expect(names()).toEqual(['Marco', 'Lia']);
    expect(names.at(0)).toBe(first);
    expect(names.at(1)).toBe(last);
    expect(() => names.moveUp(-1)).toThrow(RangeError);
    expect(() => names.moveDown(2)).toThrow(RangeError);
  });

  it('swaps item nodes while preserving identity and state', () => {
    const names = array(field(''), ['Marco', 'Lia', 'Noa']);
    const marco = names.at(0)!;
    const noa = names.at(2)!;
    marco.markAsDirty();
    noa.markAsTouched();

    names.swap(0, 2);

    expect(names()).toEqual(['Noa', 'Lia', 'Marco']);
    expect(names.at(0)).toBe(noa);
    expect(names.at(2)).toBe(marco);
    expect(noa.touched()).toBe(true);
    expect(marco.dirty()).toBe(true);
    expect(noa.path()).toEqual(['0']);
    expect(marco.path()).toEqual(['2']);
  });

  it('keeps an item in place when swapping the same index and rejects invalid indexes', () => {
    const names = array(field(''), ['Marco']);
    const marco = names.at(0);

    names.swap(0, 0);

    expect(names.at(0)).toBe(marco);
    expect(() => names.swap(-1, 0)).toThrow(RangeError);
    expect(() => names.swap(0, 1)).toThrow(RangeError);
  });

  it('detaches removed items and reindexes the remaining items', () => {
    const sons = array(() => ({ name: field('') }), 3);
    const removed = sons.removeAt(1)!;

    expect(removed.parent()).toBeNull();
    expect(removed.path()).toEqual([]);
    expect(removed.keyInParent()).toBeNull();
    expect(sons.length()).toBe(2);
    expect(sons.at(1)!.path()).toEqual(['1']);
    expect(sons.at(1)!.keyInParent()).toBe(1);
    expect(sons.removeAt(99)).toBeUndefined();
  });

  it('keeps removed items usable without affecting their former array', () => {
    const names = array(field('', [required]), ['Marco', 'Lia']);
    names.disable();
    const removed = names.removeAt(0)!;

    expect(removed.parent()).toBeNull();
    expect(removed.path()).toEqual([]);
    expect(removed.enabled()).toBe(true);

    removed.set('');
    removed.markAsDirty();
    removed.markAsTouched();

    expect(removed()).toBe('');
    expect(removed.invalid()).toBe(true);
    expect(removed.dirty()).toBe(true);
    expect(removed.touched()).toBe(true);
    expect(names()).toEqual(['Lia']);
    expect(names.valid()).toBe(true);
    expect(names.pristine()).toBe(true);
    expect(names.untouched()).toBe(true);
  });

  it('sets values while preserving common node identities', () => {
    const sons = array(() => ({ name: field('') }), [{ name: 'Mono' }]);
    const first = sons.at(0)!;

    sons.set([{ name: 'Updated' }, { name: 'Lia' }]);

    expect(sons.at(0)).toBe(first);
    expect(sons()).toEqual([{ name: 'Updated' }, { name: 'Lia' }]);
    expect(sons.dirty()).toBe(false);
  });

  it('normalizes nullish complete values to an empty array', () => {
    const names = array(field(''), ['Marco']);
    const marco = names[0]!;

    names.set(null);

    expect(names()).toEqual([]);
    expect(marco.parent()).toBeNull();

    const lia = names.push('Lia');
    lia.markAsDirty();
    lia.markAsTouched();
    names.reset(undefined);

    expect(names()).toEqual([]);
    expect(names.pristine()).toBe(true);
    expect(names.untouched()).toBe(true);
    expect(lia.parent()).toBeNull();

    names.push('Noa');
    names.update(() => null);
    expect(names()).toEqual([]);

    names.push('Leo');
    names.set(undefined);
    expect(names()).toEqual([]);
  });

  it('normalizes a nullish initial value to an empty array', () => {
    expect(array(field(''), { initialValue: null })()).toEqual([]);
    expect(array(field(''), null)()).toEqual([]);
  });

  it('reconciles object item nodes by an explicit trackBy key', () => {
    const sons = array(
      { id: field('', { nullable: false }), name: field('') },
      [{ id: 'alex', name: 'Alex' }, { id: 'kirill', name: 'Kirill' }],
      { trackBy: value => value.id },
    );
    const alex = sons[0]!;
    const kirill = sons[1]!;
    alex.name.markAsTouched();

    sons.set([
      { id: 'kirill', name: 'Kirill updated' },
      { id: 'alex', name: 'Alex updated' },
    ]);

    expect(sons[0]).toBe(kirill);
    expect(sons[1]).toBe(alex);
    expect(sons()).toEqual([
      { id: 'kirill', name: 'Kirill updated' },
      { id: 'alex', name: 'Alex updated' },
    ]);
    expect(sons[0]!.path()).toEqual(['0']);
    expect(sons[1]!.path()).toEqual(['1']);
    expect(sons[1]!.name.touched()).toBe(true);
  });

  it('accepts a property name as a trackBy shorthand', () => {
    const people = array(
      { id: field('', { nullable: false }), name: field('') },
      [{ id: 'alex', name: 'Alex' }, { id: 'kirill', name: 'Kirill' }],
      { trackBy: 'id' },
    );
    const alex = people[0]!;
    const kirill = people[1]!;
    alex.markAsTouched();

    people.set([
      { id: 'kirill', name: 'Kirill updated' },
      { id: 'alex', name: 'Alex updated' },
    ]);

    expect(people[0]).toBe(kirill);
    expect(people[1]).toBe(alex);
    expect(alex.touched()).toBe(true);
    expect(alex.path()).toEqual(['1']);
  });

  it('updates programmatically through keyed reconciliation', () => {
    const people = array(
      { id: field('', { nullable: false }), name: field('') },
      [{ id: 'alex', name: 'Alex' }, { id: 'kirill', name: 'Kirill' }],
      { trackBy: value => value.id },
    );
    const alex = people[0]!;
    const kirill = people[1]!;

    people.update(value => [
      { ...value[1]!, name: 'Kirill updated' },
      { ...value[0]!, name: 'Alex updated' },
    ]);

    expect(people[0]).toBe(kirill);
    expect(people[1]).toBe(alex);
    expect(people()).toEqual([
      { id: 'kirill', name: 'Kirill updated' },
      { id: 'alex', name: 'Alex updated' },
    ]);
    expect(people.pristine()).toBe(true);
  });

  it('accepts nullable field values as trackBy keys', () => {
    const properties = array(
      { city: field(''), country: field('') },
      [{ city: null, country: 'Unknown' }, { city: 'Zurich', country: 'Switzerland' }],
      { trackBy: value => value.city },
    );
    const unknown = properties[0]!;
    const zurich = properties[1]!;

    properties.set([
      { city: 'Zurich', country: 'Switzerland' },
      { city: null, country: 'Updated' },
    ]);

    expect(properties[0]).toBe(zurich);
    expect(properties[1]).toBe(unknown);
    expect(properties[1]!.country()).toBe('Updated');
  });

  it('creates and detaches item nodes while reconciling by trackBy key', () => {
    const sons = array(
      { id: field('', { nullable: false }), name: field('') },
      [{ id: 'alex', name: 'Alex' }, { id: 'kirill', name: 'Kirill' }],
      { trackBy: value => value.id },
    );
    const alex = sons[0]!;
    const kirill = sons[1]!;

    sons.set([{ id: 'kirill', name: 'Kirill updated' }, { id: 'lia', name: 'Lia' }]);

    expect(sons[0]).toBe(kirill);
    expect(sons[1]).not.toBe(alex);
    expect(sons[1]!.name()).toBe('Lia');
    expect(alex.parent()).toBeNull();
  });

  it('preserves keyed node identity while reset clears interaction state', () => {
    const sons = array(
      { id: field('', { nullable: false }), name: field('') },
      [{ id: 'alex', name: 'Alex' }, { id: 'kirill', name: 'Kirill' }],
      { trackBy: value => value.id },
    );
    const alex = sons[0]!;
    const kirill = sons[1]!;
    alex.name.markAsDirty();
    alex.name.markAsTouched();

    sons.reset([
      { id: 'kirill', name: 'Kirill reset' },
      { id: 'alex', name: 'Alex reset' },
    ]);

    expect(sons[0]).toBe(kirill);
    expect(sons[1]).toBe(alex);
    expect(sons.pristine()).toBe(true);
    expect(sons.untouched()).toBe(true);
  });

  it('rejects duplicate trackBy keys without changing the array', () => {
    const sons = array(
      { id: field('', { nullable: false }), name: field('') },
      [{ id: 'alex', name: 'Alex' }, { id: 'kirill', name: 'Kirill' }],
      { trackBy: value => value.id },
    );
    const first = sons[0];
    const second = sons[1];

    expect(() => sons.set([
      { id: 'same', name: 'One' },
      { id: 'same', name: 'Two' },
    ])).toThrow('duplicate trackBy key same in incoming values');

    expect(sons()).toEqual([{ id: 'alex', name: 'Alex' }, { id: 'kirill', name: 'Kirill' }]);
    expect(sons[0]).toBe(first);
    expect(sons[1]).toBe(second);
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

  it('inherits control debounce into dynamic items and flushes current item subtrees', async () => {
    vi.useFakeTimers();
    try {
      const people = array({ name: field('') }, [], { debounce: 100 });
      const person = people.push({ name: 'Marco' });

      person.name.setControlValue('Mark');

      expect(person.name.controlValue()).toBe('Mark');
      expect(person.name()).toBe('Marco');
      expect(people()).toEqual([{ name: 'Marco' }]);
      expect(people.debouncing()).toBe(true);

      people.flush();

      expect(person.name()).toBe('Mark');
      expect(people()).toEqual([{ name: 'Mark' }]);
      expect(people.debouncing()).toBe(false);
      await vi.runAllTimersAsync();
    } finally {
      vi.useRealTimers();
    }
  });

  it('inherits blur debounce into items and flushes them from the array', () => {
    const names = array(field('initial'), 1, { debounce: 'blur' });
    const first = names[0]!;

    first.setControlValue('pending');
    expect(first.controlValue()).toBe('pending');
    expect(first()).toBe('initial');
    expect(names.controlValue()).toEqual(['initial']);
    expect(names.debouncing()).toBe(true);

    names.flush();
    expect(first()).toBe('pending');
    expect(names.controlValue()).toEqual(['pending']);
    expect(names.debouncing()).toBe(false);
  });

  it('buffers and flushes a control value bound directly to the array', () => {
    const names = array(field(''), ['Marco'], { debounce: 'blur' });

    (names as unknown as InternalNode).$api._setControlValue(['Mark', 'Lia']);

    expect(names.controlValue()).toEqual(['Mark', 'Lia']);
    expect(names()).toEqual(['Marco']);
    expect(names.debouncing()).toBe(true);
    expect(names.dirty()).toBe(true);

    names.flush();

    expect(names()).toEqual(['Mark', 'Lia']);
    expect(names.at(0)!.dirty()).toBe(false);
    expect(names.at(1)!.dirty()).toBe(false);
    expect(names.debouncing()).toBe(false);
  });

  it('flushes a direct control buffer when marked as touched', () => {
    const names = array(field(''), ['Marco'], { debounce: 'blur' });

    (names as unknown as InternalNode).$api._setControlValue(['Mark']);
    names.markAsTouched({ skipDescendants: true });

    expect(names()).toEqual(['Mark']);
    expect(names.touched()).toBe(true);
    expect(names.at(0)!.touched()).toBe(false);
    expect(names.debouncing()).toBe(false);
  });

  it('aborts and restores a pending direct control value on reset', () => {
    let abortSignal!: AbortSignal;
    const names = array(field(''), ['Marco'], {
      debounce: (signal) => {
        abortSignal = signal;
        return new Promise<void>(() => {});
      },
    });
    (names as unknown as InternalNode).$api._setControlValue(['pending']);

    names.reset();

    expect(abortSignal.aborted).toBe(true);
    expect(names.controlValue()).toEqual(['Marco']);
    expect(names()).toEqual(['Marco']);
    expect(names.pristine()).toBe(true);
    expect(names.debouncing()).toBe(false);
  });

  it('inherits a form control debounce through an array into future items', async () => {
    vi.useFakeTimers();
    try {
      const profile = form({
        names: array(field('')),
      }, { debounce: 100 });
      const name = profile.names.push('Marco');

      name.setControlValue('Mark');

      expect(profile.names.debouncing()).toBe(true);
      expect(profile.debouncing()).toBe(true);
      expect(profile()).toEqual({ names: ['Marco'] });

      profile.flush();

      expect(profile()).toEqual({ names: ['Mark'] });
      expect(profile.names.debouncing()).toBe(false);
      expect(profile.debouncing()).toBe(false);
      await vi.runAllTimersAsync();
    } finally {
      vi.useRealTimers();
    }
  });

  it('collects own and item errors in current structural order', () => {
    const names = array(field('', [required]), ['', 'David'], [
      () => ({ kind: 'arrayError' }),
    ]);

    expect(names.errors().map(error => error.kind)).toEqual(['arrayError']);
    expect(names.allErrors().map(error => error.kind)).toEqual(['arrayError', 'required']);
    expect(names.allErrors().map(error => error.targetNode)).toEqual([names, names[0]]);

    names.move(0, 1);

    expect(names.allErrors().map(error => error.targetNode)).toEqual([names, names[1]]);
    names.removeAt(1);
    expect(names.allErrors().map(error => error.kind)).toEqual(['arrayError']);
  });

  it('runs reactive validators on the array value', () => {
    const minimum = signal(2);
    const minimumItems = validator<readonly (string | null)[]>(({ value }) => {
      return value().length < minimum() ? { kind: 'minimumItems' } : null;
    });
    const names = array(() => field('Mono'), 1, {
      validators: [minimumItems],
    });

    expect(names.getError('minimumItems')).toMatchObject({ kind: 'minimumItems' });
    names.push('Lia');
    expect(names.errors()).toEqual([]);
    minimum.set(3);
    expect(names.invalid()).toBe(true);
  });

  it('validates unique item keys while preserving the error on the array', () => {
    const contacts = array(
      { email: field(''), name: field('') },
      [{ email: 'same@example.com', name: 'First' }, { email: 'same@example.com', name: 'Second' }],
      [uniqueItems('email')],
    );

    expect(contacts.getError('uniqueItems')).toMatchObject({
      duplicateIndexes: [0, 1],
      targetNode: contacts,
    });
    expect(contacts[0]!.errors()).toEqual([]);
    expect(contacts[1]!.errors()).toEqual([]);

    contacts[1]!.email.set('different@example.com');
    expect(contacts.errors()).toEqual([]);
  });

  it('exposes default built-in validator messages on aggregate nodes', () => {
    const names = array(field(''), [], [minLength(1)]);

    expect(names.errors()).toMatchObject([
      { kind: 'minLength', minLength: 1, message: 'Please provide at least 1 character or item.' },
    ]);
  });

  it('updates a reactive built-in validator message on the array value', () => {
    const message = signal('Add a name');
    const names = array(field(''), [], [minLength(1, { message: () => message() })]);

    expect(names.getError('minLength')?.message).toBe('Add a name');

    message.set('At least one name is required');
    expect(names.getError('minLength')?.message).toBe('At least one name is required');
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
    expect(names.validationStatus()).toBe('unknown');
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

  it('remains pending until every array-level asynchronous validator finishes', async () => {
    let resolveFirst!: (result: { kind: string }) => void;
    let resolveSecond!: (result: { kind: string }) => void;
    const names = array(field(''), ['Mono'], {
      validators: [
        asyncValidator(() => new Promise<{ kind: string }>((resolve) => { resolveFirst = resolve; })),
        asyncValidator(() => new Promise<{ kind: string }>((resolve) => { resolveSecond = resolve; })),
      ],
    });

    await Promise.resolve();
    resolveSecond({ kind: 'second' });
    await Promise.resolve();
    await Promise.resolve();

    expect(names.errors()).toMatchObject([{ kind: 'second' }]);
    expect(names.pending()).toBe(true);
    expect(names.validationStatus()).toBe('invalid');

    resolveFirst({ kind: 'first' });
    await Promise.resolve();
    await Promise.resolve();

    expect(names.errors()).toMatchObject([{ kind: 'first' }, { kind: 'second' }]);
    expect(names.pending()).toBe(false);
  });

  it('stops array-level reactive validation when its owning injector is destroyed', async () => {
    const blockedName = signal('blocked');
    const validate = vi.fn(async ({ value }) =>
      value().includes(blockedName()) ? { kind: 'blockedName' } : null,
    );
    const injector = Injector.create({ providers: [] });
    const names = array(field(''), ['Mono'], {
      validators: [asyncValidator(validate)],
      injector,
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();

    injector.destroy();
    blockedName.set('Mono');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(names.pending()).toBe(false);
    expect(names.errors()).toEqual([]);
  });

  it('owns async validation for field items created later by a factory', async () => {
    const dependency = signal('initial');
    const validate = vi.fn(async ({ value }) => {
      if (value() === 'David') dependency();
      return null;
    });
    const injector = Injector.create({ providers: [] });
    const names = array(() => field('', [asyncValidator(validate)]), { injector });

    const name = names.push('David');
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();

    injector.destroy();
    dependency.set('after destroy');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(name.pending()).toBe(false);
  });

  it('owns async validation for field items cloned from a template', async () => {
    const dependency = signal('initial');
    const validate = vi.fn(async ({ value }) => {
      if (value() === 'David') dependency();
      return null;
    });
    const injector = Injector.create({ providers: [] });
    const names = array(field('', [asyncValidator(validate)]), { injector });

    await Promise.resolve();
    await Promise.resolve();
    validate.mockClear();
    const name = names.push('David');
    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();

    injector.destroy();
    dependency.set('after destroy');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledOnce();
    expect(name.pending()).toBe(false);
  });

  it('respects an injector-inheritance boundary on items created later', async () => {
    const dependency = signal('initial');
    const validate = vi.fn(async () => {
      dependency();
      return null;
    });
    const injector = Injector.create({ providers: [] });
    const names = array(
      () => field('', [asyncValidator(validate)], { inheritInjector: false }),
      { injector },
    );

    names.push('David');
    await Promise.resolve();
    await Promise.resolve();
    injector.destroy();
    dependency.set('after destroy');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('preserves an injector-inheritance boundary when cloning a template', async () => {
    const dependency = signal('initial');
    const validate = vi.fn(async ({ value }) => {
      if (value() === 'David') dependency();
      return null;
    });
    const injector = Injector.create({ providers: [] });
    const names = array(
      field('', [asyncValidator(validate)], { inheritInjector: false }),
      { injector },
    );

    await Promise.resolve();
    await Promise.resolve();
    validate.mockClear();
    names.push('David');
    await Promise.resolve();
    await Promise.resolve();
    injector.destroy();
    dependency.set('after destroy');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('releases inherited ownership when an item is detached', async () => {
    const dependency = signal('initial');
    const validate = vi.fn(async () => {
      dependency();
      return null;
    });
    const injector = Injector.create({ providers: [] });
    const names = array(() => field('', [asyncValidator(validate)]), { injector });
    const name = names.push('David');

    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledOnce();

    names.removeAt(0);
    injector.destroy();
    dependency.set('after detach');
    await Promise.resolve();
    await Promise.resolve();

    expect(validate).toHaveBeenCalledTimes(2);
    expect(name.pending()).toBe(false);
  });

  it('aborts pending array-level validation when its owning injector is destroyed', async () => {
    let abortSignal: AbortSignal | undefined;
    let resolveValidation!: (result: { kind: string } | null) => void;
    const injector = Injector.create({ providers: [] });
    const names = array(field(''), ['Mono'], {
      validators: [asyncValidator(({ abortSignal: currentSignal }) => {
        abortSignal = currentSignal;
        return new Promise((resolve) => { resolveValidation = resolve; });
      })],
      injector,
    });

    await Promise.resolve();
    expect(names.pending()).toBe(true);

    injector.destroy();
    expect(abortSignal?.aborted).toBe(true);
    expect(names.pending()).toBe(false);

    resolveValidation({ kind: 'lateError' });
    await Promise.resolve();
    await Promise.resolve();
    expect(names.errors()).toEqual([]);
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

  it('propagates array disabled reasons to items while retaining item reasons', () => {
    const names = array(field('Marco'), 1);
    const item = names[0]!;

    item.disable('Item is fixed');
    names.disable('Collection is locked');

    expect(names.disabledReasons()).toEqual([{
      sourceNode: names,
      message: 'Collection is locked',
    }]);
    expect(item.disabledReasons()).toEqual([
      { sourceNode: names, message: 'Collection is locked' },
      { sourceNode: item, message: 'Item is fixed' },
    ]);

    names.enable();

    expect(names.disabledReasons()).toEqual([]);
    expect(item.disabledReasons()).toEqual([{
      sourceNode: item,
      message: 'Item is fixed',
    }]);
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
    expect(profile.sons.keyInParent()).toBe('sons');
    expect(profile.sons.at(0)!.keyInParent()).toBe(0);
    expect(profile.sons.at(0)!.aliases.keyInParent()).toBe('aliases');
    expect(profile.sons.at(0)!.aliases.at(0)!.keyInParent()).toBe(0);
    expect(profile.sons.at(0)!.name.path()).toEqual(['sons', '0', 'name']);
    expect(profile.sons.at(0)!.aliases.at(0)!.path()).toEqual(['sons', '0', 'aliases', '0']);
    expect(profile.sons.at(0)!.name.form()).toBe(profile);
  });

  it('patches existing indexes and warns for indexes outside the current structure', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const names = array(field(''), ['Mono']);

    names.patch(['Lia', 'ignored']);

    expect(names()).toEqual(['Lia']);
    expect(warning).toHaveBeenCalledWith('array: unknown index 1 ignored on patch');
    warning.mockRestore();
  });

  it('replaces validators and exposes required metadata and required errors', () => {
    const names = array(field(''), { validators: [required] });

    expect(names.required()).toBe(true);

    names.setValidators([() => ({ kind: 'required' })]);
    expect(names.required()).toBe(true);
    expect(names.getError('required')).toMatchObject({ kind: 'required' });
    names.setValidators([]);
    expect(names.required()).toBe(false);
  });

  it('creates initial template and factory items through the options object', () => {
    const people = array(
      { id: field('', { nullable: false }), name: field('') },
      {
        initialValue: [
          { id: 'marco', name: 'Marco' },
          { id: 'lia', name: 'Lia' },
        ],
        trackBy: person => person.id,
      },
    );
    const defaultNames = array(() => field('default'), { initialValue: 2 });
    const requiredNames = array(field(''), [required], { initialValue: [''] });

    expect(people()).toEqual([
      { id: 'marco', name: 'Marco' },
      { id: 'lia', name: 'Lia' },
    ]);
    expect(defaultNames()).toEqual(['default', 'default']);
    expect(requiredNames()).toEqual(['']);
    expect(requiredNames.required()).toBe(true);
    expect(requiredNames.valid()).toBe(true);
  });

  it('resets current items without replacing their values or identities', () => {
    const names = array(field(''), ['Mono']);
    const item = names[0]!;
    item.setControlValue('Lia');
    item.markAsTouched();

    names.reset();

    expect(names[0]).toBe(item);
    expect(names()).toEqual(['Lia']);
    expect(item.pristine()).toBe(true);
    expect(item.untouched()).toBe(true);
  });

  it('treats moving an item to its current index and clearing an empty array as no-ops', () => {
    const names = array(field(''), ['Mono']);
    const item = names[0];

    names.move(0, 0);
    expect(names[0]).toBe(item);
    names.clear();
    names.clear();
    expect(names()).toEqual([]);
  });

  it('rejects duplicate keys already present in current tracked items', () => {
    const names = array(
      { id: field('', { nullable: false }) },
      [{ id: 'one' }, { id: 'two' }],
      { trackBy: value => value.id },
    );
    names[1]!.id.set('one');

    expect(() => names.set([{ id: 'one' }]))
      .toThrow('array: duplicate trackBy key one in current items');
  });

  it('allows ordinary function properties while keeping numeric properties readonly', () => {
    const names = array(field(''), ['Mono']);
    (names as any).label = 'names';
    expect((names as any).label).toBe('names');
    expect('label' in names).toBe(true);
    expect(delete (names as any).label).toBe(true);
    expect('label' in names).toBe(false);
    expect((names as any)[Number.MAX_SAFE_INTEGER + 1]).toBeUndefined();
  });

  it('toggles its own readonly and hidden state', () => {
    const names = array(field(''), ['Mono']);

    names.markAsReadonly();
    expect(names.readonly()).toBe(true);
    names.markAsWritable();
    expect(names.writable()).toBe(true);
    names.hide();
    expect(names.hidden()).toBe(true);
    names.show();
    expect(names.visible()).toBe(true);
  });

  it('clones a form node used directly as its item template', () => {
    const template = form({ name: field('') });
    const people = array(template, 2);

    expect(people()).toEqual([{ name: '' }, { name: '' }]);
    expect(people[0]).not.toBe(template);
    expect(people[0]).not.toBe(people[1]);
  });
});
