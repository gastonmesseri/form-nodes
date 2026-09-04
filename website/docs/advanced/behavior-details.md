---
title: Advanced behavior and edge cases
---

# Advanced behavior and edge cases

This page collects precise runtime semantics that are rarely needed during ordinary form
development but matter when building reusable validators, generic infrastructure, custom controls,
or complex dynamic editors.

Start with the task-focused guides first. Return here when a result depends on scheduling, node
identity, ownership, or an unusual combination of APIs.

## Reactive validation execution

Synchronous validators run inside a lazy reactive computation. Reading `errors()`, `valid()`,
`invalid()`, or `validationStatus()` evaluates that computation. When a signal dependency changes,
the result is invalidated immediately and recomputed the next time validation state is consumed.
A template or `computed()` that already consumes validation state receives the update normally.

The validator context and its signal properties are stable between executions. Signals read from
`value`, `form`, `parent`, `path`, interaction state, availability state, or external application
state all participate in dependency tracking.

```ts
const blocked = signal(false);

const myForm = form({
  username: field('', [() => blocked()
    ? { kind: 'blocked', message: 'This username is currently blocked.' }
    : null]),
});

myForm.username.errors(); // []
blocked.set(true);
myForm.username.errors(); // [{ kind: 'blocked', ... }]
```

`update()` callbacks are different: they execute once, synchronously and untracked. Reading a
signal inside an updater does not create a persistent dependency.

## Conditional validator composition

A synchronous validator may return another synchronous validator or an array of validators. Every
returned validator receives the same context, and signals read at any composition level are tracked.

```ts
const enforceDisplayName = signal(false);

const myForm = form({
  displayName: field('', [
    () => enforceDisplayName() ? [required, minLength(2)] : null,
  ]),
});
```

Nullish entries are ignored. After they are removed, a returned array must contain either validators
or validation errors—not a mixture of both. An `asyncValidator()` must be configured directly in
the node's validator list; returning one from a synchronous validator is intentionally unsupported
because its watcher lifecycle must be established without executing arbitrary validators.

## Asynchronous scheduling and dependencies

Adding an async validator makes its node pending synchronously. Its first callback is deferred to
the next microtask, so a class property initializer may safely refer to the completed owning form.
Async work starts only while the node is interactive and synchronous validation has no errors.

Dependency behavior depends on the declaration style:

- Without explicit `params`, signals read before the validator's first asynchronous boundary are
  discovered automatically.
- `when(context)` is always reactive. Turning it off cancels debounce and in-flight work, clears the
  validator's pending state and errors, and prevents stale results from publishing.
- With `params(context)`, every signal read by `params` is tracked and the resulting snapshot is
  passed to `validate`.
- A parameterized `validate` callback runs untracked. Signals read only there do not become
  dependencies.
- Parameter snapshots use shallow equality. Plain object and array entries compare one level deep
  with `Object.is()`, avoiding a restart when a newly allocated snapshot contains unchanged values.
- Synchronous changes to several dependencies are coalesced into one run using their latest values.

Every meaningful dependency change restarts the complete validator debounce and invalidates older
work. Promise results are ignored after cancellation even if the underlying service ignores the
provided `AbortSignal`. Observable-like results use their first emission and unsubscribe when the
operation finishes or becomes stale.

Multiple async validators run independently. Completed errors become visible while other work is
pending, but errors remain ordered by validator declaration rather than network completion order.

## Ownership and lifetime

An explicit or currently captured injector takes precedence. Otherwise, a directly bound
`[formNode]` injector and then the nearest ancestor injector own async validation watchers by
default. `adoptBindingInjector: false` and `inheritInjector: false` control those stages
independently. Rebinding and detaching release transient ownership. The effective injector's
`DestroyRef` provides deterministic cleanup.
Nodes also work outside dependency injection; weak ownership allows an unreachable standalone tree
and its watchers to be garbage-collected. Garbage-collection cleanup is nondeterministic, so pass an
injector when deterministic teardown matters.

Removing an array item detaches it instead of destroying it. A retained reference remains a usable
standalone node tree:

```ts
const removed = myForm.people.removeAt(0);

removed?.parent(); // null
removed?.path();   // []
removed?.form();   // itself for an explicit form item, otherwise null
removed?.root();   // removed
```

The former array immediately stops aggregating the removed node's value, errors, pending work,
touched state, and dirty state. Descendants stay attached to the removed aggregate and recalculate
their paths relative to that new root.

Moving or swapping items has the opposite behavior: the exact nodes remain attached and preserve
their values, bindings, errors, interaction state, and pending work while indexes and paths update.

## Stored state while non-interactive

Disabled, readonly, and hidden nodes are treated as non-interactive. Their public validation,
pending, touched, and dirty state is suppressed, but configured validators and stored interaction
flags are retained.

Consequently, a field touched before being disabled reports `touched() === false` while disabled and
reports its stored touched state again after being enabled. Programmatic writes remain available in
every state. Async work is cancelled on entry and validation restarts against the current value when
the node becomes interactive again.

## Multiple bindings and control-owned errors

Several controls may bind to the same field. Node-owned validator errors appear in every binding,
but a control-owned error—such as a native parse failure—belongs to the concrete binding that
produced it.

```ts
const firstErrors = firstBinding().errors();
const secondErrors = secondBinding().errors();
const allFieldErrors = myForm.amount.errors();
```

The field aggregates errors from both bindings. Each binding filters that collection so it sees
shared node errors plus only its own control errors. A binding-owned error exposes `formNode` for the
concrete binding and `targetNode` for the field.

Programmatic writes and reset clear stale native parse errors and synchronize every current binding.
Rebinding or destroying a directive removes its previous error ownership and focus registration.

## Binding selection and compatibility

When an element exposes several compatible control mechanisms, `[formNode]` uses this precedence:

1. `ControlValueAccessor`.
2. An automatically discovered signal model or input/output pair.
3. Native element handling.

Angular's accessor-selection rules still apply within the CVA category: a custom accessor takes
precedence over a specialized built-in accessor, which takes precedence over the default accessor.
Ambiguous accessors in the winning category are rejected.

Synchronous `NG_VALIDATORS` errors participate in the node's real validation state.
`NG_ASYNC_VALIDATORS` are not adapted; use `asyncValidator()` so cancellation, debounce, pending
state, and stale-result handling remain owned by the node.

### Read-only signal-input compatibility

Angular does not expose a public setter for an `input()` signal on an existing host component. Form Nodes resolves aliases, property names, signal flags, and transforms through public
`reflectComponentType()` metadata. A narrowly isolated compatibility adapter then discovers the
private input-signal node through the signal's own symbols, without importing Angular's private
`ɵSIGNAL` or `ɵInputSignalNode` exports. It uses Angular's component-definition input writer when
available to preserve `ngOnChanges`, and marks the component for checking after a write.

The structural input node, `applyValueToInputSignal()`, and the component-definition writer remain
Angular implementation details. They are isolated under `form-node/angular-internals` and tested on
every supported Angular upgrade rather than treated as version-stable.

These private operations fail safely. If a future Angular release changes the component-definition
writer, Form Nodes falls back to the smaller signal writer. If that signal mechanism also becomes
incompatible, only synchronization of the affected optional state inputs—such as `disabled`,
`readonly`, or `required`—is skipped. Value and event binding and the form node itself continue to
work. Errors thrown by an application-defined input transform are still reported normally.

In development mode, Form Nodes emits one warning per affected control instance and input name when such a write is
skipped. When the component does not already use it, the warning recommends
`useControlState()` as the source-neutral state facade. A component already consuming that
facade does not receive the redundant recommendation. A `ControlValueAccessor` is another option when only
value and disabled interoperability are needed; it does not provide channels for every optional
state such as `readonly`, `required`, or errors.

The edited `value = model<T>()` or `checked = model<boolean>()` path does not need this adapter because
models are publicly writable. A custom control can avoid read-only state-input writes through the
stable control-state facade:

```ts
export class DatePicker {
  value = model<Date | null>(null);
  controlState = useControlState();
}
```

`controlState.disabled()`, `controlState.readonly()`, and the other signals currently read
`[formNode]` state. The same API is reserved for future `[formField]`, Reactive Forms, and `ngModel`
adapters. See [Advanced custom controls](../guides/custom-controls-advanced.md) for the complete contract.

## Server rendering and hydration

Native controls, signal controls, and CVAs receive their initial value and supported state during
server rendering. Browser-only observation of changing select options and native date-like parse
validity is deferred until a browser exists. Hydration reuses the rendered controls and reconnects
their events and reactive bindings.

The native validity observer is compatible with Angular's CSP nonce. These mechanisms are binding
details and do not change node behavior outside the browser.

## Defensive runtime behavior

TypeScript rejects incomplete complete-value writes and unknown object keys. If unsafe casts or
untyped data bypass those checks, unknown form keys and array patch indexes are ignored with a
console warning in development mode rather than becoming new nodes.

Array movement and insertion indexes must identify valid positions and throw `RangeError` when they
do not. Duplicate `trackBy` keys are detected before reconciliation mutates the array. A factory
that returns the same live node more than once also throws, preventing shared parentage and state.

## Current structural boundaries

Initially declared form child keys remain fixed, while `add()` and `remove()` manage explicitly
dynamic named children. Use `array()` for runtime addition, removal, and reordering of repeated
nodes. Schema-driven generation from JSON definitions is not currently part of the public API.

Continue with [Async validation](../guides/async-validation.md),
[Dynamic object children](../guides/dynamic-object-children.md),
[Dynamic arrays](../guides/dynamic-arrays.md), [Control binding](../guides/control-binding.md), or
[Interaction and availability](../guides/interaction-and-availability.md) for task-oriented usage.

## Development diagnostics

Form Nodes console warnings are emitted only in Angular development mode. This includes unknown
form keys, extra array patch indexes, unsupported reset options, hidden rendered nodes, and
custom-control input synchronization warnings. Angular production mode suppresses these messages;
the underlying operations keep the same behavior. This also applies to standalone nodes declared
outside an injection context. Angular's optimized CLI builds enable production mode automatically.
