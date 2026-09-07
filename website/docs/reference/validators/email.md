---
title: email()
---

# email() {#email}

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
email
email(message)
email(options)
```

This validator has no configurable constraint value. Its options customize the failure message,
which may itself be reactive, and the reactive `when` condition.

## 📖 Usage and behavior {#usage-and-behavior}

Validates Angular's standard email-address format. It can be passed directly or called with message options:

```ts
const myForm = form({
  email: field('', [required, email]),
  workEmail: field('', [
    email('Enter a valid work email.'),
  ]),
});
```

`null` and `''` pass. Use `required` when the address must be present. The format includes local-part, domain-label, and total-length restrictions. A failure is `{ kind: 'email', message }`; the rejected address is intentionally omitted from the error.

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
const validateWorkEmail = signal(false);
const emailAddress = field('invalid', [
  email({ when: () => validateWorkEmail() })
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
