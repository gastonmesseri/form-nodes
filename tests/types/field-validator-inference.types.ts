import type { Equal, Expect } from './assert.types';
import { asyncValidator, createFormPrimitives, field, form, required, validator, type FieldNode, type ValidatorContext } from '../../src/public-api';

const profile = form({
  email: field('', [(ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string | null>>>;
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
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string | null>>>;
  return null;
} });
field('', { validators: [required, null, validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string | null>>>;
  type _Value = Expect<Equal<ReturnType<typeof ctx.value>, string | null>>;
  return null;
})] });
field('', [asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string | null>>>;
  type _Value = Expect<Equal<ReturnType<typeof ctx.value>, string | null>>;
  return null;
}, {
  when: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string | null>>>;
    return true;
  },
  onError: (_error, ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string | null>>>;
    return null;
  },
})]);
field('', { validators: asyncValidator({
  when: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string | null>>>;
    return true;
  },
  params: (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string | null>>>;
    return { email: ctx.value() };
  },
  validate: async (ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string | null>>>;
    type _Params = Expect<Equal<typeof ctx.params, { email: string | null }>>;
    return null;
  },
  onError: (_error, ctx) => {
    type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string | null>>>;
    return null;
  },
}) });

field.strict('', [(ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string>>>;
  // @ts-expect-error Strict fields reject null.
  ctx.field().set(null);
  return null;
}]);
field.strict<string>('', { validators: validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string>>>;
  return null;
}) });
field.strict('', [asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string>>>;
  return null;
})]);
field.nullable(0, { validators: asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<number | null>>>;
  return null;
}) });
field<string>(undefined, [(ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string | null | undefined>>>;
  return null;
}]);
field(null, [(ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<unknown>>>;
  return null;
}]);
field(undefined, { validators: validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<unknown>>>;
  return null;
}) });

const configured = createFormPrimitives({ nullable: false });
configured.field('', [validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string>>>;
  return null;
})]);
configured.field('', { validators: asyncValidator(async (ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string>>>;
  return null;
}) });
configured.field.nullable('', [(ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string | null>>>;
  return null;
}]);
configured.field.strict('', [validator((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string>>>;
  return null;
})]);
profile.email.setValidators((ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string | null>>>;
  return null;
});
field('', [(ctx) => {
  type _Node = Expect<Equal<ReturnType<typeof ctx.field>, FieldNode<string | null>>>;
  return [(inner) => {
    type _Nested = Expect<Equal<ReturnType<typeof inner.field>, FieldNode<string | null>>>;
    return null;
  }];
}]);

const reusable = validator<string | null>((ctx) => {
  type _GenericNode = Expect<Equal<typeof ctx.field, ValidatorContext<string | null>['field']>>;
  const node = ctx.field();
  type _NodeValue = Expect<Equal<ReturnType<typeof node.value>, string | null>>;
  type _CallableValue = Expect<Equal<ReturnType<typeof node>, string | null>>;
  type _ApiValue = Expect<Equal<ReturnType<typeof node.api.value>, string | null>>;
  type _SafeApiValue = Expect<Equal<ReturnType<typeof node.$api.value>, string | null>>;
  type _NodeAlias = Expect<Equal<typeof ctx.node, typeof ctx.field>>;
  // @ts-expect-error The reusable validator's node value is not numeric.
  const numericValue: number = node.value();
  void numericValue;
  return ctx.value() ? null : { kind: 'required' };
});
field('', [required, reusable]);
const reusableAsync = asyncValidator<string | null>(async (ctx) => {
  type _GenericNode = Expect<Equal<typeof ctx.field, ValidatorContext<string | null>['field']>>;
  const node = ctx.field();
  type _NodeValue = Expect<Equal<ReturnType<typeof node.value>, string | null>>;
  type _CallableValue = Expect<Equal<ReturnType<typeof node>, string | null>>;
  type _ApiValue = Expect<Equal<ReturnType<typeof node.api.value>, string | null>>;
  type _SafeApiValue = Expect<Equal<ReturnType<typeof node.$api.value>, string | null>>;
  type _NodeAlias = Expect<Equal<typeof ctx.node, typeof ctx.field>>;
  // @ts-expect-error The reusable validator's node value is not numeric.
  const numericValue: number = node.value();
  void numericValue;
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

validator((ctx) => {
  const node = ctx.node();
  type _UnknownValue = Expect<Equal<ReturnType<typeof node.value>, unknown>>;
  return null;
});
validator<{ name: string | null }>((ctx) => {
  const node = ctx.node();
  type _ObjectValue = Expect<Equal<ReturnType<typeof node.value>, { name: string | null }>>;
  return null;
});
validator<readonly [string, number]>((ctx) => {
  const node = ctx.node();
  type _TupleValue = Expect<Equal<ReturnType<typeof node.value>, readonly [string, number]>>;
  return null;
});

asyncValidator<string | null, { text: string | null }>({
  when: (ctx) => {
    const node = ctx.field();
    type _Value = Expect<Equal<ReturnType<typeof node.value>, string | null>>;
    return true;
  },
  params: (ctx) => {
    const node = ctx.node();
    type _Value = Expect<Equal<ReturnType<typeof node.value>, string | null>>;
    return { text: node() };
  },
  validate: async (ctx) => {
    const node = ctx.field();
    type _Value = Expect<Equal<ReturnType<typeof node.value>, string | null>>;
    return null;
  },
  onError: (_error, ctx) => {
    const node = ctx.node();
    type _Value = Expect<Equal<ReturnType<typeof node.value>, string | null>>;
    return null;
  },
});
