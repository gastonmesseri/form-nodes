import { array, field, form, type FieldNode, type GroupNode } from '@ngblocks/form-nodes';

class Company {
  constructor(readonly name: string) {}
}

const profile = form({
  name: '',
  age: 0,
  roles: ['reader'],
  address: { city: 'Zurich' },
  company: new Company('Form Nodes'),
  atomicAddress: field({ city: 'Bern' }),
  contacts: array({ email: '' }, {
    initialValue: [{ email: 'team@example.com' }],
  }),
}, {});

const name: FieldNode<string | null> = profile.name;
const roles: FieldNode<string[] | null> = profile.roles;
const address: GroupNode<{ city: FieldNode<string | null> }, typeof profile> = profile.address;

if (profile.name() !== '' || profile.age() !== 0 || profile.roles()?.[0] !== 'reader') {
  throw new Error('Atomic shorthand values should normalize to fields and preserve their values.');
}

if (profile.address.nodeType() !== 'group' || profile.address.city() !== 'Zurich') {
  throw new Error('Plain object shorthand should normalize to a group.');
}

if (profile.company.nodeType() !== 'field' || profile.atomicAddress.nodeType() !== 'field') {
  throw new Error('Class instances and explicitly wrapped objects should remain atomic fields.');
}

if (profile.contacts.nodeType() !== 'array' || profile.contacts[0]?.email() !== 'team@example.com') {
  throw new Error('Explicit arrays should create independently addressable item nodes.');
}

void [name, roles, address];
