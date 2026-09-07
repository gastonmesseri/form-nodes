import { signal } from '@angular/core';
import { field, min } from '../../src/public-api';

const errorKind = signal('minimumAge');
const age = field(16, [
  min(18, { error: ({ value }) => ({ kind: errorKind(), actual: value(), minimum: 18 }) })
]);

if (age.errors()[0]?.kind !== 'minimumAge') {
  throw new Error('The custom error should replace the built-in minimum error.');
}

errorKind.set('minimumEmploymentAge');
if (age.errors()[0]?.kind !== 'minimumEmploymentAge') {
  throw new Error('Signals read by the error function should remain reactive.');
}

const optionalMinimum = field(16, [min(18, { error: () => [] })]);
if (!optionalMinimum.valid()) {
  throw new Error('An empty custom error list should suppress the failed rule.');
}
