import { expectTypeOf } from 'vitest';

import { array, asyncValidator, createFormPrimitives, field, form } from '../../src/public-api';

expectTypeOf(field('')()).toEqualTypeOf<string>();
expectTypeOf(field<string>('')()).toEqualTypeOf<string>();
expectTypeOf(field<string>(null)()).toEqualTypeOf<string | null>();
expectTypeOf(field<string>(undefined)()).toEqualTypeOf<string | undefined>();
expectTypeOf(field<string | null>('')()).toEqualTypeOf<string | null>();
expectTypeOf(field<string | undefined>('')()).toEqualTypeOf<string | undefined>();
expectTypeOf(field<string>()()).toEqualTypeOf<string | null>();
expectTypeOf(field(null)()).toEqualTypeOf<unknown>();
expectTypeOf(field(undefined)()).toEqualTypeOf<unknown>();
expectTypeOf(field()()).toEqualTypeOf<unknown>();
expectTypeOf(field.strict('')()).toEqualTypeOf<string>();
expectTypeOf(field.nullable('')()).toEqualTypeOf<string | null>();
expectTypeOf(field.nullable<string>()()).toEqualTypeOf<string | null>();
expectTypeOf(field.nullable<string>(undefined)()).toEqualTypeOf<string | null | undefined>();
expectTypeOf(field(0)()).toEqualTypeOf<number>();
expectTypeOf(field(false)()).toEqualTypeOf<boolean>();
expectTypeOf(field<'a' | 'b'>('a')()).toEqualTypeOf<'a' | 'b'>();

declare const initial: string | null | undefined;
expectTypeOf(field(initial)()).toEqualTypeOf<string | null | undefined>();
expectTypeOf(field<string>(initial)()).toEqualTypeOf<string | null | undefined>();
expectTypeOf(field<{ name: string }>(null)()).toEqualTypeOf<{ name: string } | null>();
expectTypeOf(field({ name: '' })()).toEqualTypeOf<{ name: string }>();

field('', ctx => {
  expectTypeOf(ctx.value()).toEqualTypeOf<string>();
  expectTypeOf(ctx.field()()).toEqualTypeOf<string>();
  return null;
});
field<string>(null, ctx => {
  expectTypeOf(ctx.value()).toEqualTypeOf<string | null>();
  return null;
});
field<string>(undefined, { validators: ctx => {
  expectTypeOf(ctx.value()).toEqualTypeOf<string | undefined>();
  return null;
} });
field<string>(initial, [asyncValidator(async ctx => {
  expectTypeOf(ctx.value()).toEqualTypeOf<string | null | undefined>();
  return null;
})], { equal: (a, b) => {
  expectTypeOf(a).toEqualTypeOf<string | null | undefined>();
  expectTypeOf(b).toEqualTypeOf<string | null | undefined>();
  return a === b;
} });
field('', undefined, { onValueChange(value) {
  expectTypeOf(value).toEqualTypeOf<string>();
} });
const inferred = field('');
inferred.set('Ada');
inferred.update(value => value.toUpperCase());
inferred.reset('Lia');
// @ts-expect-error Inferred strings do not accept null writes.
inferred.set(null);
// @ts-expect-error Reset values follow the same inferred contract.
inferred.reset(null);
// @ts-expect-error Non-nullish inputs must satisfy the explicit generic.
field<string>(123);
// @ts-expect-error Object properties must satisfy the explicit generic.
field<{ name: string }>({ name: null });
// @ts-expect-error Strict fields require an initial value.
field.strict<string>();
// @ts-expect-error Strict fields reject null.
field.strict<string>(null);
// @ts-expect-error Strict fields reject undefined.
field.strict<string>(undefined);
// @ts-expect-error Validators cannot change the inferred value type.
field('', { validators: (ctx: { value(): number }) => null });

const configured = createFormPrimitives();
expectTypeOf(configured.field<string>(null)()).toEqualTypeOf<string | null>();
expectTypeOf(configured.field<string>(undefined)()).toEqualTypeOf<string | undefined>();
expectTypeOf(configured.field<string>()()).toEqualTypeOf<string | null>();
expectTypeOf(configured.field('')()).toEqualTypeOf<string>();
expectTypeOf(createFormPrimitives({}).field('')()).toEqualTypeOf<string>();
expectTypeOf(createFormPrimitives({ nullable: true }).field('')()).toEqualTypeOf<string | null>();
expectTypeOf(createFormPrimitives({ nullable: false }).field('')()).toEqualTypeOf<string>();
const profile = form({ name: '', details: { age: 0 }, rows: array({ title: '' }) });
expectTypeOf(profile()).toEqualTypeOf<{ name: string; details: { age: number }; rows: { title: string }[] }>();
const added = profile.add('nickname', '');
expectTypeOf(added()).toEqualTypeOf<string>();
