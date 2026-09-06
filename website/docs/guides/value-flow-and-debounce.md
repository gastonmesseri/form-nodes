---
title: Value flow and debounce
---

# Value flow and debounce

The complete [debounce example](../examples/executable-examples.mdx#control-value-debounce) is
compiled and executed with assertions for control value, committed value, dirty, touched, and
debouncing state.

Gem Forms distinguishes programmatic model updates from values originating in a bound UI control. That distinction determines debounce and dirty behavior.

## Committed values

Calling a node is the preferred committed-value read:

```ts
const search = field('');

search(); // ''
```

Synchronous and asynchronous validators, forms, and arrays observe committed values only. See
[Alternative value access](../concepts/values-and-state.md#alternative-value-access) for the
equivalent explicit signal paths used by generic infrastructure.

## Programmatic operations

| Operation | Value effect | Dirty | Touched |
| --- | --- | --- | --- |
| `set(value)` | Replaces a complete value | Preserved | Preserved |
| `update(updater)` | Computes and replaces a complete value | Preserved | Preserved |
| `patch(value)` | Replaces supplied branches or positions | Preserved | Preserved |
| `reset()` | Preserves the committed value | Cleared recursively | Cleared recursively |
| `reset(value)` | Replaces the complete value | Cleared recursively | Cleared recursively |

Programmatic writes are synchronous and never debounced. They cancel pending control work and synchronize the directly bound control representation immediately.

An `update()` callback runs once, synchronously and untracked, and receives the current committed value rather than a pending control value.

## Control-originated values

`setControlValue()` represents a UI edit:

```ts
const myForm = form({
  search: field('', { debounce: 300 }),
});

myForm.search.setControlValue('angular');

myForm.search.controlValue(); // 'angular' immediately
myForm.search(); // '' until committed
myForm.search.debouncing(); // true
myForm.search.dirty(); // true immediately
```

It marks the directly bound node dirty even when the reported value equals the existing value. It does not mark the node touched; blur, a custom-control touch event, or `markAsTouched()` does that.

## Debounce strategies

```ts
field('', { debounce: 250 });
field('', { debounce: 'blur' });
field('', {
  debounce: async abortSignal => {
    await waitForIdle(abortSignal);
  },
});
```

- A positive finite number waits that many milliseconds.
- `'blur'` buffers until touch or focus loss.
- A function receives an `AbortSignal` and commits when its returned promise resolves.
- Missing, zero, negative, or non-finite numeric values commit immediately.
- A synchronous function result commits immediately.

Every new control value restarts the strategy and aborts prior custom work. Rejected custom debounce work leaves the committed value unchanged. `flush()` commits the latest value immediately and aborts outstanding work.

Pending timers and custom debounce promises do not, by themselves, keep unused nodes or their
parent trees alive. This also applies to cancelled custom work whose promise has not settled yet.
Nodes you still retain complete their debounce normally. References held by your own controls,
callbacks, values, or injectors keep their normal ownership.

## Touch and reset interaction

Marking an interactive node touched commits its pending control value for every debounce strategy. Touching a form or array recursively does the same for descendants unless `{ skipDescendants: true }` is used.

`reset()` without a value behaves differently: it cancels pending debounce, discards the buffered value, and restores `controlValue()` and rendered controls from the committed model.

## Inherited debounce

Forms and arrays can establish a default for their subtree:

```ts
const profile = form({
  name: field(''),
  address: {
    city: field('', { debounce: 100 }),
  },
}, {
  debounce: 300,
});
```

`name` inherits 300 ms and `address.city` overrides it with 100 ms. The nearest configured node wins, including an explicit zero that disables an inherited delay. New array items resolve inherited debounce after attachment.

## Aggregate nodes

`form.debouncing()` and `array.debouncing()` are true while any current descendant has buffered control work. Their `flush()` recursively commits only their current subtree.

Pending descendant values do not compose into an ancestor's `controlValue()`. Both the aggregate
node call and `controlValue()` keep their last committed representation until descendants commit.

A custom control bound directly to a form or array has its own aggregate control buffer. Its update marks the aggregate node dirty, then distributes or reconciles the complete value when committed; descendants are not individually marked dirty.

Control debounce and asynchronous-validator `pending()` are independent states.
