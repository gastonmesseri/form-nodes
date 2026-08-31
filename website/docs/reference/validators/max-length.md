---
title: maxLength()
---

# maxLength()

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
maxLength(maximum)
maxLength(maximum, message)
maxLength(maximum, options)
```

Reactive constraint arguments use a zero-argument function. The function may read signals and,
where supported, return `undefined` to disable the constraint temporarily.

## Usage and behavior

Requires a numeric `length` or `size` not to exceed a maximum:

```ts
const myForm = form({
  biography: field('', [maxLength(500)]),
  dependentBiography: field('', [maxLength(() => biographyLimit())]),
  tags: field<string[]>(['angular'], [maxLength(10, 'Choose at most 10 tags.')]),
});
```

It supports the same `length` and `size` values as `minLength`. `null` and `''` pass, while empty collections are measured normally. A reactive maximum returning `undefined` disables the constraint. A failure is `{ kind: 'maxLength', maxLength, actual, message }`. The resolved limit contributes to `maxLength()` metadata.

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
const limitBiography = signal(false);
const biography = field('A'.repeat(200), [maxLength(160, {
  when: () => limitBiography(),
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
