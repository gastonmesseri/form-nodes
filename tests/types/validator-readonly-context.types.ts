import type { Signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { array, asyncValidator, field, form, validator, type FormNode, type ValidatorContext } from '../../src/public-api';

const row = form({ name: field('Ada'), count: field(1) });
type Row = typeof row;
field('', validator((ctx) => {
  const parent = ctx.parent<Row>();
  type _Name = Expect<Equal<ReturnType<NonNullable<typeof parent>['name']>, string | null>>;
  type _Count = Expect<Equal<ReturnType<NonNullable<typeof parent>['$api']['children']['count']>, number | null>>;
  parent?.name.value.committed();
  parent?.$api.children.count.value.control();
  // @ts-expect-error Validator value views are read-only, including explicitly typed parents.
  parent?.name.value.committed.set('Grace');
  // @ts-expect-error Validator API views are read-only through every navigation path.
  parent?.$api.children.count.value.control.set(2);
  // @ts-expect-error Context navigation cannot expose validation outputs that can reenter the validator.
  parent?.$api.valid();
  // @ts-expect-error Reading the parent's aggregate validation would reenter child validation.
  parent?.errors();
  // @ts-expect-error A generic parent contract cannot restore validation-derived constraints.
  parent?.name.required();
  return parent ? { kind: 'crossField', targetNode: parent.name } : null;
}, { reactive: false }));

const model = form({
  valid: field('child value'),
  set: field(1),
  rows: array({ name: field('Ada'), count: field(1) }),
}, { validators: validator((ctx) => {
  const node = ctx.node();
  type _Collision = Expect<Equal<ReturnType<typeof node.valid>, string | null>>;
  type _SetChild = Expect<Equal<ReturnType<typeof node.set>, number | null>>;
  const names: (string | null)[] = node.rows.map((item, index, rows) => {
    const atIndex: string | null | undefined = rows[index]?.name();
    void atIndex;
    // @ts-expect-error Traversal callbacks receive read-only node views.
    item.name.value.control.set('Grace');
    return item.name();
  });
  const selected = node.rows.filter(item => item.count() !== null);
  selected[0]?.name();
  node.rows.includes(row);
  node.rows.indexOf(row);
  node.rows.forEach(item => item.name());
  node.rows.find(item => item.name() === 'Ada')?.count();
  node.rows.findIndex(item => item.name() === 'Ada');
  node.rows.some(item => item.touched());
  node.rows.every(item => item.enabled());
  node.rows.at(0)?.name();
  node.rows.items()[0]?.name();
  for (const item of node.rows) {
    // @ts-expect-error Iteration retains the same read-only value contract.
    item.count.value.committed.set(2);
    item.count();
  }
  node.forEachChild(child => child());
  node.forEachChild(child => child(), { includeDynamic: true });
  node.get('extra')?.value();
  // @ts-expect-error The collision-safe API retains the validation boundary.
  node.$api.valid();
  // @ts-expect-error Validation results cannot be read through the alias.
  ctx.field().$api.errors();
  // @ts-expect-error Context value views never expose setters.
  ctx.value.control.set({ valid: 'next', set: 2, rows: [] });
  void names;
  const target = node.rows.at(0)?.name;
  return target ? { kind: 'row', targetNode: target } : null;
}) });

asyncValidator<string | null>(async (ctx) => {
  const parent = ctx.parent<Row>();
  // @ts-expect-error The asynchronous context retains the same validation boundary.
  parent?.pending();
  return parent ? { kind: 'remote', targetNode: parent.name } : null;
});

declare const context: ValidatorContext<string>;
const value: Signal<string> = context.value;
const sameAlias: typeof context.node = context.field;
void [model, value, sameAlias];

form({ details: row }, { validators: validator((ctx: ValidatorContext<unknown>) => {
  ctx.node().$api.value();
  return null;
}) });

field('', (ctx) => {
  const parent = ctx.parent<FormNode<any>>();
  parent?.$api.get('name')?.value();
  // @ts-expect-error An unspecified child dictionary cannot bypass the context boundary.
  parent?.valid();
  const asserted = ctx.parent<any>();
  // @ts-expect-error Even an erased parent generic receives the read-only common API.
  asserted?.$api.errors();
  return null;
});
