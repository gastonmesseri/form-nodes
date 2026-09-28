import { array, field, form, uniqueItems } from '@ngblocks/form-nodes';

type Selection = { id?: string | null } | null | undefined;

const profile = form({
  selections: array(field<Selection>(null), {
    initialValue: [
      { id: 'ada' },
      null,
    ],
    validators: uniqueItems('id'),
  }),
});
profile.valid(); // true

if (!profile.valid()) {
  throw new Error('One missing key must be allowed alongside a distinct ID.');
}

profile.selections.set([null, undefined]);
profile.selections.getError('uniqueItems')?.duplicateIndexes; // [0, 1]
profile.invalid(); // true

const duplicates = profile.selections.getError('uniqueItems')?.duplicateIndexes;
if (duplicates?.length !== 2 || duplicates[0] !== 0 || duplicates[1] !== 1 || !profile.invalid()) {
  throw new Error('Repeated undefined keys must produce a validation error on the array.');
}
if (profile.selections[0]?.() !== null || profile.selections[1]?.() !== undefined) {
  throw new Error('Uniqueness validation must preserve the supplied nullable values.');
}

profile.selections.set([
  { id: null },
  null,
]);
profile.valid(); // true

if (!profile.valid() || profile.allErrors().length !== 0) {
  throw new Error('A null ID must remain distinct from a missing item key.');
}
