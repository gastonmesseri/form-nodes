import { computed, isSignal } from '@angular/core';
import { field, form, array, isFormNode } from '@ngblocks/form-nodes';

const profile = form({
  submitted: field('draft'),
  value: field('child value'),
  api: field('child api'),
  names: array(field(''), { initialValue: ['Ada'] }),
});
const api = profile.$api;
const snapshot = computed(() => api());

api(); // { submitted: 'draft', value: 'child value', api: 'child api', names: ['Ada'] }
api.submitted(); // false
api.children.submitted(); // 'draft'
api.value(); // { submitted: 'draft', value: 'child value', api: 'child api', names: ['Ada'] }
if (!isSignal(api) || isFormNode(api)) throw new Error('The API must be an Angular signal, not a node declaration.');

await api.submit();
if (!api.submitted() || profile.submitted() !== 'draft') throw new Error('Child names must not overwrite API state.');
api.patch({ value: 'updated' });
if (snapshot().value !== 'updated') throw new Error('Callable API reads must track exposed value changes.');

profile.names.$api.push('Grace');
profile.names.$api(); // ['Ada', 'Grace']
profile.names.$api.length(); // 2
if (profile.names.$api.length() !== 2) throw new Error('The array API must preserve its length signal.');

api.resetToInitial();
if (api.submitted() || snapshot().value !== 'child value') throw new Error('API actions must preserve reset behavior.');
