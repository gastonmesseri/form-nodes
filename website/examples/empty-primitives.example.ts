import { array, field, form, group, createFormPrimitives } from '@ngblocks/form-nodes';

const profile = form();
const details = group();
const values = array();
profile(); // {}
details(); // {}
values(); // []

const name = profile.add('name', field('Ada'));
details.add('city', field('Zurich'));
values.push('Ada');
values.push(23);
values.push();
values(); // ['Ada', 23, null]
if (name() !== 'Ada' || !profile.valid()) throw new Error('Empty forms must support normal dynamic additions.');
if (values.length() !== 3 || values.at(2)!() !== null) throw new Error('Default array items must be unknown-valued fields initialized to null.');

values.resetToInitial();
values(); // []
if (values.length() !== 0) throw new Error('Resetting initial values must restore the initially empty array.');

const configured = createFormPrimitives({ nullable: false });
const configuredValues = configured.array();
if (configuredValues.push()() !== null) throw new Error('An unspecified default item must retain the null placeholder.');
