import { array, field, form, type FormValueContract } from '@gem/ng-forms';

type Profile = {
  username: string | null;
  items: (string | null)[];
};

const profile = form({
  username: field(''),
  items: array(field('')),
}) satisfies FormValueContract<Profile>;

const value: Profile = profile();

profile.items.push('Angular');

void value;
