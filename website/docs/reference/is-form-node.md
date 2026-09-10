---
title: isFormNode()
---

import CodeBlock from '@theme/CodeBlock';
import exampleSource from '!!raw-loader!../../examples/is-form-node.example.ts';

# isFormNode()

Checks whether an unknown value is a node created by this instance of Form Nodes.

## Signature

```ts
import { isFormNode } from '@ngblocks/form-nodes';

isFormNode(value: unknown): value is AnyNode
```

## Parameter and return value

`value` accepts any value, including `null` and `undefined`. The result is a boolean type guard:
when true, TypeScript narrows the argument to [`AnyNode`](./node-types.md#any-node).
It does not infer a particular node kind, child structure, or value type. Use `$api` for common
state and operations after narrowing, because direct child names may shadow API members.

## Example

<CodeBlock language="ts" title="is-form-node.example.ts">{exampleSource}</CodeBlock>

The helper can also be passed directly to an array's `filter()` method to obtain `AnyNode[]`.

## Recognized values

| Value | Result |
| --- | --- |
| Nodes created by [`field()`](./field.md), [`form()`](./form.md), [`group()`](./group.md), or [`array()`](./array.md) | `true` |
| Nested nodes and nodes from configured primitives | `true` |
| Detached nodes | `true` |
| Plain objects, ordinary functions, `null`, or `undefined` | `false` |
| Ordinary Angular signals | `false` |
| A node's callable `$api` | `false` |
| Nodes from a separately loaded copy of the library | `false` |

The check reads an internal marker. It does not call the supplied value, read node state, or
establish signal dependencies, and it works outside Angular injection contexts.

The marker belongs to the loaded package instance. This is a node-identity check, not structural
validation or a check that a node is currently attached to a form or binding.

## Related reference

- [Consumer node types](./node-types.md)
- [Node API](./node-api.md)
- [`useClosestForm()`](./use-closest-form.md), which returns an API rather than a node
