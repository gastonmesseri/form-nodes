---
title: Built-in validators
description: Signatures, examples, empty-value behavior, errors, and metadata for every built-in Gem Forms validator.
---

# Built-in validators

This page documents every built-in validator, including every supported call style and the values each rule intentionally does not reject.

Most format and constraint validators accept an empty value so they compose cleanly with `required`:

```ts
field('', [required, email]);
```

Every built-in failure includes a default English `message`. An options object can replace it with a static or reactive message:

```ts
min(18, { message: 'You must be an adult.' });
min(18, { message: () => translations().minimumAge });
```

Returning `undefined` from a message function continues through form, provider, global, and built-in message fallbacks. See [Validator messages and i18n](../guides/validator-messages.md).

Constraints passed as functions are reactive. Signals read by them are tracked, and returning `undefined` temporarily disables constraints that support optional sources.

## `required`

Requires a value to be present. It can be passed directly or called with message options:

```ts
const name = field('', [required]);

const surname = field('', [
  required({ message: 'Enter your surname.' }),
]);
```

It rejects `null`, `undefined`, `''`, `false`, and `NaN`. It does **not** reject empty arrays, sets, maps, or objects. Use `minLength(1)` when a collection must contain an item:

```ts
const roles = array(field(''), {
  initialValue: [],
  validators: [required, minLength(1)],
});
```

A failure is `{ kind: 'required', message }`. The validator contributes `required() === true` metadata to its node.

## `min`

Requires a number greater than or equal to an inclusive minimum:

```ts
const age = field(16, [min(18)]);

const reactiveAge = field(16, [
  min(() => minimumAge(), { message: 'You must be an adult.' }),
]);
```

`null` and `NaN` pass. A reactive minimum returning `undefined` or `NaN` disables the constraint temporarily. A failure is `{ kind: 'min', min, actual, message }`. The resolved limit contributes to `min()` metadata.

## `max`

Requires a number less than or equal to an inclusive maximum:

```ts
const age = field(130, [max(120)]);

const reactiveAge = field(130, [
  max(() => maximumAge(), { message: 'Enter a realistic age.' }),
]);
```

`null` and `NaN` pass. A reactive maximum returning `undefined` or `NaN` disables the constraint temporarily. A failure is `{ kind: 'max', max, actual, message }`. The resolved limit contributes to `max()` metadata.

## `between`

Requires a number within an inclusive range:

```ts
const age = field(17, [between(18, 65)]);

const reactiveAge = field(70, [
  between(
    () => allowedAge().minimum,
    () => allowedAge().maximum,
    { message: 'Enter an age within the supported range.' },
  ),
]);
```

`null` and `NaN` pass. If either boundary resolves to `undefined` or `NaN`, the complete range is temporarily disabled. A failure is `{ kind: 'between', min, max, actual, message }`. Both boundaries contribute to `min()` and `max()` metadata.

## `integer`

Requires a JavaScript safe integer. It can be passed directly or called with message options:

```ts
const quantity = field(1.5, [integer]);

const attempts = field(1.5, [
  integer({ message: 'Enter a whole number.' }),
]);
```

It uses `Number.isSafeInteger()`, rejecting decimals, `NaN`, infinities, and integers outside JavaScript's exactly representable safe range. `null` passes. A failure is `{ kind: 'integer', actual, message }`.

## `minLength`

Requires a numeric `length` or `size` to meet a minimum:

```ts
const password = field('', [required, minLength(12)]);

const tags = array(field(''), {
  initialValue: [],
  validators: [minLength(() => minimumTags(), {
    message: 'Choose more tags.',
  })],
});
```

It supports strings, arrays, sets, maps, and other values with numeric `length` or `size`. `null` and `''` pass, but empty collections are measured normally. A reactive minimum returning `undefined` disables the constraint. A failure is `{ kind: 'minLength', minLength, actual, message }`. The resolved limit contributes to `minLength()` metadata.

## `maxLength`

Requires a numeric `length` or `size` not to exceed a maximum:

```ts
const biography = field('', [maxLength(500)]);

const tags = array(field(''), {
  initialValue: ['angular'],
  validators: [maxLength(10, { message: 'Choose at most 10 tags.' })],
});
```

It supports the same `length` and `size` values as `minLength`. `null` and `''` pass, while empty collections are measured normally. A reactive maximum returning `undefined` disables the constraint. A failure is `{ kind: 'maxLength', maxLength, actual, message }`. The resolved limit contributes to `maxLength()` metadata.

## `minWords`

Requires a non-empty string to contain at least a number of words:

```ts
const summary = field('', [required, minWords(3)]);

const description = field('', [
  minWords(() => minimumWords(), { message: 'Add more detail.' }),
]);
```

`null` and `''` pass. A reactive minimum returning `undefined` or `NaN` disables the constraint. A word is a Unicode letter-or-number sequence that may contain internal apostrophes or hyphens, so `L'été` and `well-known` each count as one word. A failure is `{ kind: 'minWords', minWords, actual, message }`, where `actual` is the observed word count.

## `maxWords`

Requires a non-empty string to contain no more than a number of words:

```ts
const biography = field('', [maxWords(100)]);

const description = field('', [
  maxWords(() => maximumWords(), { message: 'Keep it concise.' }),
]);
```

`null` and `''` pass. A reactive maximum returning `undefined` or `NaN` disables the constraint. It uses the same Unicode word definition as `minWords`. A failure is `{ kind: 'maxWords', maxWords, actual, message }`.

## `pattern`

Requires a non-empty string to match a regular expression:

```ts
const code = field('', [pattern(/^[A-Z]{3}-\d{4}$/)]);

const username = field('', [
  pattern(() => configuredPattern(), { message: 'Use letters only.' }),
]);
```

`null` and `''` pass. A reactive expression returning `undefined` disables the constraint. The expression's `lastIndex` is reset before every check, so global and sticky regular expressions do not reuse stale match state. A failure is `{ kind: 'pattern', pattern, actual, message }`. Every active expression appears in `pattern()` metadata.

## `email`

Validates Angular's standard email-address format. It can be passed directly or called with message options:

```ts
const emailAddress = field('', [required, email]);

const workEmail = field('', [
  email({ message: 'Enter a valid work email.' }),
]);
```

`null` and `''` pass. Use `required` when the address must be present. The format includes local-part, domain-label, and total-length restrictions. A failure is `{ kind: 'email', message }`; the rejected address is intentionally omitted from the error.

## `url`

Validates an absolute WHATWG URL. It can be passed directly or called with message options:

```ts
const website = field('', [required, url]);

const documentationUrl = field('', [
  url({ message: 'Enter a complete URL.' }),
]);
```

`null` and `''` pass. The validator uses `new URL(value)` without a base URL. It accepts absolute URLs with any valid scheme—including `https:`, `mailto:`, and custom schemes—but rejects relative references such as `/account`. A failure is `{ kind: 'url', message }`; the rejected URL is intentionally omitted.

## `minDate`

Requires a valid date on or after an inclusive minimum:

```ts
const appointment = field<Date>(null, [minDate('2026-08-24')]);

const localAppointment = field<Date>(null, [
  minDate('2026-08-24', {
    parseAs: 'local',
    message: 'Choose a later date.',
  }),
]);

const momentAppointment = field<Date>(null, [
  minDate(moment('2026-08-24').toDate()),
]);
```

The limit accepts a `Date`, an ISO calendar-date string (`YYYY-MM-DD`), or a reactive function returning either. Strings use UTC midnight by default; `parseAs: 'local'` selects local midnight. `null` and invalid current dates pass. An absent or invalid resolved limit disables the constraint. A failure is `{ kind: 'minDate', minDate, actual, message }`. The normalized `Date` contributes to `min()` metadata.

## `maxDate`

Requires a valid date on or before an inclusive maximum:

```ts
const appointment = field<Date>(null, [maxDate('2026-12-31')]);

const reactiveAppointment = field<Date>(null, [
  maxDate(() => bookingWindowEnd(), {
    parseAs: 'local',
    message: 'Choose an earlier date.',
  }),
]);

const momentAppointment = field<Date>(null, [
  maxDate(moment('2026-12-31').toDate()),
]);
```

It accepts the same limit representations and parsing modes as `minDate`. `null` and invalid current dates pass. An absent or invalid resolved limit disables the constraint. A failure is `{ kind: 'maxDate', maxDate, actual, message }`. The normalized `Date` contributes to `max()` metadata.

## `dateBetween`

Requires a valid date within an inclusive range:

```ts
const campaignDate = field<Date>(null, [
  dateBetween('2026-08-24', '2026-09-30'),
]);

const bookingDate = field<Date>(null, [
  dateBetween(
    () => bookingWindow().start,
    () => bookingWindow().end,
    {
      parseAs: 'local',
      message: 'Choose a date within the booking window.',
    },
  ),
]);
```

Both boundaries accept a `Date`, `YYYY-MM-DD`, or a reactive source. `parseAs` applies to both string limits. `null` and invalid current dates pass. If either limit is absent or invalid, the range and both metadata constraints are disabled together. A failure is `{ kind: 'dateBetween', minDate, maxDate, actual, message }`. The normalized boundaries contribute to `min()` and `max()` metadata.

## `oneOf`

Requires a non-empty value to equal one of the allowed values:

```ts
const status = field('draft', [oneOf(['draft', 'published'])]);

const reactiveStatus = field('draft', [
  oneOf(() => availableStatuses(), {
    message: 'Choose an available status.',
  }),
]);
```

`null`, `undefined`, and `''` pass. A reactive source returning `undefined` disables the constraint. Membership uses `Array.prototype.includes`: `NaN` matches `NaN`, while objects compare by reference. A failure is `{ kind: 'oneOf', options, actual, message }`.

## `equalTo`

Requires a value to equal a static or reactive expected value using `Object.is()`:

```ts
const termsAccepted = field(false, [
  equalTo(true, { message: 'You must accept the terms.' }),
]);

const password = field('');
const confirmation = field('', [
  equalTo(() => password(), { message: 'Passwords must match.' }),
]);
```

Unlike optional format validators, `null` and `undefined` are compared as real values rather than skipped. Signals read by the expected-value source are tracked. A failure is `{ kind: 'equalTo', message }`; both compared values are deliberately omitted so confirmation errors do not expose secrets.

## `uniqueItems`

Requires every array item—or a selected item key—to be unique. It supports direct use, an options factory, a property selector, and a selector function:

```ts
const roles = array(field(''), {
  initialValue: ['admin', 'admin'],
  validators: [uniqueItems],
});

const labelledRoles = array(field(''), {
  initialValue: ['admin', 'admin'],
  validators: [uniqueItems({ message: 'Roles must be unique.' })],
});

const explicitRoles = array(field(''), {
  initialValue: ['admin', 'admin'],
  validators: [uniqueItems()],
});

const contacts = array({
  email: field(''),
  name: field(''),
}, {
  initialValue: [
    { email: 'same@example.com', name: 'First' },
    { email: 'same@example.com', name: 'Second' },
  ],
  validators: [uniqueItems('email')],
});

const products = array(productTemplate, {
  initialValue: initialProducts,
  validators: [
    uniqueItems<Product>(product => `${tenantId()}:${product.sku}`),
  ],
});
```

Calling `uniqueItems()` without arguments is equivalent to direct `[uniqueItems]`. Without a selector, comparison uses SameValueZero like `Set`: `NaN` matches `NaN`, `0` matches `-0`, and objects compare by reference. Property and function selectors compare their derived keys; selector functions may read signals reactively.

`null` and `undefined` pass as empty arrays. Empty and one-item arrays pass. A failure is `{ kind: 'uniqueItems', duplicateIndexes, message }`. It belongs to the array node and reports every participating index in ascending order while deliberately omitting duplicate values.

## Constraint metadata

Built-in constraints expose state even when the current value is valid:

```ts
age.min();
age.max();
password.minLength();
password.maxLength();
code.pattern();
name.required();
```

Multiple minimum constraints expose the strictest, largest minimum; multiple maximum constraints expose the strictest, smallest maximum. `pattern()` contains every active expression. Conditionally composed validators contribute metadata only while their branch is active. `[formNode]` forwards applicable metadata to native and compatible custom controls.

## Tree shaking

Validators are independent, side-effect-free exports. Consumer bundlers can remove validators and default messages that an application does not import; every validator remains available in the published package itself.
