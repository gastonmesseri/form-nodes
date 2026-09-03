---
title: equalTo()
---

# equalTo()

## API map

| I want to… | Details |
| --- | --- |
| See every accepted call style | [Signatures](#signatures) |
| See common and advanced usage | [Usage and behavior](#usage-and-behavior) |
| Customize messages | [Message configuration](#message-configuration) |
| Understand reactive constraints | [Reactive behavior](#reactive-behavior) |
| Return to the complete catalog | [Built-in validators](../built-in-validators.md) |

## Signatures

```ts
equalTo(expectedValue)
equalTo(expectedValue, message)
equalTo(expectedValue, options)
```

Reactive constraint arguments use a zero-argument function. The function may read signals and,
where supported, return `undefined` to disable the constraint temporarily.

## Usage and behavior

Requires a value to equal a static or reactive expected value using `Object.is()`:

```ts
const password = field('');
const myForm = form({
  termsAccepted: field(false, [equalTo(true)]),
  password,
  confirmation: field('', [equalTo(() => password())]),
  confirmedTerms: field(false, [
    equalTo(true, 'You must accept the terms.'),
  ]),
});
```

Unlike optional format validators, `null` and `undefined` are compared as real values rather than skipped. Signals read by the expected-value source are tracked. A failure is `{ kind: 'equalTo', message }`; both compared values are deliberately omitted so confirmation errors do not expose secrets.

## Message configuration

Every failure has a default English message. Where supported, pass a string as the final argument
or use an options object for a static or reactive message, as shown above.

A message function may read signals. Returning `undefined` continues through node, Angular
provider, process-wide, and built-in message fallbacks. See
[Validator messages](../../guides/validator-messages.md).

## Reactive behavior

The options object accepts a reactive `when` predicate. Signals read from its validator context are
tracked; while it returns `false`, the rule contributes neither errors nor constraint metadata.

```ts
const requireConfirmation = signal(false);
const password = signal('secret');
const confirmation = field('', [equalTo(() => password(), {
  when: () => requireConfirmation(),
})]);
```

Reactive constraint functions and message functions track the signals they read. When a resolved
constraint becomes unavailable, validators that support optional constraint sources temporarily
stop contributing their error and metadata.

The validator runs synchronously as part of its node's validator source. Disabled, readonly, and
hidden nodes skip validation until they become interactive again.

## Related reference

- [Built-in validators](../built-in-validators.md)
- [Validation](../validation.md)
- [`validator()`](../validator.md)
