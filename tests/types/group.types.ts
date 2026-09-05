import { field, form, group, type Node } from '../../src/public-api';

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
type _NestedGroupForm = Expect<Equal<ReturnType<typeof address.location.latitude.form>, Node | null>>;
type _NestedGroupRoot = Expect<Equal<ReturnType<typeof address.location.latitude.root>, typeof address>>;

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
type _StructuralRootThroughGroup = Expect<Equal<ReturnType<typeof profile.address.city.root>, typeof profile>>;
type _NestedWorkflow = Expect<Equal<ReturnType<typeof profile.independentWorkflow.form>, typeof profile.independentWorkflow>>;
type _NestedWorkflowRoot = Expect<Equal<ReturnType<typeof profile.independentWorkflow.root>, typeof profile>>;

type Company = { companyId: number; companyName: string };
const company: Company = { companyId: 23, companyName: 'Apple' };
const companyGroup = group({ company });
type _TypedObjectGroup = Expect<Equal<ReturnType<typeof companyGroup.company>, { companyId: number | null; companyName: string | null }>>;

class CompanyModel {
  companyId = 23;
}
const companyModel = new CompanyModel();
const atomicCompanyGroup = group({ company: companyModel });
type _ExplicitClassField = Expect<Equal<ReturnType<typeof atomicCompanyGroup.company>, CompanyModel | null>>;
type _GroupNodeType = Expect<Equal<ReturnType<typeof atomicCompanyGroup.nodeType>, 'group'>>;
type _ClassFieldNodeType = Expect<Equal<ReturnType<typeof atomicCompanyGroup.company.nodeType>, 'field'>>;

const dynamicZip = address.add('zip', field('8001'));
type _DynamicZipValue = Expect<Equal<ReturnType<typeof dynamicZip>, string | null>>;
address.get('zip');
address.children['zip'];
// @ts-expect-error dynamically added children are not direct properties
address.zip;
// @ts-expect-error undeclared child names must not compile
address.mistypedPropertyName;
