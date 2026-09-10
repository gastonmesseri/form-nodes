import { expectTypeOf } from 'vitest';

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
