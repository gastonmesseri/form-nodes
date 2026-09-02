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

## API map

| I want to… | Start with | Details |
| --- | --- | --- |
| Decide whether a value should be one field | `field<T>()` | [Arrays and objects](#fields-can-hold-arrays-and-objects) |
| Create a nullable or non-nullable field | `field(...)`, `{ nullable }` | [Signatures](#signatures) and [nullability](#nullability) |
| Configure validation, debounce, or state | `FieldOptions` | [Options](#options) |
| Read value, parent, or path | `myField()`, `parent()`, `path()` | [Value and tree properties](#value-and-tree-properties) |
| Change or reset its value | `set()`, `update()`, `reset()` | [Value and control methods](#value-and-control-methods) |
| Inspect errors or constraints | `errors()`, `getError()`, `required()`, `min()` | [Validation](#validation-properties-and-methods) and [constraint metadata](#constraint-metadata) |
| Manage touched, dirty, or availability | State signals and marker methods | [Interaction](#interaction-properties-and-methods) and [availability](#availability-properties-and-methods) |
| Connect it to an Angular control | `FormNode`, `[formNode]` | [Binding in Angular](#binding-in-angular) |

## Fields can hold arrays and objects

`field()` means “one leaf node,” not “one scalar.” A field can hold an array when the complete
array is edited as one value—for example, by a native multi-select or a multi-select component:

```ts
const myForm = form({
  selectedRoles: field<string[]>([]),
});
```

```html
<select multiple [formNode]="myForm.selectedRoles">
  <option value="admin">Administrator</option>
  <option value="editor">Editor</option>
  <option value="viewer">Viewer</option>
</select>
```

This field has one validation and interaction state for the complete `string[]`. Use `array()` only
when items need independent nodes, bindings, errors, paths, or structural operations. See
[Array field or `array()`](../guides/choosing-a-primitive.md#array-field-or-array) for a complete
comparison.

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

When the literal initial value is `null`, there is no non-null value from which TypeScript can infer
a future type. Gem Forms uses `unknown`, rather than the unsafe `any`:

```ts
const myForm = form({
  unspecified: field(null),         // Field<unknown>
  nickname: field<string>(null),    // Field<string | null>
});

myForm.unspecified.set('Marco');
myForm.unspecified.set(42);
```

Use an explicit generic when the domain type is known. Although `Field<unknown>` accepts `null`,
TypeScript displays it as `unknown` because `unknown | null` simplifies to `unknown`; reads must be
narrowed before use and therefore do not acquire `any`-like behavior.

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
| `injector` | Angular `Injector` | Provides this node's preferred lifecycle owner |
| `inheritInjector` | `boolean` | Uses the nearest ancestor injector when no own injector exists; defaults to `true` |
| `debounce` | number, `'blur'`, or asynchronous function | Delays control-originated commits |
| `disabled` | boolean, string, or reactive function | Disables the field |
| `readonly` | boolean or reactive function | Makes the field readonly |
| `hidden` | boolean or reactive function | Hides the field |

Start with a single built-in validator, then use an array when the field needs several rules:

```ts
const myForm = form({
  displayName: field('', [required]),
  username: field('', [required, minLength(3)]),
});
```

The same array can contain configured built-ins, custom callbacks, and `asyncValidator()` results.
See [Validation](../guides/validation.md) for the progressively more advanced forms.

State and debounce options inherit from ancestors. A local option can add a state cause or override
the inherited debounce.

## Instance shape

A field node is both a callable value reader and an object with reactive signals and operations:

| Member | Description |
| --- | --- |
| `myField()` | Returns the current committed value. This is the preferred value read. |
| `api` | Exposes the complete field API. Direct members such as `myField.set()` are preferred in application code. |
| `$api` | Collision-safe alias of `api`, shared by every node kind. Prefer `api` normally. |

Unlike a form, a field has no named children, so its direct API members cannot collide with child
names.

## Value and tree properties

Every property in this section is a reactive signal and must be called to read its current value.

| Property | Description |
| --- | --- |
| `value()` | Current committed value. Equivalent to calling the field, but the callable form is preferred. |
| `controlValue()` | Immediate value most recently received from a bound control. It can differ from the committed value during debounce. |
| `form()` | Root form that owns the field, or `null` for a standalone field. |
| `parent()` | Direct parent node, or `null` for a standalone field. |
| `path()` | Reactive property path from the root. Array indexes appear as string segments. |
| `keyInParent()` | Property name or array index under which this field is stored, or `null` when standalone. |

```ts
myForm.name();            // ''
myForm.name.parent();     // myForm
myForm.name.form();       // myForm
myForm.name.path();       // ['name']
myForm.name.keyInParent(); // 'name'
```

## Value and control methods

| Method | Description |
| --- | --- |
| `set(value)` | Immediately assigns both the committed value and `controlValue()`. It cancels pending debounce. |
| `update(updater)` | Passes the current committed value to `updater`, then assigns its result immediately. |
| `setControlValue(value)` | Handles a control-originated value, marks the field dirty, and applies the configured debounce before committing it. Bindings normally call this for you. |
| `reset()` | Keeps the current value, cancels pending debounce, and clears touched and dirty state. |
| `reset(value)` | Assigns `value`, cancels pending debounce, and clears touched and dirty state. |
| `debouncing()` | Whether a control-originated value is waiting for its debounce strategy to complete. |
| `flush()` | Immediately commits a pending `controlValue()` and ends its debounce. It has no observable effect when nothing is pending. |
| `focus(options?)` | Focuses the first `[formNode]` control bound to this field in DOM order. Accepts standard `FocusOptions`; it does nothing without a binding. |

`api.patch(value)` also exists so aggregate nodes can patch children through a uniform API. For a
field it is equivalent to `set(value)`; application code should use `set()` directly.

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

## Validation properties and methods

| Member | Description |
| --- | --- |
| `validators()` | Current normalized validator collection. |
| `setValidators(source)` | Replaces the validator source and re-evaluates validation. The source can be static or reactive. |
| `errors()` | Current validation errors owned by this field. |
| `allErrors()` | The same errors as `errors()` because a field has no descendants. |
| `getError(kind)` | Returns the first error with `kind`, or `undefined`. Known built-in kinds retain their inferred error type. |
| `valid()` | Whether the field is currently valid. |
| `invalid()` | Whether the field is currently invalid. |
| `pending()` | Whether asynchronous validation is currently pending. |
| `validationStatus()` | Current status: `'valid'`, `'invalid'`, or `'unknown'` while validation is pending without an existing error. |
| `required()` | Whether an active validator marks the field as required. |

### Constraint metadata

Built-in validators expose reactive metadata used by `[formNode]` to synchronize native control
constraints:

| Property | Description |
| --- | --- |
| `min()` | Strictest minimum contributed by active numeric or date validators, or `null`. |
| `max()` | Strictest maximum contributed by active numeric or date validators, or `null`. |
| `minLength()` | Strictest minimum length contributed by active validators, or `null`. |
| `maxLength()` | Strictest maximum length contributed by active validators, or `null`. |
| `pattern()` | Every regular expression contributed by active pattern validators. |

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

## Interaction properties and methods

| Member | Description |
| --- | --- |
| `touched()` | Whether the field has been touched and is currently interactive. |
| `untouched()` | Inverse of `touched()`. |
| `markAsTouched()` | Marks the field touched and commits a pending control value. It is ignored while non-interactive. |
| `markAsUntouched()` | Clears stored touched state. |
| `dirty()` | Whether a control-originated value has made the field dirty and it is currently interactive. |
| `pristine()` | Inverse of `dirty()`. |
| `markAsDirty()` | Marks the field's stored state as dirty. |
| `markAsPristine()` | Clears stored dirty state without changing the value. |

Programmatic `set()` and `update()` do not mark a field dirty. `setControlValue()` does.

## Availability properties and methods

| Member | Description |
| --- | --- |
| `disabled()` | Whether the field is disabled by its own state, configuration, or an ancestor. |
| `disabledReasons()` | Active local and inherited disabled causes, including source nodes and optional messages. |
| `enabled()` | Inverse of `disabled()`. |
| `disable(message?)` | Disables the field and optionally records a user-facing reason. |
| `enable()` | Removes the imperative disabled state; configured or inherited causes can keep it disabled. |
| `readonly()` | Whether the field is readonly through its own state, configuration, or an ancestor. |
| `writable()` | Inverse of `readonly()`. |
| `markAsReadonly()` | Marks the field as readonly. |
| `markAsWritable()` | Removes the imperative readonly state; other causes can keep it readonly. |
| `hidden()` | Whether the field is hidden through its own state, configuration, or an ancestor. |
| `visible()` | Inverse of `hidden()`. |
| `hide()` | Hides the field. |
| `show()` | Removes the imperative hidden state; other causes can keep it hidden. |
| `submitting()` | Whether an ancestor form is currently running its submission action. |

```ts
myForm.name.markAsTouched();
myForm.name.markAsDirty();
myForm.name.disable('Editing is unavailable');
myForm.name.markAsReadonly();
myForm.name.hide();
```

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
