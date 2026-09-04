---
title: createFormPrimitives()
description: Create form primitives with shared application defaults.
---

import CodeBlock from '@theme/CodeBlock';

import createFormPrimitivesSource from '!!raw-loader!../../examples/create-form-primitives.typecheck.ts';

# `createFormPrimitives()`

`createFormPrimitives()` creates an isolated set of `form`, `field`, `group`, and `array` factories
with shared defaults. Use it to establish field nullability, translated validator messages, and
injector inheritance policies once for an application or feature.

The package-level factories remain nullable by default. Creating a configured set does not change
them or any other configured set.

## Signature

```ts
createFormPrimitives();
createFormPrimitives(options?);
```

The options object and every property are optional. Omitting `nullable` uses `true`; omitting either
injector policy preserves its normal `true` default:

```ts
const defaultForms = createFormPrimitives();
const explicitDefaultForms = createFormPrimitives({});

defaultForms.field('');         // Field<string | null>
explicitDefaultForms.field(''); // Field<string | null>
```

## Create non-nullable factories

<CodeBlock language="ts" title="create-form-primitives.typecheck.ts">{createFormPrimitivesSource}</CodeBlock>

Here, `field('')` and the `city: ''` shorthand both produce `Field<string>`. A local
`field.nullable('')` declaration still produces `Field<string | null>`.

## Configure validator messages

Pass a partial static or reactive catalog to localize built-in validator messages for every node
created by the configured factories:

```ts
const { form, field } = createFormPrimitives({
  validatorMessages: () => ({
    required: translate('validation.required'),
    minLength: ({ minLength }) => translate('validation.minLength', { minLength }),
  }),
});

const profile = form({
  username: field('', [required]),
}, {});
```

A validator's own `message` has highest priority. An explicit `validatorMessages` catalog on a
form, group, or array overrides the configured default for that subtree. The configured catalog is
then considered before Angular provider and process-wide catalogs.

## Configure injector policies

`inheritInjector` and `adoptBindingInjector` can also be defaulted for every created node:

```ts
const isolatedForms = createFormPrimitives({
  inheritInjector: false,
  adoptBindingInjector: false,
});
```

These options are useful for deliberate ownership boundaries. Their defaults remain `true`, and a
node-level option overrides the configured value. `injector` is intentionally not a factory
default: assigning it to every node would turn inherited ownership into explicit ownership. Pass
an injector to the relevant root or boundary node instead.

## Precedence

An explicit field method takes precedence over the shared default:

```ts
const { field } = createFormPrimitives({ nullable: false });

field('');                            // Field<string>
field.strict('');                     // Field<string>
field.nullable('');                   // Field<string | null>
```

`field.nullable()` and `field.strict()` always override the configured default, so local
exceptions remain concise in either direction.

Passing `null` or `undefined` still creates a nullable field because there is no non-null initial
value to preserve:

```ts
const { field } = createFormPrimitives({ nullable: false });

field(null);      // Field<unknown>
field(undefined); // Field<unknown>
```

Provide the future type and opt into nullability when it is known:

```ts
const nickname = field.nullable<string>();

nickname(); // null
```

## Shorthands and dynamic nodes

The default applies throughout definitions created by the configured factories. This includes
nested object shorthands, children added later with `add()`, and current or future items created by
an array template or factory.

An explicitly created node keeps the policy of the factory that created it:

```ts
const nullableForms = createFormPrimitives({ nullable: true });
const nonNullableForms = createFormPrimitives({ nullable: false });
const nullableField = nullableForms.field('');

const profile = nonNullableForms.form({
  displayName: nullableField,
}, {});
```

The configured `form()` attaches that existing node without changing its value type.

## Application entry point

Applications can expose one configured entry point so declarations share the same policy:

```ts title="src/app/forms.ts"
import { createFormPrimitives } from '@gem/ng-forms';

export const {
  form,
  field,
  group,
  array,
} = createFormPrimitives({
  nullable: false,
});
```

Import those factories from the application module when declaring forms.

## Related references

- [`field()`](./field.md)
- [`form()`](./form.md)
- [`array()`](./array.md)
- [Configuration](./configuration.md)
