---
title: ValidatorContext
---

# ValidatorContext

Reactive context provided to synchronous validators. Generic public owners retain TValue on their node value reads. Concrete owners and partial structural owner contracts retain their value and child types through a read-only validation view. Validation outputs, metadata queries, and mutations are omitted recursively.

## Import

```ts
import type { ValidatorContext } from '@ngblocks/form-nodes';
```

## When to use it

Use for a synchronous callback's context. Read its reactive `value` and navigation API rather than assuming a concrete primitive unless the generic supplies one. Use `ctx.parent<TParent>()` for an explicit immediate-parent contract; this is a type assertion with no runtime check and always preserves null and the recursive read-only validation view. Nullish members of the generic are removed automatically, so `ctx.parent<PageForm['roles'][number]>()` needs no `NonNullable` wrapper and returns a node view or null, never undefined. Validation outputs and mutations stay unavailable even with an explicit generic. Prefer [configure](../../guides/configuring-nodes.md) for inferred sibling access.

## Declaration

```ts
type ValidatorContext<TValue, TApi extends ValidatorReadonlyApi<TValue> = ValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = Pick<TApi, 'path'> & {
    readonly parent: Pick<TApi['parent'], keyof TApi['parent']> & {
        <TParent extends {
            $api: {
                nodeType(): 'form' | 'group' | 'array';
            };
        } | null | undefined = NonNullable<ReturnType<TApi['parent']>>>(): ValidatorNodeView<NonNullable<TParent>> | null;
        (): ValidatorNodeView<ReturnType<TApi['parent']>>;
    };
    readonly value: ValidatorNode extends TField ? TApi['value'] : ValidatorValueSignal<ReturnType<TField['$api']['value']>>;
    readonly field: Signal<ValidatorNodeView<ValidatorNode extends TField ? 'nodeType' extends keyof TField ? ValidatorNode<TValue> : TField : TField>>;
    readonly node: Signal<ValidatorNodeView<ValidatorNode extends TField ? 'nodeType' extends keyof TField ? ValidatorNode<TValue> : TField : TField>>;
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |
| `TApi` | `ValidatorReadonlyApi<TValue>` | `ValidatorApi<TValue>` |
| `TField` | `AnyNode` | `ValidatorNode` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `parent` | Reactive immediate parent, or null before attachment and after detachment. Supply a parent node type to declare a structural contract: `ctx.parent&lt;RoleNode&gt;()`. Indexed row types may include null or undefined: `ctx.parent&lt;PageForm['roles'][number]&gt;()`. The generic removes those nullish members; the result is the read-only node view or null, never undefined. This is a type assertion, not inference or runtime validation; null and the read-only validation view are always preserved, including when an explicit generic is supplied. Prefer configure option callbacks for inferred sibling access without an assertion. |
| `value` | Current committed value of the node being validated. |
| `field` | Readonly signal of the node being validated, with validation outputs and mutations omitted recursively from its type, including navigation and child access. `ctx.node()` and `ctx.field()` return the same node. Read its value with `ctx.value()`. |
| `node` | Readonly signal of the node being validated, with validation outputs and mutations omitted recursively from its type, including navigation and child access. `ctx.node()` and `ctx.field()` return the same node. Read its value with `ctx.value()`. |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ValidatorApi](./validator-api.md)
- [ValidatorReadonlyApi](./validator-readonly-api.md)
