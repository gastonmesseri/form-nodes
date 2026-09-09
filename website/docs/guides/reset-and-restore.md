---
title: Reset and restore initial values
---

import CodeBlock from '@theme/CodeBlock';
import basicSource from '!!raw-loader!../../examples/reset-to-initial.example.ts';
import arraysSource from '!!raw-loader!../../examples/reset-initial-arrays.example.ts';
import dynamicSource from '!!raw-loader!../../examples/reset-initial-dynamic.example.ts';
import snapshotsSource from '!!raw-loader!../../examples/reset-initial-snapshots.example.ts';
import controlSource from '!!raw-loader!../../examples/reset-initial-control.typecheck.ts';

# Reset and restore initial values

Use `resetToInitial()` to restore the values captured when a field or array was initialized and
clear interaction state. It is available on fields, groups, forms, and arrays, and recursively
applies to the selected subtree. It takes no arguments.

## Choose the reset operation

| Operation | Committed values | Dirty and touched | Pending control input |
| --- | --- | --- | --- |
| `reset()` | Preserved | Cleared in the subtree | Discarded |
| `reset(value)` | Replaced with the supplied value | Cleared in the subtree | Discarded |
| `resetToInitial()` | Restored from captured initial values | Cleared in the subtree | Discarded |

All three reset operations synchronize controls with the committed model and clear control parsing
state through the normal reset hooks. `resetToInitial()` does not replace `reset()` or change its
existing meaning. Calling it on a child affects that branch; sibling values and interaction state
remain unchanged. Parent aggregate values and validity reflect the restored branch, but flags
explicitly set on an ancestor are not cleared by resetting a descendant.

<CodeBlock language="ts" title="profile-form.ts">{basicSource}</CodeBlock>

## What counts as initial?

A field captures its declaration value. A field declared without a value restores `null`; an
explicit `undefined` restores `undefined`. Attaching an existing field to a form does not redefine
its baseline, even if it was edited before attachment.

New array items capture their effective initialization values after supplied item data has been
applied. This includes `options.initialValue` and values supplied when inserting or creating a row.
For example, a template `field('Template')` initialized with `'Ada'` restores `'Ada'` when that row
or field is reset to initial. Updating a retained row does not redefine its own baseline.

`set()`, `patch()`, `update()`, `reset(value)`, and ordinary control edits do not redefine initial
values. Repeated restoration uses the same captured baseline.

### Loading a record is not redefining its defaults

If a form declares empty strings and later calls `reset(recordFromServer)`, `resetToInitial()` still
restores the declared empty strings. It does not mean "undo edits since loading" or "restore the
last saved record". For that behavior, keep an application-owned snapshot of the loaded/saved
record and pass it to `reset(snapshot)`. Use a snapshot strategy appropriate to your value types;
do not share mutable data with the editable form if it must remain a reliable restore point.

There is no public operation to replace the captured initial baseline in this release.

## Arrays: values, count, order, and identity

An array restores its initial collection, including the number and order of records. Rows added
later are removed, missing initial rows are recreated, and an initially empty array becomes empty.
Nested arrays restore their effective original collection as part of the enclosing restore.

Restoration uses the existing reconciliation rules: nodes are reused by position without `trackBy`,
or by matching keys with `trackBy`. Removed node instances are not resurrected. External references
to removed nodes remain detached; obtain a recreated row from the array again. Matching retained
nodes keep their current validators, options, and dynamically added object fields.

For a numeric `initialValue`, the array captures the concrete values produced for its initial rows.
A factory can run again to construct missing nodes, including its ordinary side effects, but its
newly generated defaults are overwritten by the captured data. This preserves original generated
IDs and dates; it does not guarantee zero factory calls. Missing nodes use the schema/configuration
produced by the factory when they are reconstructed.

<CodeBlock language="ts" title="contact-forms.ts">{arraysSource}</CodeBlock>

Use stable tracking keys. Reconciliation still applies its normal duplicate-key checks, and object
keys compared by reference may not match after supported data containers have been copied.

Restoring an individual row leaves the array's other rows and length unchanged. A row added later
restores its own creation values when reset individually, but restoring its owning array removes
that row if it was absent from the array's initial collection.

## Dynamic object fields: preserve the current schema

For forms and groups, restoration traverses the children that exist now. Fields added through
`add()` return to their own initial values, and removed fields are not recreated. This also applies
to dynamically added fields on retained array rows. This is value restoration, not a rollback of
schema changes. Groups and nested forms follow the same rules.

<CodeBlock language="ts" title="dynamic-profile.ts">{dynamicSource}</CodeBlock>

## Mutable values and snapshot boundaries

The library stores a private copy of supported containers and makes fresh copies when restoring
those captured values. The returned form value is not the protected baseline.

| Value kind | Restoration policy |
| --- | --- |
| Primitives, including `null` and `undefined` | Preserve the initial value. |
| Ordinary arrays and plain objects, including null-prototype objects | Copy their own property descriptors and recursively copy data-property values. |
| Standard `Date` | Copy the timestamp and own properties. |
| Standard `Map` and `Set` | Recursively copy entries and own properties. |
| Cycles and shared references | Preserve them within each captured value graph. |
| Accessor properties | Preserve descriptors without invoking getters; external getter/setter state is not captured. |
| Custom classes/subclasses, functions, `File`, `Blob`, DOM objects, typed arrays, and other opaque values | Preserve references; in-place changes to their contents cannot be undone. |

Property descriptors include symbol and non-enumerable properties. Object-wide frozen/sealed
status is not a snapshot guarantee. Copying also does not preserve reference identity with the
original supplied object, or shared identity across independently captured fields.

The library does not call `structuredClone()` or serialize values to JSON. Those approaches would
reject or alter some values that fields already accept. Prefer immutable updates for opaque values,
or use `reset(applicationOwnedSnapshot)` with your own cloning policy. In-place edits are not a
replacement for signal updates, even when a later restoration can recover supported containers.

<CodeBlock language="ts" title="snapshot-boundaries.ts">{snapshotsSource}</CodeBlock>

## Validation, availability, and asynchronous work

Restoration clears `dirty` and `touched`, cancels numeric/blur/custom debounce work, and discards
pending control values. Cancelled pending edits cannot later overwrite the restored values.

The restored values are evaluated by the validators currently configured, not an old copy of the
validator configuration. Restoring an empty required field can leave it pristine, untouched, and
invalid. Normal reactive validation and cancellation rules still apply when committed values
change; asynchronous validation can be pending after the method returns. Restoration does not
promise to restart an unchanged value's validation or clear unrelated application errors.

Availability overrides and configured rules are retained. Reactive `disabled`, `readonly`, or
`hidden` state can still change as a consequence of restored values. Restoration does not cancel
an in-progress submission or undo external side effects.

Configured public `equal` behavior remains active: public value reads can retain a previous
equivalent snapshot. Internally committed data and rendered controls use the restored value.

## Bound controls and value outputs

Native controls, CVAs, and signal custom controls synchronize through their existing reset/render
paths. Parsing state is cleared and optional custom `reset()` hooks run for retained bindings.
`resetToInitial()` does not emit `formNodeValueChange` or `formNodeControlValueChange`, because it is
a programmatic operation. It also cancels notifications belonging to discarded pending input.

Use an explicit button handler to restore defaults:

<CodeBlock language="ts" title="profile-editor.component.ts">{controlSource}</CodeBlock>

A native `<button type="reset">` on a `[formNode]` form still invokes the existing `reset()` behavior;
it does not automatically call `resetToInitial()`. A binding's `reset()` method also keeps its
existing behavior. To restore a node obtained through a binding, call
`binding.node().$api.resetToInitial()` when you need a collision-safe generic path.

## Related guides and reference

- [Value flow and debounce](./value-flow-and-debounce.md)
- [Dynamic arrays](./dynamic-arrays.md)
- [Dynamic object children](./dynamic-object-children.md)
- [Field reference](../reference/field.md#reset-to-initial)
- [Form reference](../reference/form.md#reset-to-initial)
- [Array reference](../reference/array.md#reset-to-initial)
