import type { Signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { field, form, group, array, type AnyNode, type NodeErrorsSignal, type ValidationErrorWithTargetNode } from '../../src/public-api';

const profile = form({ name: field(''), nested: group({ age: field(0) }), items: array(field('')) });
const own = profile.errors();
const explicitOwn = profile.errors({ descendants: false });
const subtree = profile.errors({ descendants: true });
type _Own = Expect<Equal<typeof own, readonly ValidationErrorWithTargetNode<typeof profile>[]>>;
type _ExplicitOwn = Expect<Equal<typeof explicitOwn, typeof own>>;
type _Subtree = Expect<Equal<typeof subtree, readonly ValidationErrorWithTargetNode<AnyNode>[]>>;
const signal: Signal<typeof own> = profile.errors;
const errors: NodeErrorsSignal<typeof profile> = profile.errors;
declare const descendants: boolean;
profile.errors({ descendants });
profile.errors({});
profile.$api.errors({ descendants: true });
profile.name.errors({ descendants: true });
profile.nested.errors({ descendants: true });
profile.items.errors({ descendants: true });
const unknownNode: AnyNode = profile;
unknownNode.$api.errors({ descendants: true });
// @ts-expect-error descendants is a boolean option
profile.errors({ descendants: 'yes' });
void [signal, errors];
