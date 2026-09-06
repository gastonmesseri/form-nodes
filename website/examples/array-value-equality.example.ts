import { array, field, form } from 'form-nodes';

let submitted: unknown;
const profile = form({
  contacts: array({
    name: field.strict<string>(''),
  }, {
    initialValue: [{ name: 'Marco' }],
    equal: (previous, next) => {
      return previous.length === next.length
        && previous.every((contact, index) => contact.name.toLowerCase() === next[index]!.name.toLowerCase());
    },
  }),
}, {
  submission: { action: (_node, value) => { submitted = value; } },
});

const initial = profile();
profile.contacts[0]!.name.setControlValue('MARCO');
profile.contacts[0]!.name(); // 'MARCO': the item accepts the new value
profile.contacts(); // [{ name: 'Marco' }]: array equality retains the exposed snapshot
profile(); // { contacts: [{ name: 'Marco' }] }: parents compose exposed child values

if (profile.contacts[0]!.name() !== 'MARCO' || profile() !== initial || !profile.dirty()) {
  throw new Error('Array equality should preserve the public value while item values and interaction change.');
}

await profile.submit();
if (submitted !== initial) {
  throw new Error('Submission should receive the exposed form value.');
}

profile.reset();
profile.contacts[0]!.name(); // 'MARCO': reset preserves the current committed value
if (profile.contacts[0]!.name() !== 'MARCO' || profile() !== initial || profile.dirty() || profile.touched()) {
  throw new Error('Reset should preserve committed items and clear interaction independently of equality.');
}

profile.contacts.update(contacts => contacts.map(contact => ({ name: `${contact.name}!` })));
profile.contacts[0]!.name(); // 'Marco!': update receives the exposed array value
if (profile.contacts[0]!.name() !== 'Marco!') {
  throw new Error('Array update should receive the exposed value.');
}
