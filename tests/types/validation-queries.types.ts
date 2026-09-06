import type { Equal, Expect } from './assert.types';
import { array, asyncValidator, field, form, group, required, type DynamicNode } from '../../src/public-api';

const profile = form({ name: field('Marco'), address: group({ city: field('Zurich') }), rows: array(field('')) });
const asyncCheck = asyncValidator<string | null>(async () => null);
const ownGroupValidator = (_context: { field: () => typeof profile.address }) => null;
profile.address.hasValidator(ownGroupValidator);
profile.name.hasValidator(asyncCheck);
for (const node of [profile, profile.name, profile.address, profile.rows]) {
  const hasError = node.hasError('customError');
  const hasValidator = node.hasValidator(required);
  type _Error = Expect<Equal<typeof hasError, boolean>>;
  type _Validator = Expect<Equal<typeof hasValidator, boolean>>;
  // @ts-expect-error Error kinds must be strings.
  node.hasError(1);
  // @ts-expect-error Validator queries take a function, not a kind.
  node.hasValidator('required');
}
declare const dynamic: DynamicNode;
dynamic.hasError('required');
dynamic.hasValidator(required);
