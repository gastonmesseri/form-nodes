---
title: Troubleshooting
description: Diagnose common Gem Forms symptoms and apply concrete fixes.
---

# Troubleshooting

Start with the symptom you can observe. Each solution links to the guide that explains the
underlying behavior in more detail.

## Angular does not recognize [formNode]

**Symptom:** Angular reports that it cannot bind to `formNode`, or the directive does not run.

**Solution:** import `FormNode` in every standalone component that uses `[formNode]`, or export it
from an NgModule imported by that component. The same import supports controls and native form
roots:

```ts
@Component({
  imports: [FormNode],
  template: `
    <form [formNode]="myForm">
      <input [formNode]="myForm.email" />
    </form>
  `,
})
export class AccountEditor {}
```

No separate root-form directive is required. See [Control binding](../guides/control-binding.md).

## A [formNode] host is rejected

**Symptom:** development fails with `formNode: the host must be a native form control, provide a
signal custom control, or provide ControlValueAccessor`.

**Solution:** bind fields directly to `input`, `select`, or `textarea`, or give the custom component
one supported Angular contract:

- `value = model(...)` or `checked = model(...)`.
- A matching `value`/`valueChange` or `checked`/`checkedChange` pair.
- `ControlValueAccessor` registered through `NG_VALUE_ACCESSOR`.
- An automatically discovered signal-control component.

See [Custom controls](../guides/custom-controls.md) for the supported shapes and precedence.

## The node value has not changed after typing

**Symptom:** the control displays the latest text, but calling the node still returns its previous
value.

**Cause:** the node has a numeric or `'blur'` debounce. The control representation changes
immediately, while the committed model waits:

```ts
myForm.search.controlValue(); // 'angular'
myForm.search();              // previous committed value
myForm.search.debouncing();   // true
```

**Solution:** normally, wait for the configured commit. Call `myForm.search.flush()` when an
explicit action must commit immediately. Blur, touch, and form submission also commit pending
control values. See [Value flow and debounce](../guides/value-flow-and-debounce.md).

## A form is invalid but errors() is empty

**Symptom:** `myForm.invalid()` is `true`, but `myForm.errors()` returns `[]`.

**Solution:** `errors()` contains only rules owned by that exact node. Use `allErrors()` for a form
summary that includes descendants:

```ts
myForm.errors();    // Form-level errors only.
myForm.allErrors(); // Form-level and descendant errors.
```

See [Own versus descendant errors](../guides/errors-and-status.md#own-versus-descendant-errors).

## A required array is still valid when empty

**Symptom:** `required` does not reject `[]`.

**Cause:** `required` treats an array as a present value; it does not validate its item count.

**Solution:** use `minLength(1)` when at least one item is required:

```ts
const myForm = form({
  selectedTags: field<string[]>([], [minLength(1)]),
});
```

See [`required`](../reference/built-in-validators.md#required) and
[`minLength`](../reference/built-in-validators.md#minlength).

## An asynchronous validator does not react as expected

**Symptom:** changing a related signal does not rerun validation, or returning a newly allocated
parameter object starts work more often than expected.

**Solution:** read reactive dependencies inside `params`, `when`, or the validator callback. A
`params` result is compared shallowly: primitive entries and stable references avoid redundant
runs, while a changed top-level entry schedules new validation.

```ts
asyncValidator(checkAvailability, {
  params: () => ({
    tenantId: activeTenantId(),
    locale: activeLocale(),
  }),
});
```

Gem Forms cancels stale work when dependencies or values change. See
[`asyncValidator()` parameters](../reference/async-validator.md#explicit-parameters).

## Array rows keep the wrong touched or pending state

**Symptom:** after replacing or reordering server data, interaction state appears attached to the
wrong row.

**Solution:** configure a stable `trackBy` key or function so reconciliation follows domain
identity rather than position:

```ts
const people = array({
  id: field(''),
  displayName: field(''),
}, {
  initialValue: initialPeople,
  trackBy: 'id',
});
```

In an Angular `@for`, track the node instance: `@for (person of people; track person)`. See
[Complete reconciliation](../guides/dynamic-arrays.md#complete-reconciliation).

## set(null) on an array does not leave a null value

**Symptom:** calling `myArray.set(null)` produces `[]`.

**Cause:** `array()` is a permanent structural container. `null` and `undefined` deliberately clear
its items instead of making the node nullable.

**Solution:** use `field<Item[]>()` if the complete array is one nullable value owned by a single
control. Use `array()` when each item needs its own node and state. See
[Array field or `array()`](../guides/choosing-a-primitive.md#array-field-or-array).

## Calling reset() did not restore the original value

**Symptom:** interaction state clears, but the current value remains.

**Cause:** parameterless `reset()` retains committed values and clears touched, dirty, and pending
control state.

**Solution:** pass the value to restore:

```ts
myForm.reset({
  displayName: '',
  email: '',
});
```

See [Reset](../concepts/values-and-state.md#reset).

## enable() does not make a node enabled

**Symptom:** the node remains disabled after calling `enable()`.

**Cause:** an ancestor or reactive option still contributes another disabled reason. `enable()`
removes only the local imperative reason created by `disable()`.

**Solution:** inspect `disabledReasons()` and remove or change the active source. The same layered
model applies to readonly and hidden state. See
[Interaction and availability](../guides/interaction-and-availability.md).

## Native form submission does not run the action

Check these conditions:

1. The native form has `[formNode]="myForm"` and the component imports `FormNode`.
2. The node was created with `form()`, not `group()`, and has a `submission.action`. A group binding
   remains functional but intentionally has no action to run.
3. The submit button has `type="submit"`.
4. Validation is not blocking submission. Submission marks the tree touched and resolves to
   `false` when invalid.
5. Another action is not already running; overlapping submissions resolve to `false`.

```ts
myForm = form({
  email: field('', [required, email]),
}, {
  submission: {
    action: (_form, value) => saveAccount(value),
  },
});
```

See [Form submission](../guides/submission.md).

## A custom validator message is not the one expected

Message catalogs use nearest-wins precedence:

1. Validator-local `message`.
2. Closest form or array `validatorMessages` catalog.
3. Closest `createFormPrimitives()` validator-message default.
4. Closest `provideValidatorMessages()` provider.
5. `configureGlobalValidatorMessages()`.
6. Built-in English message.

Check the higher-priority scopes before changing a global catalog. See
[Validator messages and internationalization](../guides/validator-messages.md).

## Still investigating?

Reduce the case to one node and inspect its callable value, `controlValue()`, `validationStatus()`,
`errors()`, `allErrors()`, `disabledReasons()`, `touched()`, and `dirty()` as applicable. The
[API overview](../reference/api-overview.md) maps each concern to its detailed reference, while
[Common mistakes](./common-mistakes.md) covers modeling choices that can look like runtime bugs.
When reproducing a problem, use the public-API patterns in [Testing forms](../guides/testing.md).
