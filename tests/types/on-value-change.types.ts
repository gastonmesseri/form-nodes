import { expectTypeOf } from 'vitest';
import { Injector } from '@angular/core';

import { field, form, group, array, createFormPrimitives, type FieldNode } from '../../src/public-api';

field('', { onValueChange(value, node) {
  expectTypeOf(value).toEqualTypeOf<string | null>();
  expectTypeOf(node).toEqualTypeOf<FieldNode<string | null>>();
  // @ts-expect-error The callback's node retains its value contract.
  node.set(1);
} });
field.strict(0, { onValueChange(value) { expectTypeOf(value).toEqualTypeOf<number>(); } });
field(null, { onValueChange(value) { expectTypeOf(value).toEqualTypeOf<unknown>(); } });
form({ name: field(''), count: field.strict(0) }, { onValueChange(value, node) {
  expectTypeOf(value).toEqualTypeOf<{ name: string | null; count: number }>();
  expectTypeOf(node.count()).toEqualTypeOf<number>();
  node.patch({ name: 'Ada' });
} });
group({ name: field('') }, { onValueChange(value, node) {
  expectTypeOf(value).toEqualTypeOf<{ name: string | null }>();
  expectTypeOf(node.name()).toEqualTypeOf<string | null>();
} });
array({ name: field('') }, { onValueChange(value, node) {
  expectTypeOf(value).toEqualTypeOf<{ name: string | null }[]>();
  expectTypeOf(node.at(0)?.name()).toEqualTypeOf<string | null | undefined>();
} });
array(field.strict(0), [1], { onValueChange(value, node) {
  expectTypeOf(value).toEqualTypeOf<number[]>();
  expectTypeOf(node.at(0)?.()).toEqualTypeOf<number | undefined>();
} });
const primitives = createFormPrimitives({ nullable: false });
primitives.field('', { onValueChange(value) { expectTypeOf(value).toEqualTypeOf<string>(); } });
primitives.form({ enabled: primitives.field(false) }, { onValueChange(value, node) {
  expectTypeOf(value).toEqualTypeOf<{ enabled: boolean }>();
  expectTypeOf(node.enabled()).toEqualTypeOf<boolean>();
} });

const name = field('Ada');
const stop = name.onValueChange((value, node) => {
  expectTypeOf(value).toEqualTypeOf<string | null>();
  expectTypeOf(node).toEqualTypeOf<typeof name>();
  // @ts-expect-error A field subscriber retains the field value contract.
  node.set(42);
});
expectTypeOf(stop).toEqualTypeOf<() => void>();
const owner = Injector.create({ providers: [] });
name.onValueChange(() => {}, { injector: owner });
// @ts-expect-error Subscription ownership accepts an Angular injector.
name.onValueChange(() => {}, { injector: 'invalid' });
// @ts-expect-error Callback values must accept the inferred nullable field value.
name.onValueChange((value: number) => value);
field(null).onValueChange(value => expectTypeOf(value).toEqualTypeOf<unknown>());
primitives.field('').onValueChange(value => expectTypeOf(value).toEqualTypeOf<string>());

const profile = form({ name, onValueChange: field('child'), details: { age: field.strict(0) } });
profile.$api.onValueChange((value, node) => {
  expectTypeOf(value).toEqualTypeOf<{ name: string | null; onValueChange: string | null; details: { age: number } }>();
  expectTypeOf(node).toEqualTypeOf<typeof profile>();
});
profile.name.onValueChange((_value, node) => expectTypeOf(node).toEqualTypeOf<typeof profile.name>());
profile.details.onValueChange((value, node) => {
  expectTypeOf(value).toEqualTypeOf<{ age: number }>();
  expectTypeOf(node).toEqualTypeOf<typeof profile.details>();
  expectTypeOf(node.nodeType()).toEqualTypeOf<'group'>();
});
const rows = array({ name: field('') });
rows.onValueChange((value, node) => {
  expectTypeOf(value).toEqualTypeOf<{ name: string | null }[]>();
  expectTypeOf(node).toEqualTypeOf<typeof rows>();
});
owner.destroy();
