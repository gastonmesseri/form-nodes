---
title: Form nodes
---

# Form nodes {#form-nodes}

import CodeBlock from '@theme/CodeBlock';
import WritableSignalInteropExample from '!!raw-loader!../../examples/writable-signal-interop.example.ts';
import SignalInteropExample from '!!raw-loader!../../examples/signal-interop.example.ts';

Use [`isFormNode(value)`](../reference/node-api.md#is-form-node) to check whether an unknown value
is a field, form, group, or array node. The helper narrows the value to the shared [`AnyNode`](../reference/types/any-node.md) type.

Form Nodes represents every part of a form as a node:

- [`field()`](../reference/field.md) creates a leaf value.
- [`form()`](../reference/form.md) combines named child nodes into an object value.
- [`array()`](../reference/array.md) manages an ordered collection of repeated node definitions.

## 🔌 Use nodes with Angular signal utilities {#use-nodes-with-angular-signal-utilities}

Every field, form, group, and array is an Angular `Signal<T>` of its exposed committed value.
Pass a node directly to a utility that accepts `Signal<T>`; `isSignal(node)` also returns `true`.
Nullable fields retain their nullable value type, so `field('Marco')` is a `Signal<string | null>`.

<CodeBlock language="ts">{SignalInteropExample}</CodeBlock>

This also works with an effect-based utility such as `delaySignal(source: Signal<T>, wait?: number)`.
The utility still needs the injection context or injector required by Angular `effect()`.
Creating and reading the node itself does not require an injection context.

Consumers observe committed values and configured equality. Pending control input becomes visible
when committed, for example by `flush()`. Use `node.value.control` when a utility should observe
pending input instead. Nodes also support writable utilities as described below.


## Writable signal utilities {#writable-signal-utilities}

Fields, arrays, and forms/groups without colliding child names can be passed directly to utilities
accepting Angular's `WritableSignal<T>`. Reads, `set()`, and `update()` use the node's existing value
and writing behavior: validation and parent propagation still run, programmatic writes cancel
pending input, and they do not mark the form dirty or touched. No adapter or synchronized copy is
needed. `.$api` supports the same contract without child-name collisions.

<CodeBlock language="ts" title="writable-signal-interop.example.ts">{WritableSignalInteropExample}</CodeBlock>

The utility's value type must match the node. `field(18)` accepts `null`, so it matches
`WritableSignal<number | null>`; use `field.strict(18)` for `WritableSignal<number>`.
For forms and groups with children named `set`, `update`, or `asReadonly`, pass `node.$api`.
Broad `AnyNode`, `FormNode`, and `GroupNode` annotations also use `.$api` because their child names
are unknown. Concrete inferred types retain direct access when there is no collision.
Aggregate setters accept more than their read value type (for example, `array.set(null)` clears
an array). A generic utility that infers its type from writes can therefore infer a wider type.
When needed, pass the read type explicitly, such as `utility<ReturnType<typeof profile>>(profile)`,
or annotate the argument as `WritableSignal<ReturnType<typeof profile>>`.

### Readonly value views {#asreadonly}

`node.asReadonly()` returns a stable, live `Signal<T>` of the exposed value. The node and its
`.$api.asReadonly()` return the same signal. It has no `set()`, `update()`, child nodes, or form
operations. Calling it tracks dependencies and respects configured equality and pending debounce.
The method can be extracted without binding a receiver and works outside an injection context.

This method does not set the form's readonly state: use `markAsReadonly()` for that. As with
Angular signals, a readonly view does not freeze or clone object values. Existing node semantics,
including array reconciliation and equality, continue to apply; writable compatibility does not
turn aggregate values into an unrelated signal store.

## ⚡ Think of a field as a signal with form features {#think-of-a-field-as-a-signal-with-form-features}

Conceptually, `field()` starts from the same value-access pattern as a normal writable Angular
`signal()`: call it to read its current value, and use `set()` or `update()` to change that value.

```ts
const angularName = signal('Marco');

angularName(); // 'Marco'
angularName.set('David');

const formName = field('Marco');

formName(); // 'Marco'
formName.set('David');
formName.update(name => name.toUpperCase());
```

The difference is that a field is also a form node. In addition to signal-style value access, it
provides validation, errors, touched and dirty state, disabled/readonly/hidden state, reset,
debounce, focus, tree navigation, and Angular control binding. A normal `signal()` that stores the
same value does not provide those form behaviors.

This mental model also applies to `form()`, [`group()`](../reference/group.md), and `array()`: each primitive is callable to
read its aggregate committed value and exposes `set()` and `update()`, while adding the structural
and state behavior appropriate to that node kind.

**Calling the node itself is the preferred way to read its committed value.**

```ts
const myForm = form({
  name: field('Marco'),
});

myForm.name(); // 'Marco'
myForm.name.set('David');
myForm.name.touched();
myForm.name.markAsTouched();
```

`value.control()` has different semantics and represents an immediate value buffered from a bound
UI control before debounce completes. The [Values and state](./values-and-state.md) page documents
the explicit alternative value paths for generic infrastructure.

Aggregate state is derived from descendants. A form becomes invalid when one of its descendants
is invalid, while `errors()` remains scoped to errors owned directly by the current node. Use
`allErrors()` to collect errors from the complete subtree.
