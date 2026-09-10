---
title: GroupFactory
---

# GroupFactory

The group factory returned by createFormPrimitives().

## Import

```ts
import type { GroupFactory } from '@ngblocks/form-nodes';
```

## When to use it

Use when passing the configured group factory from [`createFormPrimitives()`](../create-form-primitives.md) to reusable declaration helpers.

## Declaration

```ts
interface GroupFactory<TNullable extends boolean> {
    (): ConfiguredGroup<{}, TNullable>;
    <TDefinitions extends ObjectNodeDefinitions>(definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions>, ...args: [
        validatorsOrOptions?: NoInfer<ValidatorSource<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, GroupNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>> | NoInfer<GroupOptions<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, GroupNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>>
    ] | [
        validators: NoInfer<ValidatorSource<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, GroupNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>> | undefined,
        options: NoInfer<GroupOptions<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, GroupNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>> | undefined
    ]): ConfiguredGroup<TDefinitions, TNullable>;
}
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNullable` | `boolean` | Required |

## Related reference

- [createFormPrimitives()](../create-form-primitives.md)
- [Public types index](./index.md)
- [FormValue](./form-value.md)
- [GroupNode](./group-node.md)
- [GroupOptions](./group-options.md)
- [ValidatorSource](./validator-source.md)
