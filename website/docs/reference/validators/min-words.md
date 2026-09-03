---
title: minWords()
---

# minWords()

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
minWords(minimum)
minWords(minimum, message)
minWords(minimum, options)
```

Reactive constraint arguments use a zero-argument function. The function may read signals and,
where supported, return `undefined` to disable the constraint temporarily.

## Usage and behavior

Requires a non-empty string to contain at least a number of words:

```ts
const myForm = form({
  summary: field('', [required, minWords(3)]),
  description: field('', [minWords(() => minimumWords())]),
  biography: field('', [minWords(3, 'Add more detail.')]),
});
```

`null` and `''` pass. A reactive minimum returning `undefined` or `NaN` disables the constraint. A word is a Unicode letter-or-number sequence that may contain internal apostrophes or hyphens, so `L'été` and `well-known` each count as one word. A failure is `{ kind: 'minWords', minWords, actual, message }`, where `actual` is the observed word count.

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
const requireDetailedSummary = signal(false);
const summary = field('Too short', [minWords(20, {
  when: () => requireDetailedSummary(),
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
