import { array, field, form } from '@ngblocks/form-nodes';

const profile = form({
  selections: array(field<{ id: string } | null | undefined>(null), {
    initialValue: [
      { id: 'ada' },
      null,
    ],
    trackBy: 'id',
  }),
});

const emptySelection = profile.selections[1];
profile.selections.set([
  undefined,
  { id: 'ada' },
]);

if (profile.selections[0] !== emptySelection || profile.selections[0]?.() !== undefined) {
  throw new Error('Null and undefined should reuse the item with an undefined tracking key.');
}

let duplicateRejected = false;
try {
  profile.selections.set([null, null]);
} catch (error) {
  duplicateRejected = error instanceof Error && error.message.includes('duplicate trackBy key undefined');
}
if (!duplicateRejected || profile.selections[0] !== emptySelection || profile.selections[1]?.()?.id !== 'ada') {
  throw new Error('Duplicate keys must be rejected before applying the incoming values.');
}

profile.selections.set(null);
profile.selections(); // []

if (profile.selections.length() !== 0 || emptySelection?.parent() !== null) {
  throw new Error('Clearing should detach every item.');
}

const first = profile.selections.push({ id: 'ada' });
const duplicate = profile.selections.push({ id: 'ada' });
first.markAsDirty();
first.markAsTouched();
profile.selections.set([{ id: 'ada' }]);
profile.selections.length(); // 1

if (profile.selections[0] !== first || duplicate.parent() !== null) {
  throw new Error('Reconciliation must reuse the first current match and detach duplicate rows.');
}
if (!first.dirty() || !first.touched()) {
  throw new Error('A reused row must preserve its interaction state through set().');
}
