---
title: pattern()
---

# pattern() {#pattern}

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
pattern(expression)
pattern(expression, message)
pattern(expression, options)
```

Reactive constraint arguments use a zero-argument function. The function may read signals and,
where supported, return `undefined` to disable the constraint temporarily.

## 📖 Usage and behavior {#usage-and-behavior}

Requires a non-empty string to match a regular expression:

```ts
const myForm = form({
  code: field('', [pattern(/^[A-Z]{3}-\d{4}$/)]),
  username: field('', [pattern(() => configuredPattern())]),
  countryCode: field('', [pattern(/^[A-Z]+$/, 'Use letters only.')]),
});
```

`null` and `''` pass. A reactive expression returning `undefined` disables the constraint. The expression's `lastIndex` is reset before every check, so global and sticky regular expressions do not reuse stale match state. A failure is `{ kind: 'pattern', pattern, actual, message }`. Every active expression appears in `pattern()` metadata.

At runtime, a `null` or `undefined` constraint argument, or a source returning either value, omits the rule without throwing. TypeScript still requires a concrete constraint or a function returning it (optionally `undefined`); `null` and direct `undefined` arguments remain rejected. Other validators, such as `required`, remain active.

An absent expression contributes no `pattern()` metadata. Restoring a reactive expression restores validation and metadata.

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
const validateReference = signal(false);
const reference = field('123', [
  pattern(/^REF-\d+$/, { when: () => validateReference() })
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
