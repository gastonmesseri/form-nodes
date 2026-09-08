import type { Equal, Expect } from './assert.types';
import { array, field, form, group, isFormNode, type AnyNode, type FieldNode, type FormNode, type GroupNode, type ArrayNode, type AnyFieldNode, type AnyFormNode, type AnyGroupNode, type AnyArrayNode } from '../../src/public-api';

const profile = form({
  name: field.strict('Marco'),
  preferences: group({ enabled: field(true) }),
  details: form({ age: field(30) }),
  contacts: array({ email: field('') }, { initialValue: 1 }),
});

const nodes: AnyNode[] = [profile, profile.name, profile.preferences, profile.details, profile.contacts];
const fields: AnyFieldNode[] = [profile.name, field(1), field({ city: 'Zurich' })];
const forms: AnyFormNode[] = [profile, profile.details, form({}), form({ api: field(1), submit: field('') })];
const groups: AnyGroupNode[] = [profile.preferences, group({}), group({ api: field(1), reset: field('') })];
const arrays: AnyArrayNode[] = [profile.contacts, array(field('')), array(array(field(1)))];

declare const candidate: unknown;
if (isFormNode(candidate)) {
  type _Narrowed = Expect<Equal<typeof candidate, AnyNode>>;
  candidate.$api.markAsTouched();
}

declare const genericForm: AnyFormNode;
declare const genericGroup: AnyGroupNode;
declare const genericArray: AnyArrayNode;
genericForm.$api.submit();
genericForm.$api.add('nickname', field(''));
genericForm.$api.forEachChild((child) => {
  child.$api.markAsTouched();
  // @ts-expect-error Unknown children do not have arbitrary declared descendants.
  child.missingChild;
});
genericGroup.$api.get('city');
genericGroup.$api.add('city', field('Zurich'));
genericArray.push();
genericArray.at(0)?.$api.markAsTouched();
genericArray.forEach((child, index, owner) => {
  type _Child = Expect<Equal<typeof child, AnyNode>>;
  type _Owner = Expect<Equal<typeof owner, AnyArrayNode>>;
  child.$api.markAsTouched();
  owner.removeAt(index);
});
const filtered = genericArray.filter(isFormNode);
type _Filtered = Expect<Equal<typeof filtered, AnyNode[]>>;
genericArray.getError('required')?.targetNode.push();
// @ts-expect-error Unknown child names are not exposed as declared properties.
genericForm.missingChild;
// @ts-expect-error A group has no independent submission operation.
genericGroup.$api.submit();
// @ts-expect-error An array is not a field.
const invalidField: AnyFieldNode = profile.contacts;
// @ts-expect-error A group is not a form.
const invalidForm: AnyFormNode = profile.preferences;

const name: FieldNode<string> = field.strict('Marco');
const details: FormNode<{ name: typeof name }> = form({ name });
const address: GroupNode<{ city: FieldNode<string | null> }> = group({ city: field('Zurich') });
const amounts: ArrayNode<FieldNode<number | null>> = array(field(0));
type _NameValue = Expect<Equal<ReturnType<typeof name>, string>>;
type _DetailsValue = Expect<Equal<ReturnType<typeof details>, { name: string }>>;
type _AddressValue = Expect<Equal<ReturnType<typeof address>, { city: string | null }>>;
type _AmountsValue = Expect<Equal<ReturnType<typeof amounts>, (number | null)[]>>;

void [nodes, fields, forms, groups, arrays, invalidField, invalidForm];
