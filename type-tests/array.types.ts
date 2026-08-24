import { array, field, form } from '../src/public-api';

import type { Equal, Expect } from './assert.types';

const people = array({
  id: field('', { nullable: false }),
  name: field(''),
  age: field(0),
}, [{ id: 'one', name: 'David', age: 42 }], {
  trackBy: (value, index) => {
    const _value: { id: string; name: string | null; age: number | null } = value;
    const _index: number = index;
    return _value.id ?? _index;
  },
});
const names = array(field(''), ['David']);
const matrix = array(array(field(0), []), [[1, 2]]);
const forms = array(form({ enabled: field(true, { nullable: false }) }), [{ enabled: true }]);

type PersonValue = { id: string; name: string | null; age: number | null };
type _PeopleValue = Expect<Equal<ReturnType<typeof people>, PersonValue[]>>;
type _NameValue = Expect<Equal<ReturnType<typeof names>, (string | null)[]>>;
type _MatrixValue = Expect<Equal<ReturnType<typeof matrix>, (number | null)[][]>>;
type _FormTemplateValue = Expect<Equal<ReturnType<typeof forms>, { enabled: boolean }[]>>;
type _IndexedNameValue = Expect<Equal<ReturnType<NonNullable<typeof names[0]>>, string | null>>;
type _MappedNames = Expect<Equal<ReturnType<typeof names.map<string | null>>, (string | null)[]>>;

people.push({ id: 'two', name: 'Daniel', age: 35 });
people.insert(0, { id: 'zero', name: null, age: null });
people.set([{ id: 'three', name: 'Ada', age: 37 }]);
people.patch([{ name: 'Grace' }]);
people.update((value) => [...value, { id: 'four', name: null, age: null }]);

people.forEach((item, index, owner) => {
  const _name: string | null = item.name();
  const _index: number = index;
  const _owner: typeof people = owner;
  void [_name, _index, _owner];
});

// @ts-expect-error every initial item must contain all template properties
array({ name: field(''), age: field(0) }, [{ name: 'David' }]);
// @ts-expect-error initial items cannot contain properties absent from the template
array({ name: field('') }, [{ name: 'David', age: 42 }]);
// @ts-expect-error item values must match the template value
people.push({ id: 'two', name: 'Daniel', age: '35' });
// @ts-expect-error numeric node access is readonly
people[0] = people[1];
