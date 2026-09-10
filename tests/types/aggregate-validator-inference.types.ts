import type { Equal, Expect } from './assert.types';
import type { ValidatorNodeView } from '../../src/lib/validation/validator-node-view.type';
import { array, asyncValidator, createFormPrimitives, field, form, group, validator, type ArrayNode, type FieldNode, type FormNode, type GroupNode } from '../../src/public-api';

type Children = { name: FieldNode<string | null> };
const definitions = { name: field('') };
form(definitions, { validators: (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<FormNode<Children>>>>;
  const name: string | null = ctx.node().name();
  void name;
  type _Alias = Expect<Equal<typeof ctx.field, typeof ctx.node>>;
  return null;
} });
form({ name: field('') }, [validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<FormNode<Children>>>>;
  type _Value = Expect<Equal<ReturnType<typeof ctx.value>, { name: string | null }>>;
  return null;
})]);
form({ name: field('') }, { validators: asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<FormNode<Children>>>>;
  return null;
}) });
form({ name: field('') }, { validators: asyncValidator({
  params: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<FormNode<Children>>>>;
    return ctx.node().name();
  },
  validate: async (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<FormNode<Children>>>>;
    type _Params = Expect<Equal<typeof ctx.params, string | null>>;
    return null;
  },
  when: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<FormNode<Children>>>>;
    return true;
  },
  onError: (_error, ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<FormNode<Children>>>>;
    return null;
  },
}) });
group({ name: field('') }, [(ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<GroupNode<Children>>>>;
  return null;
}]);
group({ name: field('') }, { validators: validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<GroupNode<Children>>>>;
  return null;
}) });
group({ name: field('') }, [asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<GroupNode<Children>>>>;
  return null;
})]);
group({ name: field('') }, { validators: asyncValidator({
  params: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<GroupNode<Children>>>>;
    return ctx.value();
  },
  validate: async (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<GroupNode<Children>>>>;
    return null;
  },
}) });
array({ name: field('') }, { validators: (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<ArrayNode<GroupNode<Children>>>>>;
  return null;
} });
array(field.strict(0), [validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<ArrayNode<FieldNode<number>>>>>;
  return null;
})]);
array(() => ({ name: field('') }), 2, [asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<ArrayNode<GroupNode<Children>>>>>;
  return null;
})]);
array({ name: field('') }, { initialValue: 1, validators: asyncValidator({
  params: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<ArrayNode<GroupNode<Children>>>>>;
    return ctx.node().length();
  },
  validate: async (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<ArrayNode<GroupNode<Children>>>>>;
    type _Params = Expect<Equal<typeof ctx.params, number>>;
    return null;
  },
}) });
const configured = createFormPrimitives({ nullable: false });
configured.form({ name: '' }, { validators: validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<FormNode<{ name: FieldNode<string> }>>>>;
  return null;
}) });
configured.group({ name: '' }, [asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<GroupNode<{ name: FieldNode<string> }>>>>;
  return null;
})]);
configured.array({ name: '' }, { validators: asyncValidator({
  params: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<ArrayNode<GroupNode<{ name: FieldNode<string> }>>>>>;
    return ctx.value();
  },
  validate: async (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.node>, ValidatorNodeView<ArrayNode<GroupNode<{ name: FieldNode<string> }>>>>>;
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
