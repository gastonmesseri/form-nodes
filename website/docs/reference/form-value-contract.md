---
title: FormValueContract
description: Check an inferred form or group against a named aggregate value without losing its concrete child-node types.
---

import CodeBlock from '@theme/CodeBlock';
import formValueContractSource from '!!raw-loader!../../examples/form-value-contract.typecheck.ts';
import formValueContractArraySource from '!!raw-loader!../../examples/form-value-contract-array.typecheck.ts';

# FormValueContract

`FormValueContract<TValue>` is a compile-time contract for checking the aggregate committed value
of a `form()` or `group()`. Use it with TypeScript's `satisfies` operator so the definitions remain
the source of every concrete child-node type.

```ts
type FormValueContract<TValue extends object> = {
  (): TValue;
  value: Signal<TValue>;
};
```

Import it from the package entry point:

```ts
import { type FormValueContract } from '@gem/ng-forms';
```

## Check a form value

<CodeBlock language="ts">{formValueContractSource}</CodeBlock>

The contract verifies both ordinary value-reading surfaces:

```ts
profile();       // { username: '', age: 0, country: 'Switzerland' }
profile.value(); // { username: '', age: 0, country: 'Switzerland' }
```

The expression retains the type inferred by `form()`. `username` and `age` remain their concrete
`Field` nodes, and `country` remains a `Field<string>` declared with `field.strict<string>()`.
The `Profile` model verifies their aggregate value.

## Incompatible values

An incompatible child makes the `satisfies` expression fail:

```ts
type Profile = {
  username: string | null;
  age: number | null;
};

form({
  username: field(42),
  age: field(0),
}) satisfies FormValueContract<Profile>;
// TypeScript error: `number | null` is not assignable to `string | null`.
```

## Use with group()

The contract is structural and also accepts a group:

```ts
type Address = {
  city: string | null;
  postcode: number | null;
};

const address = group({
  city: field(''),
  postcode: field(0),
}) satisfies FormValueContract<Address>;

address(); // { city: '', postcode: 0 }
address.city(); // ''
```

## Why satisfies matters

Avoid annotating the variable as the contract:

```ts
const profile: FormValueContract<Profile> = form({
  username: field(''),
  age: field(0),
});
```

That annotation replaces the expression's visible type with `FormValueContract<Profile>`, hiding
the inferred children. `satisfies` performs the compatibility check and returns the original form
type unchanged.

Likewise, `FormValueContract` is separate from the first generic currently inferred by `form()`.
That generic describes the definitions so TypeScript can preserve each concrete node. The contract
lets a named value model provide an additional check without replacing that definition inference.

## Arrays and nullability

After the basic object contract, the same pattern can validate dynamic arrays while preserving
their concrete `ArrayNode` API:

<CodeBlock language="ts">{formValueContractArraySource}</CodeBlock>

In this example, `items` remains an `ArrayNode` with `push()`, `at()`, iteration, and the other
structural operations. The `Profile` model validates the array value but does not select the
primitive.

Field nullability is part of the comparison. A default field includes `null`, while an array node
does not make its complete array value nullable. For an atomic array field, put `null` around the
complete array value:

```ts
type AtomicItems = {
  items: string[] | null;
};

const atomicItems = form({
  items: field<string[]>(),
}) satisfies FormValueContract<AtomicItems>;

atomicItems.items(); // null
```

This differs from an array node whose individual item fields are nullable:

```ts
type DynamicItems = {
  items: (string | null)[];
};

const dynamicItems = form({
  items: array(field('')),
}) satisfies FormValueContract<DynamicItems>;
```

## Structural compatibility

The check follows TypeScript's normal structural assignability. A form value must provide every
required property in `TValue` with a compatible type. A form may contain additional properties and
still satisfy a narrower model because structural TypeScript types permit extra properties in an
already inferred value.

`FormValueContract` has no runtime representation, performs no validation after compilation, and
does not affect values, state propagation, validators, or control bindings.

## Related reference

- [`FormNodeValue`](./form-node-value.md) extracts a value model from an existing form instance.
- [`form()`](./form.md) creates a submission workflow and infers its complete child tree.
- [`group()`](./group.md) creates an object aggregate without an independent submission workflow.
- [`array()`](./array.md) creates the dynamic collection preserved by the contract example.
- [Creating nodes](../concepts/creating-nodes.md) explains definition inference and primitive choice.
