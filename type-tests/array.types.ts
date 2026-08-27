import { array, field, form } from '../src/public-api';

array(field(''), 1, { debounce: 'blur' });
array(field(''), 1, { debounce: abortSignal => Promise.resolve(void abortSignal.aborted) });

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
const lockedNames = array(field(''), { disabled: 'Collection is locked' });
type _StableApiValue = Expect<Equal<ReturnType<typeof names.$api.value>, (string | null)[]>>;
type _ControlValue = Expect<Equal<ReturnType<typeof names.controlValue>, (string | null)[]>>;
lockedNames.disable('Temporarily unavailable');
const matrix = array(array(field(0), []), [[1, 2]]);
const forms = array(form({ enabled: field(true, { nullable: false }) }), [{ enabled: true }]);
const optionPeople = array({
  id: field('', { nullable: false }),
  name: field(''),
}, {
  initialValue: [{ id: 'one', name: 'David' }],
  trackBy: value => value.id,
});
const optionNames = array(() => field(''), { initialValue: 2 });
const directory = form({ people: array({ name: field('') }, 1) });

type PersonValue = { id: string; name: string | null; age: number | null };
type _PeopleValue = Expect<Equal<ReturnType<typeof people>, PersonValue[]>>;
type _NameValue = Expect<Equal<ReturnType<typeof names>, (string | null)[]>>;
type _MatrixValue = Expect<Equal<ReturnType<typeof matrix>, (number | null)[][]>>;
type _FormTemplateValue = Expect<Equal<ReturnType<typeof forms>, { enabled: boolean }[]>>;
type _OptionPeopleValue = Expect<Equal<ReturnType<typeof optionPeople>, { id: string; name: string | null }[]>>;
type _OptionNamesValue = Expect<Equal<ReturnType<typeof optionNames>, (string | null)[]>>;
type _IndexedNameValue = Expect<Equal<ReturnType<NonNullable<typeof names[0]>>, string | null>>;
type _ArrayItemKeyInParent = Expect<Equal<ReturnType<NonNullable<typeof names[0]>['keyInParent']>, number | null>>;
type _ArrayFormKeyInParent = Expect<Equal<ReturnType<NonNullable<typeof people[0]>['keyInParent']>, number | null>>;
type _NestedArrayKeyInParent = Expect<Equal<ReturnType<typeof directory.people.keyInParent>, string>>;
type _NestedArrayItemKeyInParent = Expect<Equal<ReturnType<NonNullable<typeof directory.people[0]>['keyInParent']>, number | null>>;
type _MappedNames = Expect<Equal<ReturnType<typeof names.map<string | null>>, (string | null)[]>>;

people.push({ id: 'two', name: 'Daniel', age: 35 });
people.insert(0, { id: 'zero', name: null, age: null });
people.moveUp(1);
people.moveDown(0);
people.move(0, 1);
people.swap(0, 1);
people.set([{ id: 'three', name: 'Ada', age: 37 }]);
people.patch([{ name: 'Grace' }]);
people.update((value) => [...value, { id: 'four', name: null, age: null }]);
people.focus({ preventScroll: true });

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
// @ts-expect-error options cannot provide a second initial value after a positional initial value
array({ name: field('') }, [{ name: 'David' }], { initialValue: [{ name: 'Lia' }] });
// @ts-expect-error option initial values are inferred from the template
array({ name: field(''), age: field(0) }, { initialValue: [{ name: 'David' }] });
// @ts-expect-error item values must match the template value
people.push({ id: 'two', name: 'Daniel', age: '35' });
// @ts-expect-error numeric node access is readonly
people[0] = people[1];
