---
title: Errors and validation status
---

# Errors and validation status {#errors-and-validation-status}

Form Nodes separates errors owned by one node from errors aggregated across a subtree, and every exposed error identifies its target node.

## 🚨 Error shape and ownership {#error-shape-and-ownership}

A custom validator returns an error without assigning ownership:

```ts
({ value }) => value() === 'blocked'
  ? { kind: 'blocked', message: 'This value is unavailable.' }
  : null
```

When exposed, the runner adds `targetNode`:

```ts
const error = name.errors()[0];

error.kind; // 'blocked'
error.targetNode === name; // true
```

`targetNode` is the node whose validation owns the error. An aggregate validator can explicitly
target a descendant for a cross-field rule; otherwise the validated node is assigned automatically.
Binding-specific errors, such as a native parse failure, may additionally expose `formNode`, which
identifies the concrete rendered binding that produced it.

```ts
const confirmation = field('');
const myForm = form({
  password: field(''),
  confirmation,
}, {
  validators: ({ value }) => value().password === value().confirmation
    ? null
    : { kind: 'passwordMismatch', targetNode: confirmation },
});
```

## 🚨 Own versus descendant errors {#own-versus-descendant-errors}

```ts
profile.errors();
profile.allErrors();
```

- `errors()` contains only errors owned directly by the current node.
- `allErrors()` contains own errors followed by errors from the current subtree.
- A field has no descendants, so both contain the same node-owned errors.
- A form-level validator error remains owned by the form rather than being copied to children.

Use `errors()` to render a group-level rule and `allErrors()` for summaries or diagnostics.

## 💡 Typed lookup {#typed-lookup}

`getError(kind)` returns the first own error of that kind. Built-in kinds infer their complete payload:

```ts
const myForm = form({
  age: field(16, [min(18)]),
});
const error = myForm.age.getError('min');

error?.min; // number | undefined
error?.actual; // number | undefined
error?.message;
error?.targetNode;
```

Unknown custom kinds retain a permissive error shape. Reusable packages can augment `ValidationErrorMap` for precise custom lookup:

```ts
declare module '@ngblocks/form-nodes' {
  interface ValidationErrorMap {
    readonly unavailableUsername: ValidationError & {
      readonly kind: 'unavailableUsername';
      readonly suggestion: string;
    };
  }
}

username.getError('unavailableUsername')?.suggestion;
```

## ⚡ Status calculation {#status-calculation}

| Situation | `valid()` | `invalid()` | `pending()` | `validationStatus()` |
| --- | --- | --- | --- | --- |
| No errors or pending work | `true` | `false` | `false` | `'valid'` |
| At least one error | `false` | `true` | Maybe | `'invalid'` |
| Pending with no completed error | `false` | `false` | `true` | `'unknown'` |
| Disabled, readonly, or hidden | `true` | `false` | `false` | `'valid'` |

An aggregate is invalid when it has an own error or an interactive descendant is invalid. It is pending when it or an interactive descendant is pending, unless an available error already makes the status invalid.

## 🚨 Error ordering {#error-ordering}

Validators preserve declaration order. Async results become visible as they complete, but the exposed error array remains in validator order rather than completion order. Replacing validators, changing a `when` condition, disabling the node, or changing dependencies invalidates stale work.

## 🚨 Binding-filtered errors {#binding-filtered-errors}

A `FormNode` binding's `errors()` includes:

- Node errors that are not owned by one concrete control.
- Binding-owned errors whose `formNode` is that exact binding.

If two controls bind the same field, a parse error produced by one appears in the field's aggregate errors and that binding's errors, but not in the other binding's errors.

## 🚨 Suppressed errors {#suppressed-errors}

Disabled, readonly, and hidden nodes expose no own errors while non-interactive. The configured validators and stored state are retained, and validation resumes when the node becomes interactive again.

See [Async validation](./async-validation.md) for cancellation and pending behavior and [Validator messages](./validator-messages.md) for message precedence.
