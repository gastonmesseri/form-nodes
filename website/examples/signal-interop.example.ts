import { field, form } from '@ngblocks/form-nodes';
import { computed, isSignal, type Signal } from '@angular/core';

const uppercase = (source: Signal<string | null>) => computed(() => source()?.toUpperCase() ?? '');
const profile = form({ name: field('Marco') });
const displayName = uppercase(profile.name);

isSignal(profile.name); // true
displayName(); // 'MARCO'

if (!isSignal(profile.name) || !isSignal(profile) || displayName() !== 'MARCO') {
  throw new Error('Nodes must be usable as Angular signals.');
}

profile.name.set('Lia');
displayName(); // 'LIA'

if (displayName() !== 'LIA') {
  throw new Error('Signal consumers must observe updated node values.');
}
