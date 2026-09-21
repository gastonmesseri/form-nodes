import { array, field, form } from '../../src/public-api';

array(field(''), 1, { debounce: 'blur' });
array(field(''), 1, { debounce: abortSignal => Promise.resolve(void abortSignal.aborted) });
array(field(''), 1, { inheritInjector: false });
array(field(''), 1, { adoptBindingInjector: false });

import type { Equal, Expect } from './assert.types';

const people = array({
  id: field.strict(''),
  name: field(''),
  age: field(0),
}, [{ id: 'one', name: 'David', age: 42 }], {
  trackBy: (value, index) => {
    const _value: { id: string; name: string | null; age: number | null } = value;
    const _index: number = index;
    return _value.id ?? _index;
  },
});
type _ArrayNodeType = Expect<Equal<ReturnType<typeof people.nodeType>, 'array'>>;
const names = array(field(''), ['David']);
const lockedNames = array(field(''), { disabled: 'Collection is locked' });
type _StableApiValue = Expect<Equal<ReturnType<typeof names.$api.value>, string[]>>;
type _ControlValue = Expect<Equal<ReturnType<typeof names.value.control>, string[]>>;
type _StandaloneRoot = Expect<Equal<ReturnType<typeof names.root>, typeof names>>;
lockedNames.disable('Temporarily unavailable');
const matrix = array(array(field(0), []), [[1, 2]]);
const forms = array(form({ enabled: field.strict(true) }), [{ enabled: true }]);
const optionPeople = array({
  id: field.strict(''),
  name: field(''),
}, {
  initialValue: [{ id: 'one', name: 'David' }],
  trackBy: 'id',
});
const optionNames = array(() => field(''), { initialValue: 2 });
const directory = form({ people: array({ name: field('') }, 1) });

type PersonValue = { id: string; name: string; age: number };
type _PeopleValue = Expect<Equal<ReturnType<typeof people>, PersonValue[]>>;
type _NameValue = Expect<Equal<ReturnType<typeof names>, string[]>>;
type _MatrixValue = Expect<Equal<ReturnType<typeof matrix>, number[][]>>;
type _FormTemplateValue = Expect<Equal<ReturnType<typeof forms>, { enabled: boolean }[]>>;
type _OptionPeopleValue = Expect<Equal<ReturnType<typeof optionPeople>, { id: string; name: string }[]>>;
type _OptionNamesValue = Expect<Equal<ReturnType<typeof optionNames>, string[]>>;
type _IndexedNameValue = Expect<Equal<ReturnType<NonNullable<typeof names[0]>>, string>>;
type _ArrayItemKeyInParent = Expect<Equal<ReturnType<NonNullable<typeof names[0]>['keyInParent']>, number | null>>;
type _ArrayFormKeyInParent = Expect<Equal<ReturnType<NonNullable<typeof people[0]>['keyInParent']>, number | null>>;
type _NestedArrayKeyInParent = Expect<Equal<ReturnType<typeof directory.people.keyInParent>, string>>;
type _NestedArrayItemKeyInParent = Expect<Equal<ReturnType<NonNullable<typeof directory.people[0]>['keyInParent']>, number | null>>;
type _NestedArrayForm = Expect<Equal<ReturnType<typeof directory.people.form>, typeof directory | null>>;
type _NestedArrayRoot = Expect<Equal<ReturnType<typeof directory.people.root>, typeof directory>>;
type _MappedNames = Expect<Equal<ReturnType<typeof names.map<string | null>>, (string | null)[]>>;

people.push({ id: 'two', name: 'Daniel', age: 35 });
people.insert(0, { id: 'zero', name: '', age: 0 });
people.moveUp(1);
people.moveDown(0);
people.move(0, 1);
people.swap(0, 1);
people.set([{ id: 'three', name: 'Ada', age: 37 }]);
people.patch([{ id: 'grace', name: 'Grace', age: 30 }]);
people.at(0)?.patch({ name: 'Grace' });
people.update((value) => [...value, { id: 'four', name: '', age: 0 }]);
people.focus({ preventScroll: true });

people.set(null);
people.reset(undefined);
people.update(() => null);
array(field(''), { initialValue: null });
array(field(''), null);

// @ts-expect-error arrays inherit submission state but cannot own submission behavior
array(field(''), { onSubmit: () => undefined });
// @ts-expect-error trackBy property names must exist on the item value
array({ id: field.strict('') }, { trackBy: 'missing' });
// @ts-expect-error primitive item values require a trackBy callback
array(field.strict(''), { trackBy: 'length' });

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

// @ts-expect-error only forms own blocked submission callbacks
array(field(''), { onSubmitBlocked: () => undefined });
// @ts-expect-error only forms configure submission validation gates
array(field(''), { submitWhen: 'valid' });

const draft = people.templateValue();
type _TemplateValue = Expect<Equal<typeof draft, { id: string; name: string; age: number }>>;
type _TemplateFacadeValue = Expect<Equal<ReturnType<typeof people.$api.templateValue>, typeof draft>>;
type _FieldTemplateValue = Expect<Equal<ReturnType<typeof names.templateValue>, string>>;
type _NestedTemplateValue = Expect<Equal<ReturnType<typeof matrix.templateValue>, number[]>>;
people.push(draft);
const generated = array(() => ({ id: field.strict(1) }));
type _FactoryTemplateValue = Expect<Equal<ReturnType<typeof generated.templateValue>, { id: number }>>;
// @ts-expect-error Template values preserve child value types.
draft.age = 'invalid';

const configuredRows = array({ code: field<string>(null), value: field('') }, {
  configureEach(api) {
    type _Code = Expect<Equal<ReturnType<typeof api.children.code>, string | null>>;
    type _Value = Expect<Equal<ReturnType<typeof api>, { code: string | null; value: string }>>;
    api.children.code.onValueChange(() => api.patch({ value: '' }));
    // @ts-expect-error row values retain their declared types
    api.patch({ value: 123 });
  },
});
type _ConfiguredRows = Expect<Equal<ReturnType<typeof configuredRows>, { code: string | null; value: string }[]>>;
array(field(0), 2, {
  configureEach(api) {
    type _Value = Expect<Equal<ReturnType<typeof api>, number>>;
    api.set(1);
    // @ts-expect-error field configuration preserves the numeric value contract
    api.set('wrong');
  },
});
array(() => form({ code: field('') }), {
  configureEach(api) {
    type _Code = Expect<Equal<ReturnType<typeof api.children.code>, string>>;
    api.patch({ code: 'ready' });
  },
});
array(() => field(false), [true], {
  configureEach(api) {
    type _Value = Expect<Equal<ReturnType<typeof api>, boolean>>;
    api.set(false);
  },
});
array(array(field('')), {
  configureEach(api) {
    type _Value = Expect<Equal<ReturnType<typeof api>, string[]>>;
    api.push('ready');
  },
});

const lengthRows = array({ name: field('') }, { initialLength: 3 });
type _LengthRows = Expect<Equal<ReturnType<typeof lengthRows>, { name: string }[]>>;
array(() => field(0), { initialLength: 2, configureEach: api => api.set(1) });
array(field(''), () => null, { initialLength: 2 });
array(field(''), 2, { debounce: 'blur' });
array(field(''), ['Ada'], { debounce: 'blur' });
// @ts-expect-error use one initial option
array(field(''), { initialLength: 1, initialValue: ['Ada'] });
// @ts-expect-error numeric initialValue is also an initial source
array(field(''), { initialLength: 1, initialValue: 1 });
// @ts-expect-error null is an explicit empty initial value
array(field(''), { initialLength: 1, initialValue: null });
// @ts-expect-error a positional count excludes initialLength
array(field(''), 1, { initialLength: 1 });
// @ts-expect-error positional values exclude initialLength
array(field(''), ['Ada'], { initialLength: 1 });
// @ts-expect-error factories follow the same exclusivity rule
array(() => field(''), 1, () => null, { initialLength: 1 });
// @ts-expect-error length must be a number
array(field(''), { initialLength: '3' });
const conflictingLengthOptions = { initialLength: 1, debounce: 'blur' as const };
// @ts-expect-error positional exclusivity also applies to option variables
array(field(''), 1, conflictingLengthOptions);
