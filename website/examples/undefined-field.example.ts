import { createFormPrimitives, field } from '../../src/public-api';

const omitted = field<string>();
const explicit = field<string>(undefined);

if (omitted() !== null) throw new Error('An omitted initial value should default to null.');
if (explicit() !== undefined) throw new Error('An explicit undefined value should be preserved.');

explicit.set('Marco');
explicit.reset(undefined);

if (explicit() !== undefined) throw new Error('The field should accept undefined after initialization.');

const configured = createFormPrimitives({ nullable: false });
const profile = configured.form({
  omitted: configured.field(),
  explicit: configured.field(undefined),
});

if (profile.omitted() !== null) throw new Error('An omitted configured field value should default to null.');
if (profile.explicit() !== undefined) throw new Error('An explicit configured undefined value should be preserved.');
