---
title: requiredTrue()
---

# requiredTrue()

Requires exactly `true`. Every other value fails, including `false`, `null`, `undefined`, `1`, and `'true'`.

## Signatures

```ts
requiredTrue
requiredTrue(message)
requiredTrue(options)
```

Pass the function directly for its default behavior:

```ts
const checkout = form({
  acceptedTerms: field(false, [requiredTrue]),
});
```

A failure has the shape `{ kind: 'requiredTrue', message }`. The field retains its declared value
type; successful validation does not narrow nullable types.

## Custom messages and errors

```ts
const checkout = form({
  acceptedTerms: field(false, [requiredTrue('Accept the terms to continue.')]),
});
```

The default message is **This field must be accepted.**.
The options object also accepts `message: () => translations().requiredTrue`.
Returning `undefined` from a message function continues through node, provider, global, and
built-in fallbacks. Message catalogs use the `requiredTrue` key. See [validator messages](../../guides/validator-messages.md).

An `error` option can replace the default error with one error, an array, or a reactive
context callback. Returning `null`, `undefined`, or an empty array suppresses the failure.
`error` and `message` are mutually exclusive. See [custom errors](../built-in-validators.md#custom-errors).

## Conditional validation

```ts
const enabled = signal(true);
const checkout = form({
  acceptedTerms: field(false, [requiredTrue({ when: () => enabled() })]),
});
```

Signals read by `when`, messages, and custom error callbacks are tracked. An inactive rule
contributes no errors or metadata. Disabled, readonly, and hidden nodes skip validation.

## Required state and controls

An active rule contributes `required() === true` even when its value is valid or the node is
disabled. Custom error replacements retain this metadata. `[formNode]` mirrors the constraint
to native checkbox `required`; optional `syncInputs` does the same for custom controls exposing
a public `checked` input. Other controls receive the usual logical required state.

For a yes/no question where either answer is valid, use [`required`](./required.md) with an initial
`null`. For an existing `equalTo(true)` rule, `requiredTrue` additionally supplies acceptance metadata
and its own error kind.

See the [comparison and executable example](./required.md#boolean-answers-and-acceptance) and [built-in validator catalog](../built-in-validators.md).
