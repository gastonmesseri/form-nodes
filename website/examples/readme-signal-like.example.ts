// #region introduction
import { field, form } from '@ngblocks/form-nodes';

const profile = form({
  name: field('Marco'),
  age: field(18),
});

profile.name(); // 'Marco'
profile.name.set('Lia');
profile.name(); // 'Lia'
profile.name.update(name => name?.toUpperCase() ?? '');
profile(); // { name: 'LIA', age: 18 }
// #endregion introduction

if (profile.name() !== 'LIA' || profile().name !== 'LIA' || profile().age !== 18) {
  throw new Error('Signal-style updates must be reflected by both the field and its parent form.');
}
