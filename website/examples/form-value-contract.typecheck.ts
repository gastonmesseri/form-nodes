import { field, form, type FormValueContract } from '@ngblocks/form-nodes';

type Profile = {
  username: string | null;
  age: number | null;
  country: string;
};

const profile = form({
  username: field(''),
  age: field(0),
  country: field.strict<string>('Switzerland'),
}) satisfies FormValueContract<Profile>;

const value: Profile = profile(); // { username: '', age: 0, country: 'Switzerland' }

void value;
