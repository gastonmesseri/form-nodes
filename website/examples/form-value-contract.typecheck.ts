import { field, form, type FormValueContract } from '@gem/ng-forms';

type Profile = {
  username: string | null;
  age: number | null;
};

const profile = form({
  username: field(''),
  age: field(0),
}) satisfies FormValueContract<Profile>;

const value: Profile = profile();

void value;
