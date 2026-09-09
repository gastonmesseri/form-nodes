import type { Signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { field, form, group, array, useClosestForm, type AnyNode, type FieldNode, type FormNode, type CallableNodeApi, type FieldApi } from '../../src/public-api';

const acceptSignal = <T>(value: Signal<T>): T => value();
const name: FieldNode<string | null> = field('Ada');
const api: CallableNodeApi<FieldApi<string | null>> = name.$api;
const fieldValue = acceptSignal(api);
type _Field = Expect<Equal<typeof fieldValue, string | null>>;
const profile = form({ submitted: field('child'), value: field(23), api: field('child api') });
const formValue = acceptSignal(profile.$api);
type _Form = Expect<Equal<typeof formValue, { submitted: string | null; value: number | null; api: string | null }>>;
const submitted: boolean = profile.$api.submitted();
const child: string | null = profile.submitted();
const groupValue = acceptSignal(group({ city: field('Zurich') }).$api);
type _Group = Expect<Equal<typeof groupValue, { city: string | null }>>;
const names = array(field(''));
const arrayValue = acceptSignal(names.$api);
type _Array = Expect<Equal<typeof arrayValue, (string | null)[]>>;
const length: number = names.$api.length();
const arbitrary: AnyNode = names;
acceptSignal(arbitrary.$api);
const generic: FormNode = profile;
acceptSignal(generic.$api);
const closest = useClosestForm();
closest()?.();
closest()?.submitted();
closest()?.value.committed();
// @ts-expect-error native function members remain hidden on a concrete API
name.$api.call(null);
// @ts-expect-error API operations retain their value types
name.$api.set(42);
// @ts-expect-error child field setters retain their string input type
profile.$api.children.api.set(42);
void [submitted, child, length];
