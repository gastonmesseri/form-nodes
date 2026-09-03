import { array, field, form, group } from 'form-nodes';

const checkout = form({
  payment: form({
    card: field(''),
  }),
});

if (checkout.payment.card.form() !== checkout.payment) {
  throw new Error('A nested explicit form must own its descendant workflow.');
}
if (checkout.payment.card.root() !== checkout) {
  throw new Error('root() must cross nested form workflow boundaries.');
}

const address = group({ city: field('Zurich') });
const names = array(field(''));
const standalone = field('value');

if (address.form() !== null || address.root() !== address) {
  throw new Error('A standalone group must be its own structural root without owning a form.');
}
if (names.form() !== null || names.root() !== names) {
  throw new Error('A standalone array must be its own structural root without owning a form.');
}
if (standalone.form() !== null || standalone.root() !== standalone) {
  throw new Error('A standalone field must be its own structural root without owning a form.');
}
