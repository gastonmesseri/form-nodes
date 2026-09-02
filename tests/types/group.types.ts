import { field, form, group } from '../../src/public-api';

import type { Equal, Expect } from './assert.types';

const address = group({
  city: field('Zurich'),
  location: {
    latitude: field(47.37),
  },
});
group({ city: field('') }, { inheritInjector: false });
group({ city: field('') }, { adoptBindingInjector: false });

type AddressValue = {
  city: string | null;
  location: { latitude: number | null };
};

type _Value = Expect<Equal<ReturnType<typeof address>, AddressValue>>;
type _NestedGroupRoot = Expect<Equal<ReturnType<typeof address.location.latitude.form>, typeof address | null>>;

address.set({ city: 'Bern', location: { latitude: 46.95 } });
address.patch({ location: { latitude: 47 } });

// @ts-expect-error groups do not expose submission behavior
address.submit();
// @ts-expect-error group options do not accept submission configuration
group({ city: field('') }, { submission: { action: () => undefined } });

const profile = form({
  address: {
    city: field('Zurich'),
  },
  independentWorkflow: form({ step: field(1) }, { submission: { action: () => undefined } }),
});

// @ts-expect-error shorthand object branches normalize to groups, not forms
profile.address.submit();
profile.independentWorkflow.submit();

type _RootThroughGroup = Expect<Equal<ReturnType<typeof profile.address.city.form>, typeof profile | null>>;
