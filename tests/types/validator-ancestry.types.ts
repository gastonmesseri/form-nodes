import type { Signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import type { ValidatorNodeView } from '../../src/lib/validation/validator-node-view.type';
import { array, asyncValidator, field, form, group, validator, type AsyncValidatorBaseContext, type AsyncValidatorContext, type FieldNode, type ParameterizedAsyncValidatorContext, type ValidatorApi, type ValidatorContext } from '../../src/public-api';

type Root = ReturnType<ValidatorContext<string>['node']>;
type ValidatorForm = NonNullable<ReturnType<Root['$api']['form']>>;
type Parent = NonNullable<ReturnType<ValidatorContext<string>['parent']>>;
type _RootKinds = Expect<Equal<ReturnType<Root['nodeType']>, 'field' | 'form' | 'group' | 'array'>>;
type _ParentKinds = Expect<Equal<ReturnType<Parent['nodeType']>, 'form' | 'group' | 'array'>>;

const checkAncestry = (ctx: ValidatorContext<string | null>) => {
  const api = ctx.node().$api;
  type _Form = Expect<Equal<ReturnType<typeof api.form>, ValidatorForm | null>>;
  type _Parent = Expect<Equal<ReturnType<typeof ctx.parent>, Parent | null>>;

  type _Field = Expect<Equal<typeof ctx.field, Signal<ReturnType<ValidatorContext<string | null>['node']>>>>;
  type _Value = Expect<Equal<ReturnType<typeof ctx.value>, string | null>>;
  const node = ctx.field();
  node();
  node.dirty();
  node.$api.touched();
  // @ts-expect-error Native function members remain hidden.
  node.apply;
  // @ts-expect-error Native function members remain hidden.
  node.bind;
  if ('items' in node) {
    node.items()[0]?.dirty();
  } else if ('children' in node) {
    node.get('email')?.dirty();
  } else {
    type _FieldLeafValue = Expect<Equal<ReturnType<typeof node.value>, string | null>>;
  }
  type _Alias = Expect<Equal<typeof ctx.node, typeof ctx.field>>;
  const owner = api.form();
  if (owner) {
    owner.$api.submitted();
    owner.$api.get('email')?.dirty();
    owner();
    // @ts-expect-error An unknown form does not infer its enclosing declaration's children.
    owner.subGroup;
  }
  const root = api.root();
  root.$api.touched();
  root();
  const parent = ctx.parent();
  if (parent) {
    parent.touched();
    parent();
    // @ts-expect-error Function members remain hidden.
    parent.call;
    if ('items' in parent) parent.items()[0]?.touched();
    else parent.get('email')?.dirty();
  }
  return null;
};

const profile = form({
  nested: {
    subForm: form({
      subGroup: {
        email: field('', [(ctx) => {
          checkAncestry(ctx);
          return null;
        }]),
      },
    }),
  },
});
field('', [validator(checkAncestry), asyncValidator(async (ctx) => {
  checkAncestry(ctx);
  return null;
})]);
field('', [asyncValidator({
  when: (ctx) => {
    checkAncestry(ctx);
    return true;
  },
  params: (ctx) => {
    checkAncestry(ctx);
    return ctx.value();
  },
  validate: async (ctx) => {
    checkAncestry(ctx);
    return null;
  },
})]);
form({ email: field('') }, {
  validators: (ctx) => {
    const api = ctx.node().$api;
    type _FormValidatorKind = Expect<Equal<ReturnType<ReturnType<typeof ctx.node>['nodeType']>, 'form'>>;
    ctx.field().dirty();
    api.form()?.submitted();
    api.root().$api.dirty();
    ctx.parent()?.touched();
    return null;
  },
});

const exactValidator = (ctx: ValidatorContext<string | null, typeof profile.nested.subForm.subGroup.email.$api, typeof profile.nested.subForm.subGroup.email>) => {
  const api = ctx.node().$api;
  type _ExactForm = Expect<Equal<ReturnType<typeof api.form>, ValidatorNodeView<typeof profile.nested.subForm> | null>>;
  type _ExactRoot = Expect<Equal<ReturnType<typeof api.root>, ValidatorNodeView<typeof profile>>>;
  type _ExactParent = Expect<Equal<ReturnType<typeof ctx.parent>, ValidatorNodeView<typeof profile.nested.subForm.subGroup> | null>>;
  return null;
};
void exactValidator;
asyncValidator<string | null, typeof profile.nested.subForm.subGroup.email.$api, typeof profile.nested.subForm.subGroup.email>(async (ctx) => {
  const api = ctx.node().$api;
  type _ExactForm = Expect<Equal<ReturnType<typeof api.form>, ValidatorNodeView<typeof profile.nested.subForm> | null>>;
  type _ExactRoot = Expect<Equal<ReturnType<typeof api.root>, ValidatorNodeView<typeof profile>>>;
  type _ExactParent = Expect<Equal<ReturnType<typeof ctx.parent>, ValidatorNodeView<typeof profile.nested.subForm.subGroup> | null>>;
  return null;
});

const roots: ReturnType<ValidatorContext<any>['node']>[] = [field(''), group({ email: field('') }), form({ email: field('') }), array(field(''))];
const parents: Parent[] = [group({ email: field('') }), form({ email: field('') }), array(field(''))];
// @ts-expect-error Fields cannot be structural parents.
parents.push(field(''));
void roots;

type ExactNode = typeof profile.nested.subForm.subGroup.email;
type ExactApi = typeof profile.nested.subForm.subGroup.email.$api;
type _ExactSyncField = Expect<Equal<ValidatorContext<string | null, ExactApi, ExactNode>['field'], Signal<ValidatorNodeView<ExactNode>>>>;
type _ExactAsyncBaseField = Expect<Equal<AsyncValidatorBaseContext<string | null, ExactApi, ExactNode>['field'], Signal<ValidatorNodeView<ExactNode>>>>;
type _ExactAsyncField = Expect<Equal<AsyncValidatorContext<string | null, ExactApi, ExactNode>['field'], Signal<ValidatorNodeView<ExactNode>>>>;
type _ExactParameterizedField = Expect<Equal<ParameterizedAsyncValidatorContext<string | null, string, ExactApi, ExactNode>['field'], Signal<ValidatorNodeView<ExactNode>>>>;
type _DefaultAsyncBaseField = Expect<Equal<AsyncValidatorBaseContext<string>['field'], Signal<Root>>>;
type _DefaultAsyncField = Expect<Equal<AsyncValidatorContext<string>['field'], Signal<Root>>>;
type _DefaultParameterizedField = Expect<Equal<ParameterizedAsyncValidatorContext<string, string>['field'], Signal<Root>>>;
type _ExactFormNode = Expect<Equal<ValidatorContext<unknown, ValidatorApi<unknown>, typeof profile>['field'], Signal<ValidatorNodeView<typeof profile>>>>;
// @ts-expect-error The validated node always exists.
const missingNode: ValidatorContext<string>['field'] = null;
void missingNode;

type _FieldSignalResult = Expect<Equal<ReturnType<ValidatorContext<string>['field']>, Root>>;
const checkReadonlyFieldSignal = (ctx: ValidatorContext<string>) => {
  // @ts-expect-error The context exposes a readonly signal, not a writable signal.
  ctx.field.set(field('replacement'));
  // @ts-expect-error Read the signal before accessing node state.
  ctx.field.dirty();
  // @ts-expect-error The signal never returns null.
  const missing: ReturnType<typeof ctx.field> = null;
  void missing;
  return ctx.field()();
};
void checkReadonlyFieldSignal;
