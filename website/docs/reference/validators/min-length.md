---
title: minLength()
---

# minLength() {#minlength}

import CodeBlock from '@theme/CodeBlock';
import minimumSource from '!!raw-loader!../../../examples/min-length.example.ts';
import optionalSource from '!!raw-loader!../../../examples/min-length-optional.example.ts';
import reactiveSource from '!!raw-loader!../../../examples/min-length-reactive.example.ts';
import emptyValuesSource from '!!raw-loader!../../../examples/min-length-empty-values.example.ts';

## 🧭 API map {#api-map}

| I want to… | Details |
| --- | --- |
| See every accepted call style | [Signatures](#signatures) |
| See common and advanced usage | [Usage and behavior](#usage-and-behavior) |
| Customize messages | [Message configuration](#message-configuration) |
| Understand reactive constraints | [Reactive behavior](#reactive-behavior) |
| Return to the complete catalog | [Built-in validators](../built-in-validators.md) |

## 📐 Signatures {#signatures}

```ts
minLength(minimum)
minLength(minimum, message)
minLength(minimum, options)
```

Reactive constraint arguments use a zero-argument function. The function may read signals and,
where supported, return `undefined` to disable the constraint temporarily.

## 📖 Usage and behavior {#usage-and-behavior}

Requires a numeric `length` or `size` to meet a minimum, with optional empty text by default:

<CodeBlock language="ts" title="min-length.example.ts">{minimumSource}</CodeBlock>

It supports strings, arrays, sets, maps, and other values with numeric `length` or `size`.
`null`, `undefined`, and empty strings pass by default. Empty collections have length zero and
fail a positive minimum. `minLength(0)` permits empty collections. Whitespace counts without trimming.
Explicitly undefined-valued fields such as `field<string>(undefined, [minLength(3)])` are also supported.

A failure is `{ kind: 'minLength', minLength, actual, message }`. The resolved limit contributes
to `minLength()` metadata, but does not mark the node as `required`.

:::info Empty strings pass; empty arrays must meet the minimum
With `minLength(3)`, **`''` is valid**, but **`[]` is invalid**. An empty string skips the
length check by default; an empty array is measured as zero items. Nonempty strings such as
`'a'` must meet the minimum and are invalid when shorter than three characters.

<CodeBlock language="ts" title="min-length-empty-values.example.ts">{emptyValuesSource}</CodeBlock>

This follows Angular Signal Forms. Reactive Forms also allows `''`, but additionally skips
empty collections.
Add [`required`](./required.md) to reject empty text and nullish values; an empty string then
produces only the `required` error with the default options.
:::

### Optional empty text {#optional-empty-text}

An empty string passes without a condition, while populated text must meet the minimum:

<CodeBlock language="ts" title="min-length-optional.example.ts">{optionalSource}</CodeBlock>

The configured minimum remains in `minLength()` metadata and on bound controls, even for `''`.
A false `when` condition instead removes both the errors and the rule's constraint metadata.

### Validate empty strings {#validate-empty-strings}

Set `allowEmptyString: false` to measure `''` as zero, retaining the previous behavior:

```ts
minLength(3, { allowEmptyString: false })
```

`allowEmptyString` is a static boolean, defaults to `true`, and only affects empty strings.
Nullish values still pass, and empty collections still fail a positive minimum in either mode.
With `allowEmptyString: false`, combining `required` and `minLength` produces both errors for `''`.

## 💬 Message configuration {#message-configuration}

Every failure has a default English message. Pass a string as the final argument
or use an options object for a static or reactive message:

```ts
minLength(3, 'Enter at least three characters.')
```

A message function may read signals. Returning `undefined` continues through node, Angular
provider, process-wide, and built-in message fallbacks. See
[Validator messages](../../guides/validator-messages.md).

## ⚡ Reactive behavior {#reactive-behavior}

The minimum may be a signal or a zero-argument function. Changes update its metadata even while
the string is empty; populated strings revalidate. Returning `undefined` disables the constraint:

<CodeBlock language="ts" title="min-length-reactive.example.ts">{reactiveSource}</CodeBlock>

Reactive constraint functions and message functions track the signals they read. When a resolved
constraint becomes unavailable, validators that support optional constraint sources temporarily
stop contributing their error and metadata.

The validator runs synchronously as part of its node's validator source. Disabled, readonly, and
hidden nodes skip validation until they become interactive again.

For an inclusive range in one validator, use [`lengthBetween()`](./length-between.md).

## 🔗 Related reference {#related-reference}

- [Built-in validators](../built-in-validators.md)
- [Validation](../validation.md)
- [`validator()`](../validator.md)
