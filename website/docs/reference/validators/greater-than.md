---
title: greaterThan()
---

# greaterThan() {#greater-than}

## Signatures

```ts
greaterThan(limit)
greaterThan(limit, message)
greaterThan(limit, options)
```

The limit is a number or a zero-argument function returning a number or `undefined`.

## Usage and behavior

Requires a number **strictly greater than** the limit. Equality fails, while any greater decimal
passes:

```ts
import { field, form, greaterThan } from '@ngblocks/form-nodes';

const order = form({
  quantity: field(1, [greaterThan(1)]),
});
order.quantity.invalid(); // true
order.quantity.set(1.1);
order.quantity.valid(); // true
```

`null` and `NaN` pass, so add `required` when an empty value must fail. A limit of `NaN`, or a
reactive limit returning `undefined`, temporarily disables the rule. A failure is
`{ kind: 'greaterThan', limit, actual, message }`.

This rule does not contribute to `min()` metadata. That metadata represents an inclusive bound
and can be forwarded to native controls; validation still runs for `[formNode]` bound fields.

## Reactive limits

```ts
import { signal } from '@angular/core';
import { field, greaterThan } from '@ngblocks/form-nodes';

const lowerBound = signal(1);
const amount = field(1, [greaterThan(() => lowerBound())]);
lowerBound.set(0);
amount.valid(); // true
```

Signals read by the limit function trigger revalidation. The options object also accepts a
reactive `when` predicate; `false` skips the rule.

## Messages and custom errors

```ts
import { field, greaterThan } from '@ngblocks/form-nodes';

const amount = field(1, [greaterThan(1, 'Enter a value above 1.')]);
```

An options object accepts `message`, `when`, or `error`. A reactive message runs only while the
rule fails. Returning `undefined` continues through node, provider, global, and default messages.
The `error` option replaces the structured error and cannot be combined with `message`.

See [Validator messages](../../guides/validator-messages.md) and
[Built-in validators](../built-in-validators.md).
