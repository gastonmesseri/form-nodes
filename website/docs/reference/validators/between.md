---
title: between()
---

# between()

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
between(minimum, maximum)
between(minimum, maximum, message)
between(minimum, maximum, options)
```

Reactive constraint arguments use a zero-argument function. The function may read signals and,
where supported, return `undefined` to disable the constraint temporarily.

## Usage and behavior

Requires a number within an inclusive range:

```ts
const myForm = form({
  age: field(17, [between(18, 65)]),
  dependentAge: field(70, [
    between(
      () => allowedAge().minimum,
      () => allowedAge().maximum,
    ),
  ]),
  employeeAge: field(70, [
    between(18, 65, 'Enter an age within the supported range.'),
  ]),
});
```

`null` and `NaN` pass. If either boundary resolves to `undefined` or `NaN`, the complete range is temporarily disabled. A failure is `{ kind: 'between', min, max, actual, message }`. Both boundaries contribute to `min()` and `max()` metadata.

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
const validateRange = signal(false);
const guests = field(12, [between(1, 10, {
  when: () => validateRange(),
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
