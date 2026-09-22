import { expectTypeOf } from 'vitest';
import { Injector } from '@angular/core';

import { field, form, group, array, createFormPrimitives, type AnyNode, type FieldNode, type FormNode, type GroupNode } from '../../src/public-api';

field('', { onValueChange(value, node) {
  expectTypeOf(value).toEqualTypeOf<string>();
  expectTypeOf(node).toEqualTypeOf<FieldNode<string>>();
  // @ts-expect-error The callback's node retains its value contract.
  node.set(1);
} });
field.strict(0, { onValueChange(value) { expectTypeOf(value).toEqualTypeOf<number>(); } });
field(null, { onValueChange(value) { expectTypeOf(value).toEqualTypeOf<unknown>(); } });
form({ name: field(''), count: field.strict(0) }, { onValueChange(value, node) {
  expectTypeOf(value).toEqualTypeOf<{ name: string; count: number }>();
  expectTypeOf(node.count()).toEqualTypeOf<number>();
  node.patch({ name: 'Ada' });
} });
group({ name: field('') }, { onValueChange(value, node) {
  expectTypeOf(value).toEqualTypeOf<{ name: string }>();
  expectTypeOf(node.name()).toEqualTypeOf<string>();
} });
array({ name: field('') }, { onValueChange(value, node) {
  expectTypeOf(value).toEqualTypeOf<{ name: string }[]>();
  expectTypeOf(node.at(0)?.name()).toEqualTypeOf<string | undefined>();
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
  expectTypeOf(value).toEqualTypeOf<string>();
  expectTypeOf(node).toEqualTypeOf<typeof name>();
  // @ts-expect-error A field subscriber retains the field value contract.
  node.set(42);
}, { emitCurrent: true });
expectTypeOf(stop).toEqualTypeOf<() => void>();
const owner = Injector.create({ providers: [] });
name.onValueChange(() => {}, { injector: owner, debounce: 300, emitCurrent: true });
name.onValueChange(() => {}, { emitCurrent: false });
// @ts-expect-error Current-value delivery is controlled by a boolean.
name.onValueChange(() => {}, { emitCurrent: 'true' });
// @ts-expect-error emitCurrent belongs to an instance subscription, not field construction.
field('', { emitCurrent: true });
// @ts-expect-error Subscription ownership accepts an Angular injector.
name.onValueChange(() => {}, { injector: 'invalid' });
// @ts-expect-error Callback values must accept the inferred nullable field value.
name.onValueChange((value: number) => value);
field(null).onValueChange(value => expectTypeOf(value).toEqualTypeOf<unknown>());
primitives.field('').onValueChange(value => expectTypeOf(value).toEqualTypeOf<string>(), { emitCurrent: true });

const profile = form({ name, onValueChange: field('child'), details: { age: field.strict(0) } });
profile.$api.onValueChange((value, node) => {
  expectTypeOf(value).toEqualTypeOf<{ name: string; onValueChange: string; details: { age: number } }>();
  expectTypeOf(node).toEqualTypeOf<typeof profile>();
}, { debounce: 300, emitCurrent: true });
profile.name.onValueChange((_value, node) => expectTypeOf(node).toEqualTypeOf<typeof profile.name>());
profile.details.onValueChange((value, node) => {
  expectTypeOf(value).toEqualTypeOf<{ age: number }>();
  expectTypeOf(node).toEqualTypeOf<typeof profile.details>();
  expectTypeOf(node.nodeType()).toEqualTypeOf<'group'>();
}, { debounce: 300, emitCurrent: true });
// @ts-expect-error Subscription debounce accepts milliseconds, not control commit strategies.
name.onValueChange(() => {}, { debounce: 'blur' });
// @ts-expect-error Subscription debounce is not an async control debouncer.
name.onValueChange(() => {}, { debounce: async () => {} });

const rows = array({ name: field('') });
rows.onValueChange((value, node) => {
  expectTypeOf(value).toEqualTypeOf<{ name: string }[]>();
  expectTypeOf(node).toEqualTypeOf<typeof rows>();
}, { debounce: 300, emitCurrent: true });

const generic: AnyNode = name;
generic.$api.onValueChange((_value, node) => expectTypeOf(node).toEqualTypeOf<AnyNode>(), { emitCurrent: true });
const genericForm: FormNode = profile;
genericForm.$api.onValueChange((_value, node) => expectTypeOf(node).toEqualTypeOf<FormNode>(), { emitCurrent: true });
const genericGroup: GroupNode = group({ age: field(0) });
genericGroup.$api.onValueChange((_value, node) => expectTypeOf(node).toEqualTypeOf<GroupNode>(), { emitCurrent: true });
owner.destroy();
