---
title: ValidatorOptions
---

# ValidatorOptions

Common options supported by built-in validators.

## Import

```ts
import type { ValidatorOptions } from '@ngblocks/form-nodes';
```

## When to use it

Use for reusable custom validator configuration. Built-in validators expose their concrete options inline; consult each validator for supported value and context types.

## Declaration

```ts
type ValidatorOptions<TValue = unknown> = ({
    message?: string | (() => string | undefined);
    error?: never;
} | {
    message?: never;
    error?: ValidationResult | ((context: ValidatorContext<TValue>) => ValidationResult);
}) & {
    when?: DeferredCondition | ((context: ValidatorContext<TValue>) => boolean);
};
```

## Type parameters

| Parameter | Constraint | Default |
| --- | --- | --- |
| `TValue` | Unconstrained | `unknown` |

## Declared members

The declaration above also includes inherited contracts and overloads where applicable.

| Member | Meaning |
| --- | --- |
| `message` | Human-readable message returned with the validation error. |
| `error` | Custom error or errors returned instead of the built-in error. |
| `when` | Reactive predicate deciding whether the validator and its constraint metadata are active. Parameterless conditions have unchecked returns for class self-references; return a boolean. Context-taking conditions retain boolean checking. |

## Related reference

- [Validation reference](../validation.md)
- [Public types index](./index.md)
- [ValidationResult](./validation-result.md)
- [ValidatorContext](./validator-context.md)
