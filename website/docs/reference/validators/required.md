---
title: required()
---

import CodeBlock from '@theme/CodeBlock';
import presenceSource from '!!raw-loader!../../../examples/presence-validation.example.ts';

# required() {#required}

## 🧭 API map {#api-map}

| I want to… | Details |
| --- | --- |
| See every accepted call style | [Signatures](#signatures) |
| See common and advanced usage | [Usage and behavior](#usage-and-behavior) |
| Compare presence validators | [required versus notNil](#required-vs-not-nil) |
| Customize messages | [Message configuration](#message-configuration) |
| Understand reactive constraints | [Reactive behavior](#reactive-behavior) |
| Return to the complete catalog | [Built-in validators](../built-in-validators.md) |

## 📐 Signatures {#signatures}

```ts
required
required(message)
required(options)
```

This validator has no configurable constraint value. Its options customize the failure message,
which may itself be reactive, and the reactive `when` condition.

## 📖 Usage and behavior {#usage-and-behavior}

Requires a value to be present. It can be passed directly or called with message options:

```ts
const myForm = form({
  name: field('', [required]),
  surname: field('', [required('Enter your surname.')]),
});
```

It rejects `null`, `undefined`, `''`, and `NaN`. It does **not** reject empty arrays, sets, maps, or objects. Use `minLength(1)` when a collection must contain an item:

```ts
const myForm = form({
  roles: field<string[]>([], [required, minLength(1)]),
});
```

A failure is `{ kind: 'required', message }`. The validator contributes `required() === true` metadata to its node.

### Boolean answers and acceptance

:::info Boolean behavior compared with Angular

Form Nodes `required` accepts both `true` and `false`. This matches **Angular Reactive Forms'
`Validators.required` for booleans**, but differs from **Angular Signal Forms' `required`**, which
rejects `false`.

Use [`requiredTrue`](./required-true.md) when the value must be exactly `true`, such as accepting
terms or giving consent. Use `required` for a yes/no question where either answer is valid.

This comparison is specific to booleans; the validators do not share every empty-value rule.
Verified against Angular **v22.1.6**: [Signal Forms emptiness](https://github.com/angular/angular/blob/v22.1.6/packages/forms/signals/src/api/rules/validation/util.ts)
and [Reactive Forms validators](https://github.com/angular/angular/blob/v22.1.6/packages/forms/src/validators.ts).

:::

Initialize a yes/no question with `field<boolean>(null, [required])`: `null` means unanswered,
and either boolean is valid. These validators do not narrow the field's TypeScript value type
after validation.

<CodeBlock language="ts" title="checkout-model.ts">{presenceSource}</CodeBlock>

A native checkbox receives the HTML `required` constraint only for `requiredTrue`, because
HTML requires a required checkbox to be checked. The node's logical `required()` flag remains
true for both validators. See [control binding](../../guides/control-binding.md#boolean-presence-and-acceptance).

### required versus notNil {#required-vs-not-nil}

Use `required` when an empty string or `NaN` should count as missing. Use
[`notNil`](./not-nil.md#not-nil-vs-required) when only `null` and `undefined` are forbidden:

| Value | `required` | `notNil` |
| --- | --- | --- |
| `null`, `undefined` | Invalid | Invalid |
| `''`, `NaN` | Invalid | Valid |
| `false`, `true`, `0` | Valid | Valid |
| Whitespace-only strings | Valid | Valid |
| Empty arrays, sets, maps, or objects | Valid | Valid |

An active `required` rule contributes `node.required() === true`; `notNil` contributes no
required metadata or native required constraint. This distinction still matters on boolean
fields, even though both rules accept either boolean. Failures use different error kinds and
message-catalog keys: `required` and `notNil`.

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
const requireCompanyName = signal(false);
const companyName = field('', [
  required({ when: () => requireCompanyName() })
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
