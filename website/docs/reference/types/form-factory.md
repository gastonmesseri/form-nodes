---
title: FormFactory
---

# FormFactory

The form factory returned by createFormPrimitives().

## Import

```ts
import type { FormFactory } from '@ngblocks/form-nodes';
```

## When to use it

Use when passing the configured form factory from `createFormPrimitives()` to reusable declaration helpers.

## Declaration

```ts
interface FormFactory<TNullable extends boolean> {
    (): ConfiguredForm<{}, TNullable>;
    <TDefinitions extends ObjectNodeDefinitions>(definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions>, ...args: [
        validatorsOrOptions?: NoInfer<ValidatorSource<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, FormNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>> | NoInfer<FormOptions<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, FormNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>>
    ] | [
        validators: NoInfer<ValidatorSource<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, FormNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>> | undefined,
        options: NoInfer<FormOptions<FormValue<NormalizedNodesWithDefault<TDefinitions, TNullable>>, FormNode<NormalizedNodesWithDefault<TDefinitions, TNullable>>>> | undefined
    ]): ConfiguredForm<TDefinitions, TNullable>;
}
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNullable` | `boolean` | Required |

## Related reference

- [createFormPrimitives()](../create-form-primitives.md)
- [Public types index](./index.md)
- [FormNode](./form-node.md)
- [FormOptions](./form-options.md)
- [FormValue](./form-value.md)
- [ValidatorSource](./validator-source.md)
