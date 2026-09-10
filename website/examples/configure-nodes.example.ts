import { array, field, form, group, type ArrayItemNode, type FieldNode, type GroupNode } from '@ngblocks/form-nodes';

const deliveryForm = form({
  packages: array(group({
    deliveryMethod: field<'home' | 'pickup'>('home'),
    pickupLocation: field(''),
  }, {
    configure: ({ children }) => {
      children.pickupLocation.setValidators(() => {
        return children.deliveryMethod() === 'pickup' && !children.pickupLocation()
          ? { kind: 'pickupLocation', message: 'Choose a pickup location.' }
          : null;
      });
    },
  }), {
    initialValue: 2,
  }),
});

type PackageNode = ArrayItemNode<typeof deliveryForm.packages>;
const first: PackageNode = deliveryForm.packages.at(0)!;
const second = deliveryForm.packages.at(1)!;
first.deliveryMethod.set('pickup');
first.pickupLocation.hasError('pickupLocation'); // true
second.pickupLocation.hasError('pickupLocation'); // false
if (!first.pickupLocation.hasError('pickupLocation') || second.pickupLocation.hasError('pickupLocation')) {
  throw new Error('Sibling validation must stay within its own row.');
}
first.pickupLocation.set('Central station');
if (first.pickupLocation.invalid()) throw new Error('Choosing a pickup location must resolve the error.');
const added = deliveryForm.packages.push({ deliveryMethod: 'pickup', pickupLocation: '' });
if (!added.pickupLocation.hasError('pickupLocation')) throw new Error('New rows must also be configured.');

// A reusable field may instead declare the parent structure it requires.
type PackageParent = GroupNode<{ deliveryMethod: FieldNode<'home' | 'pickup' | null> }>;
const pickupLocation = field('', (ctx) => {
  const row = ctx.parent<PackageParent>();
  return row?.deliveryMethod() === 'pickup' && !ctx.value()
    ? { kind: 'pickupLocation', message: 'Choose a pickup location.' }
    : null;
});
if (pickupLocation.invalid()) throw new Error('A detached field must tolerate a null parent.');
const standalonePackage = group({ deliveryMethod: field<'home' | 'pickup'>('pickup'), pickupLocation });
if (!standalonePackage.pickupLocation.hasError('pickupLocation')) {
  throw new Error('The declared parent must be observed after attachment.');
}
standalonePackage.deliveryMethod.set('home');
if (standalonePackage.pickupLocation.invalid()) throw new Error('Changing the sibling must clear the error.');
