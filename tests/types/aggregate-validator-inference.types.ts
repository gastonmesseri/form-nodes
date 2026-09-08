import type { Equal, Expect } from './assert.types';
import { array, asyncValidator, createFormPrimitives, field, form, group, validator, type ArrayNode, type FieldNode, type FormNode, type GroupNode } from '../../src/public-api';

type Children = { name: FieldNode<string | null> };
const definitions = { name: field('') };
form(definitions, { validators: (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, FormNode<Children>>>;
  type _Alias = Expect<Equal<typeof ctx.field, typeof ctx.node>>;
  ctx.node().name.set('Ada');
  ctx.node().submit();
  // @ts-expect-error A form has no array operations.
  ctx.node().push();
  return null;
} });
form({ name: field('') }, [validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, FormNode<Children>>>;
  type _Value = Expect<Equal<ReturnType<typeof ctx.value>, { name: string | null }>>;
  return null;
})]);
form({ name: field('') }, { validators: asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, FormNode<Children>>>;
  return null;
}) });
form({ name: field('') }, { validators: asyncValidator({
  params: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, FormNode<Children>>>;
    return ctx.node().name();
  },
  validate: async (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, FormNode<Children>>>;
    type _Params = Expect<Equal<typeof ctx.params, string | null>>;
    return null;
  },
  when: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, FormNode<Children>>>;
    return true;
  },
  onError: (_error, ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, FormNode<Children>>>;
    return null;
  },
}) });
group({ name: field('') }, [(ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, GroupNode<Children>>>;
  ctx.node().name.set(null);
  ctx.node().form()?.submit();
  // @ts-expect-error A group has no submission workflow of its own.
  ctx.node().submit();
  return null;
}]);
group({ name: field('') }, { validators: validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, GroupNode<Children>>>;
  return null;
}) });
group({ name: field('') }, [asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, GroupNode<Children>>>;
  return null;
})]);
group({ name: field('') }, { validators: asyncValidator({
  params: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, GroupNode<Children>>>;
    return ctx.value();
  },
  validate: async (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, GroupNode<Children>>>;
    return null;
  },
}) });
array({ name: field('') }, { validators: (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ArrayNode<GroupNode<Children>>>>;
  ctx.node().push({ name: 'Ada' });
  ctx.node().at(0)?.name.set('Grace');
  // @ts-expect-error The item shape is known.
  ctx.node().push({ name: 42 });
  // @ts-expect-error An array has no submission workflow.
  ctx.node().submit();
  return null;
} });
array(field.strict(0), [validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ArrayNode<FieldNode<number>>>>;
  ctx.node().push(1);
  return null;
})]);
array(() => ({ name: field('') }), 2, [asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ArrayNode<GroupNode<Children>>>>;
  return null;
})]);
array({ name: field('') }, { initialValue: 1, validators: asyncValidator({
  params: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ArrayNode<GroupNode<Children>>>>;
    return ctx.node().length();
  },
  validate: async (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ArrayNode<GroupNode<Children>>>>;
    type _Params = Expect<Equal<typeof ctx.params, number>>;
    return null;
  },
}) });
const configured = createFormPrimitives({ nullable: false });
configured.form({ name: '' }, { validators: validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, FormNode<{ name: FieldNode<string> }>>>;
  return null;
}) });
configured.group({ name: '' }, [asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, GroupNode<{ name: FieldNode<string> }>>>;
  return null;
})]);
configured.array({ name: '' }, { validators: asyncValidator({
  params: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ArrayNode<GroupNode<{ name: FieldNode<string> }>>>>;
    return ctx.value();
  },
  validate: async (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ArrayNode<GroupNode<{ name: FieldNode<string> }>>>>;
    return null;
  },
}) });
// A reusable helper still accepts forms whose child names collide with native function members.
const reusable = validator<{ name: string | null }>(ctx => ctx.value().name ? null : { kind: 'required' });
form({ name: field('') }, [reusable]);
group({ name: field('') }, [reusable]);
const reusableAsync = asyncValidator<{ name: string | null }>(async () => null);
form({ name: field('') }, [reusableAsync]);
group({ name: field('') }, [reusableAsync]);
