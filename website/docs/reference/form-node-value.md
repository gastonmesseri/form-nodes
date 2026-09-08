---
title: FormNodeValue
description: Extract the committed value type from any form, group, array, or field node, preserving nested structure and nullability.
---

import CodeBlock from '@theme/CodeBlock';
import formNodeValueSource from '!!raw-loader!../../examples/form-node-value.typecheck.ts';

# FormNodeValue {#formnodevalue}

`FormNodeValue<typeof node>` extracts the committed value type of any `form()`, `group()`,
`array()`, or `field()` instance. Use it to type saved drafts, service parameters, or other values
that should follow a node's inferred model.

```ts
import type { FormNodeValue } from '@ngblocks/form-nodes';

type MyFormValue = FormNodeValue<typeof myForm>;
```

## 🌳 Infer form and child values {#infer-form-and-child-values}

<CodeBlock language="ts">{formNodeValueSource}</CodeBlock>

The same helper works for the complete form and each selected child. It preserves each node's
value type recursively:

- Ordinary fields include `null`; `field.strict()` fields retain their non-nullable type.
- Explicit `undefined`, literal unions, and application-specific object types are preserved.
- Groups and nested forms produce nested objects.
- Dynamic arrays produce arrays of their item values. An array-valued field retains its own field
  type, including nullability of the complete array.
- Nodes created with `createFormPrimitives()` preserve their configured nullability defaults and
  any explicit field overrides.

## 📐 Signature and scope {#signature-and-scope}

```ts
type FormNodeValue<TNode extends AnyNode> = ReturnType<TNode>;
```

Pass the type of an existing node instance. Standalone nodes, nested nodes, and array items are
all supported. Definition objects and ordinary functions are not node instances.
When an array item may be missing, narrow out `undefined` or use `NonNullable` on its type first.

The result is equivalent to `ReturnType<typeof node>` and describes what calling `node()`
returns. It also works when children are named `value`, `api`, or `nodeType`, since those names do
not change the node's call signature.

The helper follows the static declaration. Adding a child with `add()` later does not widen the
original form or group type; use the returned child for its exact inferred type.

This is a type-only export. It does not read the node, create a subscription, validate a value, or
change runtime behavior.

## 🔗 Related value types {#related-value-types}

| Type | Input | Purpose |
| --- | --- | --- |
| `FormNodeValue<typeof node>` | Any node instance type | Extract its committed value type. |
| `FormValue<TNodes>` | A map of child-node types | Map each child node to its value type. |
| `FormValueContract<Model>` | An existing object value model | Check an inferred form or group with `satisfies`. |

Use `FormNodeValue` when the node declaration defines your model. Use
[`FormValueContract`](./form-value-contract.md) when an existing domain model should constrain
the form declaration.

## 🔗 Related reference {#related-reference}

- [`form()`](./form.md) describes declarations, options, and value operations.
- [`field()`](./field.md), [`group()`](./group.md), and [`array()`](./array.md) describe the other supported primitives.
- [`FormValueContract`](./form-value-contract.md) checks an existing value model.
- [`createFormPrimitives()`](./create-form-primitives.md) configures field nullability defaults.
