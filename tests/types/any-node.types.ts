import type { Equal, Expect } from './assert.types';
import { array, field, form, group, isFormNode, type AnyNode, type DynamicNode, type FieldNode, type FormNode, type GroupNode, type ArrayNode } from '../../src/public-api';

const profile = form({
  name: field.strict('Marco'),
  preferences: group({ enabled: field(true) }),
  details: form({ age: field(30) }),
  contacts: array({ email: field('') }, { initialValue: 1 }),
});

const nodes: AnyNode[] = [profile, profile.name, profile.preferences, profile.details, profile.contacts];
const fields: FieldNode[] = [profile.name, field(1), field({ city: 'Zurich' })];
const forms: FormNode[] = [profile, profile.details, form({}), form({ api: field(1), submit: field('') })];
const groups: GroupNode[] = [profile.preferences, group({}), group({ api: field(1), reset: field('') })];
const arrays: ArrayNode[] = [profile.contacts, array(field('')), array(array(field(1)))];

declare const candidate: unknown;
if (isFormNode(candidate)) {
  type _Narrowed = Expect<Equal<typeof candidate, AnyNode>>;
  candidate.$api.markAsTouched();
}

declare const genericForm: FormNode;
declare const genericGroup: GroupNode;
declare const genericArray: ArrayNode;
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
  type _Owner = Expect<Equal<typeof owner, ArrayNode>>;
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
const invalidField: FieldNode = profile.contacts;
// @ts-expect-error A group is not a form.
const invalidForm: FormNode = profile.preferences;

const name: FieldNode<string> = field.strict('Marco');
const details: FormNode<{ name: typeof name }> = form({ name });
const address: GroupNode<{ city: FieldNode<string | null> }> = group({ city: field('Zurich') });
const amounts: ArrayNode<FieldNode<number | null>> = array(field(0));
type _NameValue = Expect<Equal<ReturnType<typeof name>, string>>;
type _DetailsValue = Expect<Equal<ReturnType<typeof details>, { name: string }>>;
type _AddressValue = Expect<Equal<ReturnType<typeof address>, { city: string | null }>>;
type _AmountsValue = Expect<Equal<ReturnType<typeof amounts>, (number | null)[]>>;

void [nodes, fields, forms, groups, arrays, invalidField, invalidForm];

// Omitted arguments erase structure; an explicit empty structure stays precise.
declare const emptyForm: FormNode<{}>;
declare const emptyGroup: GroupNode<{}>;
type _UnspecifiedFieldValue = Expect<Equal<ReturnType<FieldNode>, any>>;
type _UnspecifiedFormValue = Expect<Equal<ReturnType<FormNode>, any>>;
type _UnspecifiedGroupValue = Expect<Equal<ReturnType<GroupNode>, any>>;
type _UnspecifiedArrayValue = Expect<Equal<ReturnType<ArrayNode>, any[]>>;
type _EmptyFormValue = Expect<Equal<ReturnType<typeof emptyForm>, {}>>;
type _EmptyGroupValue = Expect<Equal<ReturnType<typeof emptyGroup>, {}>>;
type _UnspecifiedArrayRoot = Expect<Equal<ReturnType<ArrayNode['root']>, AnyNode>>;
type _KnownArrayRoot = Expect<Equal<ReturnType<ArrayNode<AnyNode, typeof details>['root']>, typeof details>>;

genericArray.setValidators(({ node, value }) => {
  type _ValidatorNode = Expect<Equal<ReturnType<typeof node>, ArrayNode>>;
  type _ValidatorValue = Expect<Equal<ReturnType<typeof value>, any[]>>;
  node().push();
  return null;
});
genericForm.$api.getError('required')?.targetNode.$api.submit();
genericGroup.$api.getError('required')?.targetNode.$api.add('country', field('CH'));

type InferredFormChildren<TNode> = TNode extends FormNode<infer TChildren> ? TChildren : never;
type InferredGroupChildren<TNode> = TNode extends GroupNode<infer TChildren> ? TChildren : never;
type _FormChildren = Expect<Equal<InferredFormChildren<typeof details>, { name: typeof name }>>;
type _GroupChildren = Expect<Equal<InferredGroupChildren<typeof address>, { city: FieldNode<string | null> }>>;

// Generic infrastructure retains optional error metadata across every access path.
declare const sharedNode: DynamicNode;
const directMessages = sharedNode.errors().map(error => error.message);
const commonMessages = nodes[0]!.$api.errors().map(error => error.message);
const descendantMessages = sharedNode.allErrors().map(error => error.message);
const specificMessage = sharedNode.getError('required')?.message;
type _DirectMessages = Expect<Equal<typeof directMessages, (string | undefined)[]>>;
type _CommonMessages = Expect<Equal<typeof commonMessages, (string | undefined)[]>>;
type _DescendantMessages = Expect<Equal<typeof descendantMessages, (string | undefined)[]>>;
type _SpecificMessage = Expect<Equal<typeof specificMessage, string | undefined>>;
type _SpecificKind = Expect<Equal<NonNullable<ReturnType<typeof sharedNode.getError<'required'>>>['kind'], 'required'>>;
sharedNode.errors()[0]?.formNode?.focus();
