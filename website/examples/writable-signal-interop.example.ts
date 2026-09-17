import { computed, type WritableSignal } from '@angular/core';
import { array, field, form } from '@ngblocks/form-nodes';

function increment(value: WritableSignal<number>) {
  value.update(current => current + 1);
}

const profile = form({
  age: field.strict(18),
  users: array({ username: field('') }),
});

increment(profile.age);
profile.age(); // 19

const age = profile.age.asReadonly();
const doubled = computed(() => age() * 2);
if (doubled() !== 38 || age !== profile.age.$api.asReadonly()) {
  throw new Error('Readonly views must share identity and track the exposed value.');
}

profile.age.set(20);
if (doubled() !== 40 || profile.dirty()) {
  throw new Error('External writes must propagate without marking the form dirty.');
}

function append<T>(items: WritableSignal<T[]>, value: T) {
  items.update(current => [...current, value]);
}

append(profile.users, { username: 'Ada' });
if (profile.users.at(0)?.username() !== 'Ada') {
  throw new Error('Writable array utilities must update the live form tree.');
}

// Use the API facade when a child name shadows an operation.
const labels = form({ set: field('draft') });
const writable: WritableSignal<{ set: string | null }> = labels.$api;
writable.set({ set: 'published' });
if (labels.set() !== 'published') {
  throw new Error('The API facade must preserve child-name collisions.');
}
