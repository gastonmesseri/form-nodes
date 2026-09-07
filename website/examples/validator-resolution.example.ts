import { computed, signal } from '@angular/core';

import { field, form, required } from '@ngblocks/form-nodes';

const requireName = signal(true);
const optionalName = () => null;
const nameRules = () => requireName() ? required : optionalName;
const profile = form({
  name: field('', [nameRules]),
});
const includesRequired = computed(() => profile.name.hasValidator(required, { resolve: true }));

profile.name.validators(); // [nameRules]
profile.name.validators({ resolve: true }); // [required]
profile.name.hasValidator(required); // false
includesRequired(); // true

if (profile.name.validators()[0] !== nameRules
  || profile.name.validators({ resolve: true })[0] !== required
  || profile.name.hasValidator(required) || !includesRequired()) {
  throw new Error('Resolved queries must follow returned validators without changing registration.');
}

profile.name.set('Marco');
profile.name.hasError('required'); // false
includesRequired(); // true: a passing validator is still present

if (profile.name.hasError('required') || !includesRequired()) {
  throw new Error('Resolved presence must not depend on whether the validator fails.');
}

requireName.set(false);
profile.name.validators({ resolve: true }); // [optionalName]
includesRequired(); // false

if (profile.name.validators({ resolve: true })[0] !== optionalName || includesRequired()) {
  throw new Error('Resolved queries must react to changes in composition dependencies.');
}
