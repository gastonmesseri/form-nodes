import { array, field, form } from '@ngblocks/form-nodes';

const profile = form({
  name: field('Ada'),                     // string
  nickname: field.nullable(''),           // string | null
  email: field<string>(null),             // string | null
  code: field<string>(undefined),         // string | undefined
  age: field<number>(),                  // number | null, initially null
  roles: array({ name: field('') }),
});

profile.name.set('Grace');
profile.nickname.set(null);
profile.email.set('grace@example.com');
profile.code.set('A');
profile.roles.push({ name: 'admin' });

if (profile.name() !== 'Grace' || profile.nickname() !== null
  || profile.email() !== 'grace@example.com' || profile.code() !== 'A'
  || profile.age() !== null || profile.roles[0]?.name() !== 'admin') {
  throw new Error('Fields and aggregate values must preserve their declared value contracts.');
}

profile.code.resetToInitial();
profile.name.reset();
if (profile.code() !== undefined || profile.name() !== 'Grace') {
  throw new Error('Reset preserves the current value; resetToInitial restores explicit undefined.');
}
