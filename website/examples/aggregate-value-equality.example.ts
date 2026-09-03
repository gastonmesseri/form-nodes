import { field, form, group, type FormNodeValue } from 'form-nodes';

let submitted: unknown;
const profile = form({
  account: group({
    name: field.strict<string>('Marco'),
  }, {
    equal: (previous, next) => previous.name.toLowerCase() === next.name.toLowerCase(),
    validators: ({ value }) => value().name.length > 0 ? null : { kind: 'nameRequired' },
  }),
}, {
  submission: { action: (_node, value) => { submitted = value; } },
});

const initial = profile();
profile.account.name.set('MARCO');
profile.account.name(); // 'MARCO': the child accepts the new value
profile.account(); // { name: 'Marco' }: the group retains an equivalent public value
profile(); // { account: { name: 'Marco' } }: public parents compose public child values

if (profile.account.name() !== 'MARCO' || profile() !== initial || !profile.valid()) {
  throw new Error('Aggregate equality must preserve the exposed value independently of child storage.');
}

await profile.submit();
if (submitted !== initial) {
  throw new Error('Submission must receive the same exposed value that the form returns.');
}

profile.reset();
profile.account.name(); // 'MARCO': reset preserves the current child value
if (profile.account.name() !== 'MARCO' || profile.touched() || profile.dirty()) {
  throw new Error('Reset must preserve child values and clear interaction state.');
}

let updateInput: FormNodeValue<typeof profile.account> | undefined;
profile.account.update((value) => {
  updateInput = value;
  return { name: `${value.name}!` };
});
profile.account.name(); // 'Marco!': update receives the exposed group value
if (updateInput !== initial.account || profile.account.name() !== 'Marco!') {
  throw new Error('Update callbacks must receive the exposed value.');
}
