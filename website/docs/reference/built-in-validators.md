---
title: Built-in validators
---

# Built-in validators

Built-in validators ignore empty values unless the rule is specifically about emptiness. Combine them with `required` when a value must be present.

`required` treats `null`, `undefined`, and the empty string as missing. It intentionally does not reject an empty array; use `minLength(1)` when a collection must contain at least one item.

All validators support a local `message` option. Constraints may be static values or reactive source functions where applicable.

| Validator | Purpose | Error kind |
| --- | --- | --- |
| `required` | Rejects nullish values and empty strings | `required` |
| `min(value)` | Requires a minimum number | `min` |
| `max(value)` | Requires a maximum number | `max` |
| `between(min, max)` | Requires an inclusive numeric range | `between` |
| `integer` | Requires an integer | `integer` |
| `minLength(value)` | Requires minimum string, array, set, or map size | `minLength` |
| `maxLength(value)` | Requires maximum string, array, set, or map size | `maxLength` |
| `minWords(value)` | Requires a minimum word count | `minWords` |
| `maxWords(value)` | Requires a maximum word count | `maxWords` |
| `pattern(expression)` | Requires a string to match a `RegExp` | `pattern` |
| `email` | Validates an email address | `email` |
| `url` | Validates a URL | `url` |
| `minDate(value)` | Requires a date on or after a limit | `minDate` |
| `maxDate(value)` | Requires a date on or before a limit | `maxDate` |
| `dateBetween(min, max)` | Requires an inclusive date range | `dateBetween` |
| `oneOf(values)` | Requires one of a collection of values | `oneOf` |
| `equalTo(value)` | Requires equality with a static or reactive value | `equalTo` |
| `uniqueItems` | Rejects duplicate array items | `uniqueItems` |

## Direct and configured forms

Validators without a required constraint can be used directly or configured with options:

```ts
field('', [required, email]);
field('', [required({ message: 'Enter your email.' }), email({ message: 'Invalid email.' })]);
field<number[]>([], [uniqueItems]);
field<Product[]>([], [uniqueItems<Product>(item => item.id)]);
```

## Numeric and length constraints

```ts
const age = field<number>(null, [min(18), max(120), integer]);
const score = field<number>(null, [between(0, 100)]);
const password = field('', [minLength(12), maxLength(128)]);
const biography = field('', [minWords(10), maxWords(500)]);
```

Numeric constraints expose `min()` and `max()` metadata. Length constraints expose `minLength()` and `maxLength()`.

## Patterns and choices

```ts
const code = field('', [pattern(/^[A-Z]{3}-\d{4}$/)]);
const role = field<'admin' | 'member'>('member', [oneOf(['admin', 'member'])]);
```

## Date constraints

Date constraints accept `Date`, date-like objects exposing `toDate()`, ISO-style date strings such as `'2026-08-24'`, and reactive sources. String parsing options control local or UTC interpretation.

```ts
const appointment = field<Date>(null, [
  minDate('2026-08-24'),
  maxDate(() => bookingWindow().endsAt),
]);

const campaign = field<Date>(null, [
  dateBetween('2026-08-24', '2026-09-30'),
]);

minDate(moment().toDate());
```

## Cross-value and collection constraints

```ts
const password = field('', { nullable: false });
const confirmation = field('', [equalTo(() => password())], { nullable: false });

const products = field<Product[]>([], [
  uniqueItems<Product>(product => product.id),
]);
```

`uniqueItems` accepts nullish values safely and reports duplicate indexes. It can compare item identity directly or derive a comparison key.

Only imported validators are included in a consumer's final bundle when the application bundler performs tree shaking.
