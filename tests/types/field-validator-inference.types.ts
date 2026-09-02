import type { Equal, Expect } from './assert.types';
import { asyncValidator, createFormPrimitives, field, form, required, validator, type Field, type ValidatorContext } from '../../src/public-api';

const profile = form({
  email: field('', [(ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string | null>>>;
    type _Value = Expect<Equal<ReturnType<typeof ctx.value>, string | null>>;
    ctx.field().set('updated');
    ctx.field().set(null);
    // @ts-expect-error The field value is not numeric.
    ctx.field().set(42);
    // @ts-expect-error A field has no form submission workflow.
    ctx.field().submit();
    return null;
  }]),
});
field('', { validators: (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string | null>>>;
  return null;
} });
field('', { validators: [required, null, validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string | null>>>;
  type _Value = Expect<Equal<ReturnType<typeof ctx.value>, string | null>>;
  return null;
})] });
field('', [asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string | null>>>;
  type _Value = Expect<Equal<ReturnType<typeof ctx.value>, string | null>>;
  return null;
}, {
  when: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string | null>>>;
    return true;
  },
  onError: (_error, ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string | null>>>;
    return null;
  },
})]);
field('', { validators: asyncValidator({
  when: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string | null>>>;
    return true;
  },
  params: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string | null>>>;
    return { email: ctx.value() };
  },
  validate: async (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string | null>>>;
    type _Params = Expect<Equal<typeof ctx.params, { email: string | null }>>;
    return null;
  },
  onError: (_error, ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string | null>>>;
    return null;
  },
}) });

field.strict('', [(ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string>>>;
  // @ts-expect-error Strict fields reject null.
  ctx.field().set(null);
  return null;
}]);
field.strict<string>('', { validators: validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string>>>;
  return null;
}) });
field.strict('', [asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string>>>;
  return null;
})]);
field.nullable(0, { validators: asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<number | null>>>;
  return null;
}) });
field<string>(undefined, [(ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string | null | undefined>>>;
  return null;
}]);
field(null, [(ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<unknown>>>;
  return null;
}]);
field(undefined, { validators: validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<unknown>>>;
  return null;
}) });

const configured = createFormPrimitives({ nullable: false });
configured.field('', [validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string>>>;
  return null;
})]);
configured.field('', { validators: asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string>>>;
  return null;
}) });
configured.field.nullable('', [(ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string | null>>>;
  return null;
}]);
configured.field.strict('', [validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string>>>;
  return null;
})]);
profile.email.setValidators((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string | null>>>;
  return null;
});
field('', [(ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, Field<string | null>>>;
  return [(inner) => {
    type _Nested = Expect<Equal<ReturnType<typeof inner.field>, Field<string | null>>>;
    return null;
  }];
}]);

const reusable = validator<string | null>((ctx) => {
  type _GenericNode = Expect<Equal<typeof ctx.field, ValidatorContext<string | null>['field']>>;
  return ctx.value() ? null : { kind: 'required' };
});
field('', [required, reusable]);
const reusableAsync = asyncValidator<string | null>(async (ctx) => {
  type _GenericNode = Expect<Equal<typeof ctx.field, ValidatorContext<string | null>['field']>>;
  return null;
});
field('', [reusableAsync]);
form({ email: field('') }, { validators: (ctx) => {
  type _FormKind = Expect<Equal<ReturnType<ReturnType<typeof ctx.node>['nodeType']>, 'form'>>;
  return null;
} });

// Display improvements must preserve nominal values, unions, tuples, and generic validators.
class PrivateValue {
  private readonly identity = 1;
  getIdentity() {
    return this.identity;
  }
}
field.strict(new PrivateValue(), [(ctx) => {
  type _Value = Expect<Equal<ReturnType<typeof ctx.value>, PrivateValue>>;
  return null;
}]);
field(new Date(), [asyncValidator(async (ctx) => {
  type _Value = Expect<Equal<ReturnType<typeof ctx.value>, Date | null>>;
  return null;
})]);
field.strict<readonly [string, number]>(['entry', 1], [(ctx) => {
  type _Value = Expect<Equal<ReturnType<typeof ctx.value>, readonly [string, number]>>;
  return null;
}]);
field.strict<{ kind: 'text'; text: string } | { kind: 'count'; count: number }>({ kind: 'text', text: '' }, [(ctx) => {
  type _Value = Expect<Equal<ReturnType<typeof ctx.value>, { kind: 'text'; text: string } | { kind: 'count'; count: number }>>;
  return null;
}]);
const genericValue = <TValue>(ctx: ValidatorContext<TValue>) => {
  type _Value = Expect<Equal<ReturnType<typeof ctx.value>, TValue>>;
  return null;
};
field('', [genericValue]);
