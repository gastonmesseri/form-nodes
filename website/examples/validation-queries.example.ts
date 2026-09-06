import { computed } from '@angular/core';

import { field, form, minLength, required } from '@ngblocks/form-nodes';

const minimumNameLength = minLength(3);
const profile = form({ name: field('', [required, minimumNameLength]) });
const missingName = computed(() => profile.name.hasError('required'));

profile.name.hasError('required'); // true
profile.hasError('required'); // false: the error belongs to the child
profile.name.hasValidator(required); // true
profile.name.hasValidator(minimumNameLength); // true
profile.name.hasValidator(minLength(3)); // false: a different function instance

if (!missingName() || profile.hasError('required') || !profile.name.hasValidator(required)
  || !profile.name.hasValidator(minimumNameLength) || profile.name.hasValidator(minLength(3))) {
  throw new Error('Queries must distinguish own errors from registered validator identities.');
}

profile.name.set('Marco');
missingName(); // false
profile.name.hasValidator(required); // true: still registered, now passing

if (missingName() || !profile.name.hasValidator(required)) {
  throw new Error('Passing validation must clear the error without removing the validator.');
}

profile.name.setValidators([]);
profile.name.hasValidator(required); // false

if (profile.name.hasValidator(required)) {
  throw new Error('Validator queries must reflect replacement of the registered validators.');
}
