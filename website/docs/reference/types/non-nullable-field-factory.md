---
title: NonNullableFieldFactory
---

# NonNullableFieldFactory

A configured field factory whose default declarations exclude null.

## Import

```ts
import type { NonNullableFieldFactory } from '@ngblocks/form-nodes';
```

## When to use it

Use for a configured factory whose ordinary field declarations exclude null. Its overloads define how explicit nullable choices are represented.

## Declaration

```ts
interface NonNullableFieldFactory extends FieldNullabilityOverrides {
    (): FieldNode<unknown>;
    (value: null, ...args: [
        validatorsOrOptions?: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | NoInfer<NullableFieldOptions<unknown>>
    ] | [
        validators: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | undefined,
        options: NoInfer<NullableFieldOptions<unknown>> | undefined
    ]): FieldNode<unknown>;
    (value: undefined, ...args: [
        validatorsOrOptions?: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | NoInfer<NullableFieldOptions<unknown>>
    ] | [
        validators: NoInfer<ValidatorSource<unknown, FieldNode<unknown>>> | undefined,
        options: NoInfer<NullableFieldOptions<unknown>> | undefined
    ]): FieldNode<unknown>;
    <TValue>(value: TValue): FieldNode<TValue>;
    <TValue>(value: TValue, validators: NoInfer<ValidatorSource<TValue, FieldNode<TValue>>>): FieldNode<TValue>;
    <TValue extends {}>(value: TValue, ...args: [
        validatorsOrOptions?: NoInfer<ValidatorSource<TValue, FieldNode<TValue>>> | NoInfer<NonNullableFieldOptions<TValue>>
    ] | [
        validators: NoInfer<ValidatorSource<TValue, FieldNode<TValue>>> | undefined,
        options: NoInfer<NonNullableFieldOptions<TValue>> | undefined
    ]): FieldNode<TValue>;
}
```

## Related reference

- [createFormPrimitives()](../create-form-primitives.md)
- [Public types index](./index.md)
- [FieldNode](./field-node.md)
- [ValidatorSource](./validator-source.md)
