import { array, field, form, group, required, type ArrayItemNode, type FieldNode, type GroupNode } from '@ngblocks/form-nodes';

const profile = form({
  roles: array(group({
    valueType: field<number>(null, [required]),
    value: field<string>(null),
  }, {
    configure: ({ children }) => {
      children.value.setValidators(() => {
        const type = children.valueType(); // number | null
        return type !== null && type > 10 && !children.value()
          ? { kind: 'roleValue', message: 'Enter a value for this role.' }
          : null;
      });
    },
  }), {
    initialValue: 2,
  }),
});

type RoleNode = ArrayItemNode<typeof profile.roles>;
const first: RoleNode = profile.roles.at(0)!;
const second = profile.roles.at(1)!;
first.valueType.set(11);
first.value.hasError('roleValue'); // true
second.value.hasError('roleValue'); // false
if (!first.value.hasError('roleValue') || second.value.hasError('roleValue')) {
  throw new Error('Sibling validation must stay within its own row.');
}
first.value.set('Manager');
if (first.value.invalid()) throw new Error('Entering a role value must resolve the error.');
const added = profile.roles.push({ valueType: 12, value: null });
if (!added.value.hasError('roleValue')) throw new Error('New rows must also be configured.');

// A reusable field may instead declare the parent structure it requires.
type RoleParent = GroupNode<{ valueType: FieldNode<number | null> }>;
const roleValue = field<string>(null, (ctx) => {
  const parent = ctx.parent<RoleParent>();
  const type = parent?.valueType(); // number | null | undefined
  return type !== null && type !== undefined && type > 10 && !ctx.value()
    ? { kind: 'roleValue', message: 'Enter a value for this role.' }
    : null;
});
if (roleValue.invalid()) throw new Error('A detached field must tolerate a null parent.');
const standaloneRole = group({ valueType: field<number>(11), value: roleValue });
if (!standaloneRole.value.hasError('roleValue')) throw new Error('The declared parent must be observed after attachment.');
