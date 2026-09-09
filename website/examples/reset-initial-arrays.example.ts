import { array, field, form } from '@ngblocks/form-nodes';

const profile = form({
  contacts: array({ id: field.strict(0), name: field.strict('Template') }, {
    initialValue: [{ id: 1, name: 'Ada' }, { id: 2, name: 'Lin' }],
    trackBy: 'id',
  }),
});

const ada = profile.contacts[0];
profile.contacts.set([{ id: 2, name: 'Edited' }, { id: 1, name: 'Edited' }, { id: 3, name: 'New' }]);
profile.contacts.resetToInitial();
profile.contacts(); // [{ id: 1, name: 'Ada' }, { id: 2, name: 'Lin' }]
if (profile.contacts[0] !== ada || profile.contacts.length() !== 2 || profile.contacts[1]!.name() !== 'Lin') {
  throw new Error('Restoration should recover initial rows and preserve matching keyed nodes.');
}

profile.contacts[0]!.name.set('Changed again');
profile.contacts[0]!.name.resetToInitial();
profile.contacts[0]!.name(); // 'Ada'
if (profile.contacts[0]!.name() !== 'Ada') throw new Error('Effective item values should override template defaults.');

let nextId = 0;
const generated = form({
  contacts: array(() => ({ id: field.strict(++nextId) }), {
    initialValue: 2,
  }),
});

generated.contacts.clear();
generated.contacts.resetToInitial();
generated.contacts(); // [{ id: 1 }, { id: 2 }]
if (nextId !== 4 || generated.contacts[0]!.id() !== 1 || generated.contacts[1]!.id() !== 2) {
  throw new Error('Factories may rebuild nodes, but restored data must use the captured IDs.');
}
