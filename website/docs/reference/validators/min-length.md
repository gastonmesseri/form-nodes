---
title: minLength()
---

# minLength() {#minlength}

import CodeBlock from '@theme/CodeBlock';
import minimumSource from '!!raw-loader!../../../examples/min-length.example.ts';
import optionalSource from '!!raw-loader!../../../examples/min-length-optional.example.ts';
import reactiveSource from '!!raw-loader!../../../examples/min-length-reactive.example.ts';

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

Requires a numeric `length` or `size` to meet a minimum, including zero-length values:

<CodeBlock language="ts" title="min-length.example.ts">{minimumSource}</CodeBlock>

It supports strings, arrays, sets, maps, and other values with numeric `length` or `size`.
`null` and `undefined` pass; empty strings and collections have length zero and fail a positive
minimum. `minLength(0)` permits empty values. Whitespace is counted without trimming.
Explicitly undefined-valued fields such as `field<string>(undefined, [minLength(3)])` are also supported.

A failure is `{ kind: 'minLength', minLength, actual, message }`. The resolved limit contributes
to `minLength()` metadata, but does not mark the node as `required`.

:::info Difference from Angular forms
Angular Reactive Forms and Signal Forms v22.1.6 skip empty strings in `minLength`.
Form Nodes measures them, consistently with empty collections. Add [`required`](./required.md)
to reject nullish values too. An empty string with both validators produces both error kinds.
See the [migration guide](../../project/migrations.md#minimum-length-empty-text).
:::

### Optional empty text {#optional-empty-text}

To allow either an empty string or a string meeting the minimum, make that exception explicit:

<CodeBlock language="ts" title="min-length-optional.example.ts">{optionalSource}</CodeBlock>

While `when` is false, the rule contributes neither an error nor minimum-length metadata.
This also removes this rule's contribution to the native `minlength` constraint on bound controls.

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

The minimum may be a signal or a zero-argument function. Changes revalidate even an empty string;
returning `undefined` disables the constraint:

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
