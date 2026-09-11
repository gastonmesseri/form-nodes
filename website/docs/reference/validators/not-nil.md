---
title: notNil()
---

# notNil()

Rejects only `null` and `undefined`. Values such as `false`, `0`, `''`, `NaN`, empty arrays, and empty objects pass.

## Signatures

```ts
notNil
notNil(message)
notNil(options)
```

Pass the function directly for its default behavior:

```ts
const checkout = form({
  reference: field<string>(null, [notNil]),
});
```

A failure has the shape `{ kind: 'notNil', message }`. The field retains its declared value
type; successful validation does not narrow nullable types.

## notNil versus required {#not-nil-vs-required}

`notNil` checks whether a value exists, allowing an empty string or `NaN`. Use
[`required`](./required.md#required-vs-not-nil) when those values should also fail:

| Value | `notNil` | `required` |
| --- | --- | --- |
| `null`, `undefined` | Invalid | Invalid |
| `''`, `NaN` | Valid | Invalid |
| `false`, `true`, `0` | Valid | Valid |
| Whitespace-only strings | Valid | Valid |
| Empty arrays, sets, maps, or objects | Valid | Valid |

For example, `notNil` allows a reference that has deliberately been set to `''`, while
`required` requires a non-empty string. Neither trims whitespace or requires a collection to
contain items; add a suitable content or length validator for those requirements.

The state distinction is intentional: `notNil` contributes no required metadata or native
required constraint, while an active `required` rule contributes `node.required() === true`.
Their failure kinds and message-catalog keys are `notNil` and `required`, respectively.

Both accept `false` as a valid boolean answer. To require an affirmative value, use
[`requiredTrue`](./required-true.md), which accepts only `true`.

## Custom messages and errors

```ts
const checkout = form({
  reference: field<string>(null, [notNil('Provide a reference.')]),
});
```

The default message is **Please provide a value.**.
The options object also accepts `message: () => translations().notNil`.
Returning `undefined` from a message function continues through node, provider, global, and
built-in fallbacks. Message catalogs use the `notNil` key. See [validator messages](../../guides/validator-messages.md).

An `error` option can replace the default error with one error, an array, or a reactive
context callback. Returning `null`, `undefined`, or an empty array suppresses the failure.
`error` and `message` are mutually exclusive. See [custom errors](../built-in-validators.md#custom-errors).

## Conditional validation

```ts
const enabled = signal(true);
const checkout = form({
  reference: field<string>(null, [notNil({ when: () => enabled() })]),
});
```

Signals read by `when`, messages, and custom error callbacks are tracked. An inactive rule
contributes no errors or metadata. Disabled, readonly, and hidden nodes skip validation.

## Required state and controls

This validator supplies **no required metadata**: by itself, `node.required()` and
`useFormNodeState().required()` remain false even when the value fails validation.
It does not enable HTML `required`, which would reject valid empty strings or unchecked checkboxes.
Errors still affect field and ancestor validity and appear in `<form-node-errors>` normally.

Use [`required`](./required.md) to also reject empty strings and `NaN`, or
[`requiredTrue`](./required-true.md) to require affirmative acceptance.

See the [comparison and executable example](./required.md#boolean-answers-and-acceptance) and [built-in validator catalog](../built-in-validators.md).
