---
title: field()
---

# `field()`

`field()` creates a leaf node for a scalar, object, date, or any other application value. Fields
normally live inside a `form()` so their parent, path, validation, and state participate in a tree.

Not sure whether a structured value should be a field or child nodes? See
[Choosing a primitive](../guides/choosing-a-primitive.md).

```ts
import { field, form, required } from '@gem/ng-forms';

const myForm = form({
  name: field('', [required]),
  age: field<number>(),
});
```

## Signatures

```ts
field();
field(initialValue);
field(initialValue, options);
field(initialValue, validators, options?);
```

A field with no initial value starts at `null`.

## Nullability

Fields are nullable by default. The initial value still determines the non-null part of the type:

```ts
const myForm = form({
  name: field(''),        // Field<string | null>
  age: field<number>(),   // Field<number | null>
});

myForm.name.set(null);
```

Set `nullable: false` only when `null` is not a valid business value:

```ts
const myForm = form({
  countryCode: field('CH', { nullable: false }),
});

// myForm.countryCode.set(null); // TypeScript error
```

## Options

| Option | Accepted value | Purpose |
| --- | --- | --- |
| `validators` | validator, validator array, or reactive source | Validates the field value |
| `nullable` | boolean | Includes or excludes `null` from the public value type |
| `injector` | Angular `Injector` | Owns asynchronous validation cleanup |
| `debounce` | number, `'blur'`, or asynchronous function | Delays control-originated commits |
| `disabled` | boolean, string, or reactive function | Disables the field |
| `readonly` | boolean or reactive function | Makes the field readonly |
| `hidden` | boolean or reactive function | Hides the field |

State and debounce options inherit from ancestors. A local option can add a state cause or override
the inherited debounce.

## Reading and writing

```ts
myForm.name(); // ''

myForm.name.set('Ada');
myForm.name.update(value => value?.trim() ?? null);
myForm.name.reset();
myForm.name.reset('Grace');
```

Programmatic `set()` and `update()` do not mark a field dirty. `reset()` clears touched and dirty
state; with no argument, it keeps the current value.

`controlValue()` is the immediate value received from a bound control. It can temporarily differ
from the node's committed value while debounce is active. `flush()` commits it immediately.

```ts
const myForm = form({
  query: field('', { debounce: 300 }),
});

myForm.query.controlValue(); // ''
myForm.query.debouncing();
myForm.query.flush();
```

## Validation and constraints

```ts
const myForm = form({
  username: field('', [required]),
});

myForm.username.validators();
myForm.username.errors();
myForm.username.getError('required');
myForm.username.valid();
myForm.username.pending();
myForm.username.validationStatus(); // 'valid' | 'invalid' | 'unknown'
```

Fields have no descendants, so `errors()` and `allErrors()` contain the same failures. Built-in
validators also contribute native-control metadata through `required()`, `min()`, `max()`,
`minLength()`, `maxLength()`, and `pattern()`.

Use `setValidators(source)` to replace the current validator collection. See the
[built-in validator reference](./built-in-validators.md) for every signature and error shape.

## Interaction and availability

```ts
myForm.name.markAsTouched();
myForm.name.markAsDirty();
myForm.name.disable('Editing is unavailable');
myForm.name.markAsReadonly();
myForm.name.hide();
```

The paired signals are `touched()` / `untouched()`, `dirty()` / `pristine()`, `disabled()` /
`enabled()`, `readonly()` / `writable()`, and `hidden()` / `visible()`. `disabledReasons()` exposes
both inherited and local causes.

## Binding in Angular

```ts
import { Component } from '@angular/core';

import { field, form, FormNode } from '@gem/ng-forms';

@Component({
  selector: 'app-profile-editor',
  imports: [FormNode],
  template: `<input [formNode]="myForm.name" />`,
})
export class ProfileEditor {
  myForm = form({
    name: field(''),
  });
}
```

The binding synchronizes values, interaction state, validation constraints, accessibility state,
and debounce. See [Control binding](../guides/control-binding.md) and the
[shared Node API](./node-api.md).
