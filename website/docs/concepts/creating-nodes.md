---
title: Creating nodes
---

import CodeBlock from '@theme/CodeBlock';

import declarationShorthandMatrixSource from '!!raw-loader!../../examples/declaration-shorthand-matrix.example.ts';
import computedDeclarationSource from '!!raw-loader!../../examples/computed-declaration.example.ts';

# Creating nodes

Gem Forms models a workflow as a tree of `field()`, `form()`, `array()`, and `group()` nodes.
TypeScript infers the complete value shape from that tree.

When a named domain model should check that inferred value without replacing concrete child types,
use [`satisfies FormValueContract<Model>`](../reference/form-value-contract.md).

## Fields

Use `field()` for a leaf value. Fields normally appear inside a form definition:

For structured values, the optional [`equal` setting](../reference/field.md#field-equal-option)
can retain equivalent committed values and avoid value-triggered revalidation.

```ts
import { field, required } from '@gem/ng-forms';

const myForm = form({
  name: field('Marco', {
    validators: [required],
  }),
});
```

Fields are nullable by default. `myForm.name` is therefore `Field<string | null>`, even though its initial value is a string. Opt out when null is not a valid business value:

```ts
const name = field.strict('');

name.set('Lia');
// name.set(null); // TypeScript error
```

Use [`createFormPrimitives({ nullable: false })`](../reference/create-form-primitives.md) when non-nullable fields and
field shorthands should be the default throughout an application.

A field created without an initial value starts at `null`:

```ts
const nickname = field<string>();
```

If the initial value is the literal `null` and no generic supplies the eventual type, the field is
inferred as `Field<unknown>`:

```ts
const myForm = form({
  unspecifiedValue: field(null),      // Field<unknown>
  deferredValue: field(undefined),    // Field<unknown>, initial value is undefined
  nickname: field<string>(null),      // Field<string | null>
});
```

The first form is intentionally safer than `Field<any>`: it accepts later values, but consumers
must narrow a read before using it. Prefer the explicit generic when the domain type is known.

A standalone field is fully supported, but a form tree provides the typed parent, path, aggregate value, and state propagation used by most applications.

A field may contain an object or array value and still remain one leaf node. Use this for controls
that edit a structured value atomically, such as a multi-select editing `string[]`. Use nested
`form()` or `array()` nodes only when the value's parts need independent bindings and state. See
[Choosing a primitive](../guides/choosing-a-primitive.md).

Inside `form()` or `group()` definitions, use `field(value)` as the unambiguous escape hatch for
any value that could otherwise be interpreted as structure. In particular, a plain object shorthand
creates a nested group; wrapping that same object with `field()` guarantees one atomic field:

```ts
const defaultCompany = { companyId: 23, companyName: 'Apple' };

const profile = form({
  company: field(defaultCompany),
});
```

Structural shorthand reads only own enumerable string-keyed data properties. It ignores inherited
and non-enumerable properties and rejects accessors, symbol keys, and `__proto__` before creating
the tree. A normalization error reports the complete declaration path and,
when the object may be application data rather than structure, recommends wrapping it with
`field(value)`.

## Declaration shorthand matrix

Shorthand is intentionally predictable: atomic values become fields, plain objects become groups,
and dynamic collections require an explicit `array()`.

| Declaration inside `form()`, `group()`, or an object array template | Explicit equivalent | Inferred node value | Prefer an explicit primitive when… |
| --- | --- | --- | --- |
| `name: ''` | `name: field('')` | `string \| null` | The field needs validators, options, or a generic |
| `age: 0` | `age: field(0)` | `number \| null` | The field must be strict or configured |
| `active: false` | `active: field(false)` | `boolean \| null` | The field needs configuration |
| `birthday: new Date()` | `birthday: field(new Date())` | `Date \| null` | The date needs field configuration |
| `empty: null` or `undefined` | `empty: field(null)` or `field(undefined)` | `unknown` | The future type is known: use `field<T>()` |
| `roles: ['admin']` | `roles: field(['admin'])` | `string[] \| null` | Items need nodes: use `array(field(''))` |
| `address: { city: '' }` | `address: group({ city: field('') })` | `{ city: string \| null }` | The branch needs validators or options: use `group()` |
| `company: classInstance` | `company: field(classInstance)` | `Company \| null` | Making the atomic boundary explicit improves readability |
| `company: { ...data }` | `company: group({ ... })` | Object assembled from child values | The object is one atomic value: use `field(company)` |
| `child: existingNode` | Unchanged | Existing node value | Never—explicit nodes are preserved |

<CodeBlock language="ts" title="declaration-shorthand-matrix.example.ts">{declarationShorthandMatrixSource}</CodeBlock>

An empty array shorthand is also one atomic field and widens to `unknown[] | null`. Root
`array([])` is rejected because an empty array cannot describe an item-node template; use
`array(field<T>())` for a dynamic collection. Definition objects reject symbol child keys,
enumerable accessors, and `__proto__` before creating any node.

## A container is optional

You do not have to place fields inside `form()` or `group()`. A normal JavaScript object can organize
independent nodes when no aggregate node behavior is needed:

```ts
const profileFields = {
  displayName: field(''),
  emailAddress: field(''),
};

profileFields.displayName(); // ''
profileFields.emailAddress.set('marco@example.com');
```

These fields remain fully usable and bindable, but the object itself is not a node. It cannot be
called to read one aggregate value, does not expose aggregate validation or interaction state, and
cannot provide `set()`, `patch()`, `reset()`, inherited configuration, child paths, or parent/root
navigation. Each field is an independent root.

Wrap the same structure in `group()` when those tree capabilities are useful but the root does not
own submission:

```ts
const profileGroup = group({
  displayName: field(''),
  emailAddress: field(''),
});

profileGroup();      // { displayName: '', emailAddress: '' }
profileGroup.valid();
profileGroup.reset();
```

Use `form()` when the root additionally represents a submission workflow or binds to a native
`<form>` element. A root `group()` is therefore a normal and reasonable choice for settings panels,
reusable editors, filter models, and other structured UI that has no independent submit action.

## Forms

Use `form()` to combine named nodes into an object:

```ts
import { field, form, group } from '@gem/ng-forms';

const profile = form({
  name: field(''),
  age: field<number>(),
});

profile(); // { name: '', age: null }
profile.name(); // ''
profile.age(); // null
```

Nested objects are shorthand for groups:

```ts
const profile = form({
  name: field(''),
  address: {
    city: field(''),
    country: field(''),
  },
});

profile.address.city(); // ''
```

Only plain objects are interpreted as structural groups. Arrays, functions, and other object
instances become fields automatically. An array's length and contents never determine node
structure: declare `array(...)` explicitly when its items need independent nodes.

Use an explicit `group()` when that level needs validators, state options, or validator messages:

```ts
const profile = form({
  address: group({
    city: field(''),
    country: field(''),
  }, {
    disabled: () => !canEditAddress(),
  }),
});
```

Groups and forms always have non-null object values. Use a field containing an object when the
object itself must be nullable. Use an explicit nested `form()` only when that branch owns an
independent submission action.

An empty form is valid, enabled, writable, visible, untouched, and pristine by default and has the
value `{}`, unless a form-level validator or state option changes that result.

## Arrays

Use `array()` for a dynamic collection. Its first argument is a node template cloned for every item:

```ts
import { array, field, form } from '@gem/ng-forms';

const myForm = form({
  people: array({
    name: field(''),
    age: field(18),
  }, {
    initialValue: [{ name: 'Mark', age: 50 }],
  }),
});

myForm.people(); // [{ name: 'Mark', age: 50 }]
myForm.people[0]?.name(); // 'Mark'
```

Use a field template when each item is a primitive value:

```ts
const myForm = form({
  tags: array(field(''), ['angular', 'signals']),
});

myForm.tags(); // ['angular', 'signals']
myForm.tags[0]?.set('typescript');
```

Arrays always expose an array value. Passing `null` or `undefined` to `set()` or `reset(value)` clears the array.

## Node options

Fields, forms, and arrays accept options for validators, debounce, and initial or reactive state:

```ts
const account = form({
  email: field(''),
  loginName: field(''),
}, {
  disabled: () => !permissions().canEdit,
  hidden: () => !featureFlags().account,
  readonly: false,
  debounce: 250,
});
```

The closest configured node provides inherited `disabled`, `readonly`, `hidden`, and debounce behavior to its descendants. A descendant can define its own option to override the inherited debounce or add another state cause.

## Compile-time value safety

TypeScript recursively infers the complete form value from the node tree. `set()` and
`reset(value)` require a complete value, while `patch()` accepts only known recursive partial
branches:

```ts
profile.set({
  name: 'Ada',
  address: { city: 'London', country: 'UK' },
});

profile.patch({
  address: { city: 'Zurich' },
});
```

Incorrect value types, missing complete-value properties, and unknown patch keys are compile-time
errors. Validators receive the inferred value type too. Runtime warnings protect against unknown
keys that enter through unsafe casts or untyped external data.

When named controls genuinely enter or leave at runtime, use `add()`, direct property access, and `remove()` on a
form or group. Initially declared children remain fixed and precisely typed; runtime names are
`DynamicNode | undefined`, exposing the state and operations common to every node kind. See
[Dynamic object children](../guides/dynamic-object-children.md).

## Using nodes outside Angular

Node creation, synchronous validation, state transitions, and explicitly triggered asynchronous validation work without dependency injection:

```ts
const counter = field(0);

counter.update(value => (value ?? 0) + 1);
console.log(counter()); // 1
```

Provide an Angular `Injector` only when you want its `DestroyRef` to own asynchronous validation cleanup deterministically.

## Declaring a form in a component

In an Angular application, the form is commonly a component property:

```ts
import { Component } from '@angular/core';

import { field, FormNode, form } from '@gem/ng-forms';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNode],
  template: `
    <label>
      Name
      <input [formNode]="myForm.name" />
    </label>

    <label>
      Hair color
      <input [formNode]="myForm.hairColor" />
    </label>

    <p>Current name: {{ myForm.name() }}</p>
    <p>Current hair color: {{ myForm.hairColor() }}</p>
  `,
})
export class ProfileEditor {
  myForm = form({
    name: field(''),
    hairColor: field(''),
  });
}
```

## Declarations inside computed

You can construct a form with nested groups and arrays inside Angular's `computed()`. Signals read
while declaring initial values, normalizing children, running item factories, or reading configuration
getters remain dependencies. Editing the resulting nodes does not itself reconstruct the form.

<CodeBlock language="ts">{computedDeclarationSource}</CodeBlock>

When a declaration dependency changes, the example creates a fresh tree with its declared initial
values and fresh interaction state. Use a stable form with reactive options or validators when
configuration should change while retaining current edits. Construct fresh children in the computed
when each evaluation is intended to produce an independent tree.

## Current structural boundaries

Initially declared object children are fixed, while explicitly added runtime children can later be
removed. Use `array()` when equivalent items form an ordered collection that can also be reordered.
The library does not currently generate form trees from JSON schema definitions.

See the [complete form example](../examples/complex-form.md) for a larger Angular component combining nested forms, dynamic arrays, validation, state, and submission.
