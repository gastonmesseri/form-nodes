---
title: integer()
---

# integer() {#integer}

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
integer
integer(message)
integer(options)
```

This validator has no configurable constraint value. Its options customize the failure message,
which may itself be reactive, and the reactive `when` condition.

## 📖 Usage and behavior {#usage-and-behavior}

Requires a JavaScript safe integer. It can be passed directly or called with message options:

```ts
const myForm = form({
  quantity: field(1.5, [integer]),
  attempts: field(1.5, [
    integer('Enter a whole number.'),
  ]),
});
```

It uses `Number.isSafeInteger()`, rejecting decimals, `NaN`, infinities, and integers outside JavaScript's exactly representable safe range. `null` passes. A failure is `{ kind: 'integer', actual, message }`.

## 💬 Message configuration {#message-configuration}

Every failure has a default English message. Where supported, pass a string as the final argument
or use an options object for a static or reactive message, as shown above.

A message function may read signals. Returning `undefined` continues through node, Angular
provider, process-wide, and built-in message fallbacks. See
[Validator messages](../../guides/validator-messages.md).

## ⚡ Reactive behavior {#reactive-behavior}

The options object accepts a reactive `when` predicate. Signals read from its validator context are
tracked; while it returns `false`, the rule contributes neither errors nor constraint metadata.

```ts
const wholeNumbersOnly = signal(false);
const quantity = field(1.5, [
  integer({ when: () => wholeNumbersOnly() })
]);
```

Reactive constraint functions and message functions track the signals they read. When a resolved
constraint becomes unavailable, validators that support optional constraint sources temporarily
stop contributing their error and metadata.

The validator runs synchronously as part of its node's validator source. Disabled, readonly, and
hidden nodes skip validation until they become interactive again.

## 🔗 Related reference {#related-reference}

- [Built-in validators](../built-in-validators.md)
- [Validation](../validation.md)
- [`validator()`](../validator.md)
