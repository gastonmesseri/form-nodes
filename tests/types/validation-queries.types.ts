import type { Signal } from '@angular/core';

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

const declaredValidators: Signal<ReturnType<typeof profile.name.validators>> = profile.name.validators;
const resolvedName = profile.name.validators({ resolve: true });
const registeredName = profile.name.validators();
type _SameValidatorType = Expect<Equal<typeof resolvedName, typeof registeredName>>;
for (const node of [profile, profile.name, profile.address, profile.rows]) {
  node.validators({});
  node.validators({ resolve: false });
  node.validators({ resolve: true });
  const resolvedPresence = node.hasValidator(required, { resolve: true });
  type _ResolvedPresence = Expect<Equal<typeof resolvedPresence, boolean>>;
  // @ts-expect-error Resolution must be a boolean.
  node.validators({ resolve: 'yes' });
  // @ts-expect-error Resolution must be a boolean.
  node.hasValidator(required, { resolve: 'yes' });
}
profile.address.hasValidator(ownGroupValidator, { resolve: true });
dynamic.hasValidator(required, { resolve: true });

// Completion-friendly parameters still accept dynamic and unregistered names.
declare const dynamicKind: string;
for (const node of [profile, profile.name, profile.address, profile.rows]) {
  node.hasError(dynamicKind);
  node.$api.hasError('applicationSpecific');
}
profile.getError(dynamicKind);
profile.name.getError(dynamicKind);
profile.address.getError(dynamicKind);
profile.rows.getError(dynamicKind);
for (const custom of [profile.$api.getError('applicationSpecific'), profile.name.$api.getError('applicationSpecific'), profile.address.$api.getError('applicationSpecific'), profile.rows.$api.getError('applicationSpecific')]) {
  type _CustomKind = Expect<Equal<NonNullable<typeof custom>['kind'], 'applicationSpecific'>>;
}
for (const minimum of [profile.getError('min'), profile.name.getError('min'), profile.address.getError('min'), profile.rows.getError('min')]) {
  type _Minimum = Expect<Equal<NonNullable<typeof minimum>['min'], number>>;
}
// @ts-expect-error Error kinds must remain strings.
profile.name.getError(1);

// Registered application kinds retain their structured payload and target owner.
declare module '../../src/public-api' {
  interface ValidationErrorMap {
    completionError: { readonly kind: 'completionError'; readonly code: number };
  }
}
const registered = profile.name.getError('completionError');
type _RegisteredKind = Expect<Equal<NonNullable<typeof registered>['kind'], 'completionError'>>;
type _RegisteredCode = Expect<Equal<NonNullable<typeof registered>['code'], number>>;
type _RegisteredTarget = Expect<Equal<NonNullable<typeof registered>['targetNode'], typeof profile.name>>;
const arbitrary = profile.name.getError(dynamicKind);
type _DynamicKind = Expect<Equal<NonNullable<typeof arbitrary>['kind'], string>>;
