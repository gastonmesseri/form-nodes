import type { Equal, Expect } from './assert.types';
import { array, field, form, type ArrayPatch, type ArraySet } from '../../src/public-api';

const profile = form({
  username: field(''),
  age: field<number>(undefined),
  details: { cities: array({ city: field(''), country: field(''), aliases: array(field('')) }) },
});
type Item = NonNullable<ReturnType<typeof profile.details.cities.at>>;
type _CompletePatch = Expect<Equal<ArrayPatch<Item>, ArraySet<Item>>>;
profile.patch({ details: { cities: [{ city: 'Rabat', country: 'Morocco', aliases: [] }] } });
profile.patch({ age: undefined, details: { cities: undefined } });
profile.details.cities.patch(null);
profile.details.cities.patch(undefined);
profile.details.cities.at(0)?.patch({ city: 'Tangier' });
// @ts-expect-error A supplied array requires complete item values.
profile.details.cities.patch([{ city: 'Rabat' }]);
// @ts-expect-error A nested array also requires complete item values.
profile.patch({ details: { cities: [{ city: 'Rabat' }] } });
// @ts-expect-error A complete object row must provide its nested arrays too.
profile.details.cities.patch([{ city: 'Rabat', country: 'Morocco' }]);
// @ts-expect-error Undefined is not a valid object item.
profile.details.cities.patch([undefined]);
// @ts-expect-error Sparse arrays are not partial row updates.
profile.details.cities.patch([, { city: 'Rabat', country: 'Morocco', aliases: [] }]);
