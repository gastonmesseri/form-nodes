---
title: lengthBetween()
---

# lengthBetween()

import CodeBlock from '@theme/CodeBlock';
import staticSource from '!!raw-loader!../../../examples/length-between.example.ts';
import reactiveSource from '!!raw-loader!../../../examples/length-between-reactive.example.ts';

Combines [`minLength`](./min-length.md) and [`maxLength`](./max-length.md) in one validator,
with inclusive bounds and the existing error kinds and message fallbacks.

## Signatures

```ts
lengthBetween(minimum, maximum)
lengthBetween(minimum, maximum, message)
lengthBetween(minimum, maximum, options)
```

Each bound accepts `number | (() => number | undefined)`. Options support `message`, `error`,
and `when`, with the same contracts as other [built-in validators](../built-in-validators.md).
`message` and `error` are mutually exclusive.

## Text and collections

<CodeBlock language="ts" title="length-between.example.ts">{staticSource}</CodeBlock>

Strings, arrays, sets, maps, and other values with numeric `length` or `size` are supported.
When both properties exist, numeric `length` takes precedence. Strings use JavaScript's UTF-16
length, including whitespace, without trimming or counting grapheme clusters.

`null` and `undefined` pass. Empty strings and collections have length zero and fail a positive
minimum. Add `required` to reject nullish values too. As with `maxLength`, the upper bound skips
empty strings, even for a negative maximum; empty collections are measured normally.

This follows Form Nodes' `minLength` behavior: Angular Signal Forms v22.1.6 skips empty strings
for minimum-length validation, while Form Nodes measures them.

A short value produces `{ kind: 'minLength', minLength, actual, message }`; a long value produces
`{ kind: 'maxLength', maxLength, actual, message }`. `actual` is the observed length or size.
Use `getError('minLength')` and `getError('maxLength')` and the corresponding existing message
catalog entries. There is no separate error kind for the combined validator.

Bounds are not reordered, rounded, or clamped. Reversed bounds may produce both errors, in
minimum-then-maximum order. This preserves the behavior of declaring the two rules separately.

## Reactive bounds and conditions

<CodeBlock language="ts" title="length-between-reactive.example.ts">{reactiveSource}</CodeBlock>

Each bound is independent: `undefined` or `NaN` disables only that bound and its metadata.
Unlike `between()` and `dateBetween()`, an unavailable bound does not disable the whole range.

Use `when` to turn both bounds off together, or explicitly allow optional empty text:

```ts
lengthBetween(3, 20, { when: ({ value }) => value() !== '' })
```

Active bounds contribute minimum- and maximum-length metadata. Fields expose these through
`minLength()` and `maxLength()`, and bound controls receive the corresponding constraints.
Multiple validators combine using the largest minimum and the smallest maximum. The rule
does not contribute required state.

Validation is synchronous, requires no injector, and tracks signals read by active constraints,
conditions, and failing message/error callbacks. Descendant failures invalidate parent forms.
Validation does not mark nodes dirty or touched. Normal node rules still apply: control input
waits for debounce to commit, resets revalidate the resulting value, and disabled, readonly,
or hidden nodes skip validation until interactive again.

## Messages and custom errors

Use a static message for either failing bound:

```ts
lengthBetween(3, 20, 'Enter between 3 and 20 characters.')
```

Alternatively, provide `{ message: () => ... }` for a reactive message. Returning `undefined`
uses the existing `minLength` or `maxLength` message fallbacks.

The `error` option replaces all failures from this validator. Its callback runs once per
validation execution when either bound fails, including when both fail. Returning an empty
array, `null`, or `undefined` suppresses the failure while retaining active constraint metadata.
See [validator messages](../../guides/validator-messages.md) and
[custom errors](../built-in-validators.md#custom-errors).

## Related reference

- [Built-in validators](../built-in-validators.md)
- [minLength()](./min-length.md)
- [maxLength()](./max-length.md)
- [Dynamic arrays](../../guides/dynamic-arrays.md)
