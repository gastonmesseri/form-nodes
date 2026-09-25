---
title: lessThan()
---

# lessThan() {#less-than}

## Signatures

```ts
lessThan(limit)
lessThan(limit, message)
lessThan(limit, options)
```

The limit is a number or a zero-argument function returning a number or `undefined`.

## Usage and behavior

Requires a number **strictly less than** the limit. Equality fails, while any smaller decimal
passes:

```ts
import { field, form, lessThan } from '@ngblocks/form-nodes';

const order = form({
  discount: field(1, [lessThan(1)]),
});
order.discount.invalid(); // true
order.discount.set(0.9);
order.discount.valid(); // true
```

`null` and `NaN` pass, so add `required` when an empty value must fail. A limit of `NaN`, or a
reactive limit returning `undefined`, temporarily disables the rule. A failure is
`{ kind: 'lessThan', limit, actual, message }`.

This rule does not contribute to `max()` metadata. That metadata represents an inclusive bound
and can be forwarded to native controls; validation still runs for `[formNode]` bound fields.

## Reactive limits

```ts
import { signal } from '@angular/core';
import { field, lessThan } from '@ngblocks/form-nodes';

const upperBound = signal(1);
const discount = field(1, [lessThan(() => upperBound())]);
upperBound.set(2);
discount.valid(); // true
```

Signals read by the limit function trigger revalidation. The options object also accepts a
reactive `when` predicate; `false` skips the rule.

## Messages and custom errors

```ts
import { field, lessThan } from '@ngblocks/form-nodes';

const discount = field(1, [lessThan(1, 'Enter a value below 1.')]);
```

An options object accepts `message`, `when`, or `error`. A reactive message runs only while the
rule fails. Returning `undefined` continues through node, provider, global, and default messages.
The `error` option replaces the structured error and cannot be combined with `message`.

See [Validator messages](../../guides/validator-messages.md) and
[Built-in validators](../built-in-validators.md).
