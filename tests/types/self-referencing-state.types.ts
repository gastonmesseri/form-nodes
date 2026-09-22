import { computed, type Signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { array, field, form, group, required, createFormPrimitives, type DisabledStateSource } from '../../src/public-api';

const profile = form({
  purpose: field('', [required]),
  itemIds: field<number[]>(null, {
    validators: [required],
    disabled: () => !!profile.purpose(),
  }),
  hiddenName: field('', { hidden: () => !!profile.purpose() }),
  readonlyName: field('', [required], { readonly: () => !!profile.purpose() }),
  details: group({ name: field('') }, {
    disabled: () => profile.purpose() ? 'Locked' : false,
    hidden: () => profile.purpose() === 'hidden',
    readonly: () => profile.purpose() === 'readonly',
  }),
  nested: form({ name: field('') }, {
    disabled: () => !!profile.purpose(),
    hidden: () => profile.purpose() === 'hidden',
    readonly: () => profile.purpose() === 'readonly',
  }),
  rows: array({ name: field('') }, {
    disabled: () => !!profile.purpose(),
    hidden: () => profile.purpose() === 'hidden',
    readonly: () => profile.purpose() === 'readonly',
  }),
});

type _Values = Expect<Equal<ReturnType<typeof profile>, {
  purpose: string;
  itemIds: number[] | null;
  hiddenName: string;
  readonlyName: string;
  details: { name: string };
  nested: { name: string };
  rows: { name: string }[];
}>>;
type _Disabled = Expect<Equal<ReturnType<typeof profile.itemIds.disabled>, boolean>>;
type _Hidden = Expect<Equal<ReturnType<typeof profile.hiddenName.hidden>, boolean>>;
type _Readonly = Expect<Equal<ReturnType<typeof profile.readonlyName.readonly>, boolean>>;
// @ts-expect-error Self-reference does not erase array-valued field writes.
profile.itemIds.set(['wrong']);
// @ts-expect-error Self-reference does not introduce unknown children.
profile.missing;
// @ts-expect-error Array item writes retain their child value types.
profile.rows.push({ name: 123 });

const standalone = field.strict('', {
  disabled: () => standalone() === 'disabled',
  hidden: () => standalone() === 'hidden',
  readonly: () => standalone() === 'readonly',
});
type _Standalone = Expect<Equal<ReturnType<typeof standalone>, string>>;

const root = form({ mode: field('') }, {
  disabled: () => root.mode() === 'disabled' ? 'Locked' : false,
  hidden: () => root.mode() === 'hidden',
  readonly: () => root.mode() === 'readonly',
});
type _Root = Expect<Equal<ReturnType<typeof root>, { mode: string }>>;

const branch = group({ mode: field('') }, {
  disabled: () => !!branch.mode(),
  hidden: () => branch.mode() === 'hidden',
  readonly: () => branch.mode() === 'readonly',
});
type _Group = Expect<Equal<ReturnType<typeof branch>, { mode: string }>>;

const rows = array({ name: field('') }, {
  disabled: () => rows.length() === 0,
  hidden: () => rows.length() > 2,
  readonly: () => rows.length() > 3,
});
type _Array = Expect<Equal<ReturnType<typeof rows>, { name: string }[]>>;

const primitives = createFormPrimitives({ nullable: true });
const configured = primitives.form({
  name: primitives.field('', { disabled: () => !!configured.name() }),
});
type _Configured = Expect<Equal<ReturnType<typeof configured.name>, string | null>>;

class Editor {
  form = form({
    purpose: field(''),
    itemIds: field.nullable<number[]>(null, { disabled: () => this.locked() }),
    details: field('', { hidden: () => this.locked(), readonly: () => this.locked() }),
  });

  locked = computed(() => !!this.form.purpose());
}
const editor = new Editor();
type _Computed = Expect<Equal<typeof editor.locked, Signal<boolean>>>;
type _ClassValue = Expect<Equal<ReturnType<typeof editor.form.itemIds>, number[] | null>>;

const reason: DisabledStateSource = () => root.mode() ? 'Locked' : false;
field('', { disabled: reason });
// @ts-expect-error Static disabled values still require a boolean or string.
field('', { disabled: 123 });
// @ts-expect-error Static hidden values still require a boolean.
form({}, { hidden: 'hidden' });
// @ts-expect-error Static readonly values still require a boolean.
group({}, { readonly: 'readonly' });
// @ts-expect-error Explicit callback annotations still check return values.
array(field(''), { disabled: (): boolean | string => 123 });
