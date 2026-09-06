import { computed, signal } from '@angular/core';

import { array, field, form, required } from '@gem/ng-forms';

const initialName = signal('Marco');
const profile = computed(() => {
  return form({
    details: { name: field(initialName(), [required]) },
    contacts: array({
      email: field(''),
    }, {
      initialValue: [{ email: 'marco@example.com' }],
    }),
  });
});

const first = profile();
first.details.name(); // 'Marco'
first.contacts[0]!.email(); // 'marco@example.com'

if (first.details.name() !== 'Marco' || first.contacts[0]!.email() !== 'marco@example.com' || !first.valid()) {
  throw new Error('The computed declaration should initialize nested values and validation.');
}

first.details.name.set('Lia');
first.markAsTouched();
if (profile() !== first || profile().details.name() !== 'Lia' || !first.touched()) {
  throw new Error('Editing the constructed tree should preserve its identity and interaction state.');
}

initialName.set('Noa');
const second = profile();
second.details.name(); // 'Noa'
if (second === first || second.details.name() !== 'Noa' || second.touched()) {
  throw new Error('Changing a declaration input should construct a fresh tree with fresh state.');
}
if (first.details.name() !== 'Lia' || second.contacts[0]!.email.parent() !== second.contacts[0]) {
  throw new Error('Each constructed tree should retain its own values and parent links.');
}
