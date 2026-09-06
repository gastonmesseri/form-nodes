import type { Signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { array, field, form, group, type Node } from '../../src/public-api';

const acceptSignal = <T>(source: Signal<T>): T => source();
const nullable = acceptSignal(field('Marco'));
const strict = acceptSignal(field.strict('Marco'));
const unknown = acceptSignal(field(null));
const profile = acceptSignal(form({ name: field('Marco') }));
const address = acceptSignal(group({ city: field.strict('Zurich') }));
const rows = acceptSignal(array(field.strict(0)));
declare const node: Node;
acceptSignal(node);

type _Nullable = Expect<Equal<typeof nullable, string | null>>;
type _Strict = Expect<Equal<typeof strict, string>>;
type _Unknown = Expect<Equal<typeof unknown, unknown>>;
type _Profile = Expect<Equal<typeof profile, { name: string | null }>>;
type _Address = Expect<Equal<typeof address, { city: string }>>;
type _Rows = Expect<Equal<typeof rows, number[]>>;
