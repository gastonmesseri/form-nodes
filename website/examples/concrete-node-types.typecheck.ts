import { array, field, form, group, type FieldNode, type GroupNode, type FormNode, type ArrayNode, type FormNodeValue } from '@ngblocks/form-nodes';

type AddressChildren = {
  city: FieldNode<string | null>;
  postalCode: FieldNode<string | null>;
};

type ProfileChildren = {
  username: FieldNode<string>;
  address: GroupNode<AddressChildren>;
  roles: ArrayNode<FieldNode<string | null>>;
};

const profile: FormNode<ProfileChildren> = form({
  username: field.strict('Marco'),
  address: group({
    city: field('Zurich'),
    postalCode: field('8000'),
  }),
  roles: array(field('reader')),
});

type ProfileValue = FormNodeValue<typeof profile>;
type UsernameValue = FormNodeValue<typeof profile.username>; // string
type RolesValue = FormNodeValue<typeof profile.roles>; // (string | null)[]

// typeof preserves the actual parent as well as the field's value type.
type AttachedUsername = typeof profile.username;

function changeUsername(username: AttachedUsername) {
  username.set('Lia');
}

changeUsername(profile.username);
