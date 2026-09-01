---
title: minLength()
---

# minLength()

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
minLength(minimum)
minLength(minimum, message)
minLength(minimum, options)
```

Reactive constraint arguments use a zero-argument function. The function may read signals and,
where supported, return `undefined` to disable the constraint temporarily.

## Usage and behavior

Requires a numeric `length` or `size` to meet a minimum:

```ts
const myForm = form({
  password: field('', [required, minLength(12)]),
  dependentPassword: field('', [minLength(() => minimumPasswordLength())]),
  tags: field<string[]>([], [minLength(2, 'Choose more tags.')]),
});
```

It supports strings, arrays, sets, maps, and other values with numeric `length` or `size`. `null` and `''` pass, but empty collections are measured normally. A reactive minimum returning `undefined` disables the constraint. A failure is `{ kind: 'minLength', minLength, actual, message }`. The resolved limit contributes to `minLength()` metadata.

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
const requireLongCode = signal(false);
const code = field('ABC', [
  minLength(8, { when: () => requireLongCode() })
]);
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
