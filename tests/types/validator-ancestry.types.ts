import type { Signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { array, asyncValidator, field, form, group, validator, type AsyncValidatorBaseContext, type AsyncValidatorContext, type Field, type ParameterizedAsyncValidatorContext, type ValidatorApi, type ValidatorContext } from '../../src/public-api';

type Root = ReturnType<ValidatorContext<string>['node']>;
type ValidatorForm = NonNullable<ReturnType<Root['api']['form']>>;
type Parent = NonNullable<ReturnType<ValidatorContext<string>['parent']>>;
type _RootKinds = Expect<Equal<ReturnType<Root['nodeType']>, 'field' | 'form' | 'group' | 'array'>>;
type _ParentKinds = Expect<Equal<ReturnType<Parent['nodeType']>, 'form' | 'group' | 'array'>>;

const checkAncestry = (ctx: ValidatorContext<string | null>) => {
  const api = ctx.node().api;
  type _Form = Expect<Equal<ReturnType<typeof api.form>, ValidatorForm | null>>;
  type _Parent = Expect<Equal<ReturnType<typeof ctx.parent>, Parent | null>>;

  type _Field = Expect<Equal<typeof ctx.field, Signal<Root>>>;
  type _Value = Expect<Equal<ReturnType<typeof ctx.value>, string | null>>;
  const node = ctx.field();
  node();
  node.dirty();
  node.valid();
  node.reset();
  node.api.touched();
  node.$api.touched();
  // @ts-expect-error The validated node is not necessarily a form.
  node.submit();
  // @ts-expect-error Native function members remain hidden.
  node.apply;
  // @ts-expect-error Native function members remain hidden.
  node.bind;
  if ('submit' in node) {
    const result: Promise<boolean> = node.submit();
    void result;
  } else if ('items' in node) {
    node.push();
    node.items()[0]?.dirty();
  } else if ('children' in node) {
    node.get('email')?.dirty();
  } else {
    type _FieldLeaf = Expect<Equal<typeof node, Field<any>>>;
    node.set('updated');
  }

  type _Alias = Expect<Equal<typeof ctx.node, typeof ctx.field>>;
  const owner = api.form();
  if (owner) {
    const result: Promise<boolean> = owner.submit();
    owner.valid();
    owner.reset();
    owner.get('email')?.valid();
    owner.$api.submit();
    owner();
    void result;
    // @ts-expect-error An unknown form does not infer its enclosing declaration's children.
    owner.subGroup;
    // @ts-expect-error A form has no array operations.
    owner.push();
  }

  const root = api.root();
  root.valid();
  root.reset();
  root();
  // @ts-expect-error A structural root is not necessarily a form.
  root.submit();
  if ('submit' in root) {
    const result: Promise<boolean> = root.submit();
    void result;
  } else if ('items' in root) {
    root.push();
    root.items()[0]?.valid();
  } else if ('children' in root) {
    root.get('email')?.valid();
  } else {
    root.set('detached');
  }

  const parent = ctx.parent();
  if (parent) {
    parent.valid();
    parent.reset();
    parent();
    // @ts-expect-error A parent is not necessarily a form.
    parent.submit();
    // @ts-expect-error Function members remain hidden.
    parent.call;
    if ('items' in parent) {
      parent.push();
    } else {
      parent.get('email')?.valid();
    }
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
    const api = ctx.node().api;
    type _FormValidatorKind = Expect<Equal<ReturnType<ReturnType<typeof ctx.node>['nodeType']>, 'form'>>;
    ctx.field().dirty();
    api.form()?.submit();
    api.root().valid();
    ctx.parent()?.reset();
    return null;
  },
});

const exactValidator = (ctx: ValidatorContext<string | null, typeof profile.nested.subForm.subGroup.email.api, typeof profile.nested.subForm.subGroup.email>) => {
  const api = ctx.node().api;
  type _ExactForm = Expect<Equal<ReturnType<typeof api.form>, typeof profile.nested.subForm | null>>;
  type _ExactRoot = Expect<Equal<ReturnType<typeof api.root>, typeof profile>>;
  type _ExactParent = Expect<Equal<ReturnType<typeof ctx.parent>, typeof profile.nested.subForm.subGroup | null>>;
  return null;
};
void exactValidator;
asyncValidator<string | null, typeof profile.nested.subForm.subGroup.email.api, typeof profile.nested.subForm.subGroup.email>(async (ctx) => {
  const api = ctx.node().api;
  type _ExactForm = Expect<Equal<ReturnType<typeof api.form>, typeof profile.nested.subForm | null>>;
  type _ExactRoot = Expect<Equal<ReturnType<typeof api.root>, typeof profile>>;
  type _ExactParent = Expect<Equal<ReturnType<typeof ctx.parent>, typeof profile.nested.subForm.subGroup | null>>;
  return null;
});

const roots: Root[] = [field(''), group({ email: field('') }), form({ email: field('') }), array(field(''))];
const parents: Parent[] = [group({ email: field('') }), form({ email: field('') }), array(field(''))];
// @ts-expect-error Fields cannot be structural parents.
parents.push(field(''));
void roots;

type ExactNode = typeof profile.nested.subForm.subGroup.email;
type ExactApi = typeof profile.nested.subForm.subGroup.email.api;
type _ExactSyncField = Expect<Equal<ValidatorContext<string | null, ExactApi, ExactNode>['field'], Signal<ExactNode>>>;
type _ExactAsyncBaseField = Expect<Equal<AsyncValidatorBaseContext<string | null, ExactApi, ExactNode>['field'], Signal<ExactNode>>>;
type _ExactAsyncField = Expect<Equal<AsyncValidatorContext<string | null, ExactApi, ExactNode>['field'], Signal<ExactNode>>>;
type _ExactParameterizedField = Expect<Equal<ParameterizedAsyncValidatorContext<string | null, string, ExactApi, ExactNode>['field'], Signal<ExactNode>>>;
type _DefaultAsyncBaseField = Expect<Equal<AsyncValidatorBaseContext<string>['field'], Signal<Root>>>;
type _DefaultAsyncField = Expect<Equal<AsyncValidatorContext<string>['field'], Signal<Root>>>;
type _DefaultParameterizedField = Expect<Equal<ParameterizedAsyncValidatorContext<string, string>['field'], Signal<Root>>>;
type _ExactFormNode = Expect<Equal<ValidatorContext<unknown, ValidatorApi<unknown>, typeof profile>['field'], Signal<typeof profile>>>;
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
