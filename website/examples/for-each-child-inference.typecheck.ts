import { field, form } from '@ngblocks/form-nodes';

const profile = form({ username: field(''), age: field(2) });
profile.forEachChild(child => {
  // child is the union of the username and age node types.
  const value: string | number | null = child();
  console.log(value);
  child.markAsTouched();
  // set('') would be rejected: a numeric field cannot accept a string.
});

const contact = form({ username: field(''), email: field('') });
contact.forEachChild(child => child.set('')); // Both fields accept strings.
