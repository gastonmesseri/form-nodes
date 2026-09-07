---
title: Interaction and availability
---

# Interaction and availability {#interaction-and-availability}

Touched and dirty describe user interaction. Disabled, readonly, and hidden determine whether a node currently participates as an interactive part of the form.

## 👆 Touched state {#touched-state}

Nodes start untouched. Value changes do not imply touch.

- `markAsTouched()` marks an interactive field touched.
- Any touched interactive descendant makes its ancestor forms and arrays touched.
- Calling `markAsTouched()` on an aggregate marks that node and every interactive descendant.
- `{ skipDescendants: true }` marks only the aggregate itself.
- `markAsUntouched()` clears only the node's own stored touch; touched descendants may keep aggregate state touched.
- `reset()` is the recursive operation that clears touch throughout a subtree.

```ts
profile.markAsTouched({ skipDescendants: true });
profile.name.touched(); // false
profile.touched(); // true
```

## 👆 Dirty state {#dirty-state}

Nodes start pristine. Programmatic `set()`, `update()`, and `patch()` preserve dirty state; a control-originated update marks its directly bound node dirty immediately.

- Any dirty interactive descendant makes ancestors dirty.
- `markAsDirty()` and `markAsPristine()` affect only the node's own stored state.
- A dirty descendant can keep a form dirty after `form.markAsPristine()`.
- `reset()` recursively clears dirty state.
- Validation changes never mark a node dirty.

Touched, dirty, and validity are independent dimensions.

## ⚙️ Configured state sources {#configured-state-sources}

Readonly and hidden accept a boolean or reactive function. Disabled additionally accepts a reason string:

```ts
const profile = form({
  name: field('', {
    disabled: () => account().locked ? 'The account is locked' : false,
    readonly: () => !permissions().canEdit,
    hidden: () => !featureFlags().profile,
  }),
});
```

A normal function may read signals directly; no extra `computed()` is needed.

Effective state is the union of three independent causes:

1. Mutable local state controlled by actions.
2. A configured reactive condition.
3. Inherited parent state.

`enable()`, `markAsWritable()`, and `show()` clear mutable local state but cannot override an active configured or inherited condition.

## ⚡ State propagation {#state-propagation}

Disabled, readonly, and hidden propagate downward, never upward:

- A parent state affects every descendant.
- A child's own cause is preserved while an ancestor imposes the same state.
- Clearing the parent reveals any child cause that remains active.
- Changing a nested aggregate affects only its subtree, siblings excluded.
- A parent does not become disabled, readonly, or hidden merely because every child is.

## 🎛️ Disabled reasons {#disabled-reasons}

`disabledReasons()` identifies every cause in outermost-to-innermost order:

```ts
profile.disable('Editing is temporarily unavailable');

profile.name.disabledReasons();
// [{ sourceNode: profile, message: 'Editing is temporarily unavailable' }, ...]
```

Each reason retains the node where it originated. Multiple local causes remain distinct. Calling `disable()` again replaces the prior imperative reason; `enable()` removes only that imperative reason.

## 🎛️ Non-interactive behavior {#non-interactive-behavior}

A node is non-interactive while hidden, disabled, or readonly. During that time:

- Its validators are skipped, own errors are hidden, and it is considered valid.
- Async work is cancelled or made stale and public `pending()` becomes false.
- Its invalid, touched, dirty, and pending state does not affect ancestors.
- Public touched and dirty signals report false.
- `markAsTouched()` is ignored.
- Values remain readable and programmatically writable.
- Validators and stored interaction flags are retained.

When the node becomes interactive again, validation runs against its current value and previously stored touched or dirty state becomes observable again.

Hidden state does not manipulate the DOM. Use `@if` to remove hidden UI controls.

See [Advanced behavior and edge cases](../advanced/behavior-details.md#stored-state-while-non-interactive)
for retained state, async cancellation, and what becomes observable after interaction is restored.
