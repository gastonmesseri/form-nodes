import { computed } from '@angular/core';
import { field, form, required } from '@ngblocks/form-nodes';

const profile = form({
  name: field('', [required]),
  address: { city: field('', [required]) },
});

const summary = computed(() => profile.errors({ descendants: true }));
profile.errors().length; // 0
summary().length; // 2
summary()[0]?.targetNode === profile.name; // true
profile.allErrors() === summary(); // true

if (profile.errors().length !== 0) throw new Error('Child errors must not become own errors.');
if (summary().length !== 2) throw new Error('The summary must include both required fields.');
if (summary()[0]?.targetNode !== profile.name) throw new Error('Errors must retain their targets.');
if (profile.allErrors() !== summary()) throw new Error('Both queries must share their cached array.');

profile.name.set('Ada');
profile.address.city.set('Zurich');
summary().length; // 0
if (summary().length !== 0) throw new Error('The query must react to corrected descendants.');
