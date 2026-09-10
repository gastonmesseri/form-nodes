---
title: ValidatorSource
---

# ValidatorSource

One validator or a readonly list in which `null` and `undefined` represent no validator.

## Import

```ts
import type { ValidatorSource } from '@ngblocks/form-nodes';
```

## When to use it

Use for an input accepting the same flexible validator sources as node declarations. Parameterless callbacks intentionally have unchecked returns to support class self-references.

## Declaration

```ts
type ValidatorSource<TValue, TField extends AnyNode = ValidatorNode> = ComposableValidator<TValue, TField> | DeferredValidator | readonly [
    validator?: DeferredValidator | ComposableValidator<TValue, TField> | ValidationSuccess,
    ...validators: (DeferredValidator | ComposableValidator<TValue, TField> | ValidationSuccess)[]
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
- [ComposableValidator](./composable-validator.md)
- [ValidationSuccess](./validation-success.md)
