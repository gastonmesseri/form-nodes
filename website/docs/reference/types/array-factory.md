---
title: ArrayFactory
---

# ArrayFactory

The array factory returned by createFormPrimitives().

## Import

```ts
import type { ArrayFactory } from '@ngblocks/form-nodes';
```

## When to use it

Use when passing the configured array factory from `createFormPrimitives()` to reusable declaration helpers.

## Declaration

```ts
interface ArrayFactory<TNullable extends boolean> {
    (): ArrayNode<FieldNode<unknown>>;
    <TDefinition extends ArrayTemplate>(template: TDefinition & ArrayTemplateInput<TDefinition>, ...args: [
        validatorsOrOptions?: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | NoInfer<ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>>
    ] | [
        validators: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined,
        options: NoInfer<ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined
    ]): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
    <TDefinition extends ArrayTemplate>(template: TDefinition & ArrayTemplateInput<TDefinition>, initial: NoInfer<ArrayInitial<TDefinition, TNullable>>, ...args: [
        validatorsOrOptions?: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | NoInfer<PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>>
    ] | [
        validators: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined,
        options: NoInfer<PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined
    ]): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
    <TDefinition extends ArrayTemplate>(factory: () => TDefinition & ArrayTemplateInput<TDefinition>, ...args: [
        validatorsOrOptions?: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | NoInfer<ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>>
    ] | [
        validators: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined,
        options: NoInfer<ArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined
    ]): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
    <TDefinition extends ArrayTemplate>(factory: () => TDefinition & ArrayTemplateInput<TDefinition>, initial: NoInfer<ArrayInitial<TDefinition, TNullable>>, ...args: [
        validatorsOrOptions?: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | NoInfer<PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>>
    ] | [
        validators: NoInfer<ValidatorSource<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined,
        options: NoInfer<PositionalArrayOptions<ConfiguredArrayValue<TDefinition, TNullable>, ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>>> | undefined
    ]): ArrayNode<ConfiguredArrayItem<TDefinition, TNullable>>;
}
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TNullable` | `boolean` | Required |

## Related reference

- [createFormPrimitives()](../create-form-primitives.md)
- [Public types index](./index.md)
- [ArrayNode](./array-node.md)
- [ArrayOptions](./array-options.md)
- [FieldNode](./field-node.md)
- [ValidatorSource](./validator-source.md)
