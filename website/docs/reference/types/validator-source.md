---
title: ValidatorSource
---

# ValidatorSource

One validator or a readonly list in which null and undefined represent no validator.

## Import

```ts
import type { ValidatorSource } from '@ngblocks/form-nodes';
```

## When to use it

Use for inputs accepting declaration validator sources. Both parameterless and context-taking declaration callbacks have unchecked returns. The context and node model remain typed.

The internal `DeclarationValidator<TValue, TField>` signature is `(context: ValidatorContext<TValue, ValidatorApi<TValue>, TField>) => any`.

:::info Supported results remain typed contracts

The `any` return avoids circular initializer inference; it does not expand valid runtime results. Return [`ValidationResult`](./validation-result.md) for errors/messages/success, or [`ComposableValidationResult<TValue, TField>`](./composable-validation-result.md) for synchronous composition. Annotate that return or use a context-taking [`validator()`](../validator.md) helper for checked authoring. Returned inline callbacks need such a checked context. See the [full result contract](../../guides/validation.md#validator-results).

:::

## Declaration

```ts
type ValidatorSource<TValue, TField extends AnyNode = ValidatorNode> = DeclarationValidator<TValue, TField> | DeferredValidator | readonly [
    validator?: DeferredValidator | DeclarationValidator<TValue, TField> | ValidationSuccess,
    ...validators: (DeferredValidator | DeclarationValidator<TValue, TField> | ValidationSuccess)[]
];
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | Required |
| `TField` | `AnyNode` | `ValidatorNode` |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [AnyNode](./any-node.md)
- [ValidationSuccess](./validation-success.md)
