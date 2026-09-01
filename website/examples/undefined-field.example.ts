import { field } from '../../src/public-api';

const omitted = field<string>();
const explicit = field<string>(undefined);

if (omitted() !== null) throw new Error('An omitted initial value should default to null.');
if (explicit() !== undefined) throw new Error('An explicit undefined value should be preserved.');

explicit.set('Marco');
explicit.reset(undefined);

if (explicit() !== undefined) throw new Error('The field should accept undefined after initialization.');
