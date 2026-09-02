---
title: Migration guides
---

# Migration guides

There are no completed version-to-version migrations yet because `0.1.0` is the initial development
version. This page is nevertheless the permanent home for actionable upgrade instructions; future
breaking changes will be added here instead of being left only in release notes.

## Upgrade checklist

Use this process for every minor pre-1.0 release and every major stable release:

1. Read the source and target entries in the [changelog](./changelog.md).
2. Verify Angular, Node.js, and TypeScript expectations in [Compatibility](./compatibility.md).
3. Search the relevant migration section for renamed, removed, or behavior-changing APIs.
4. Upgrade without suppressing npm peer-dependency warnings.
5. Run TypeScript and Angular template compilation before changing application code preemptively.
6. Run tests that cover validation, submission, arrays, and `[formNode]` control bindings.

```bash
npm install --save @gem/ng-forms@^0.1
npx tsc --noEmit
ng build
ng test
```

Adapt the verification commands to the scripts and test runner used by your application.

## What migration entries will contain

Every breaking migration will identify:

- The first version containing the change.
- Who is affected and how to recognize the affected usage.
- A before-and-after example.
- Observable behavior changes, not only renamed TypeScript symbols.
- Any automated migration or temporary compatibility path, when available.

## Moving to 0.1.0

`0.1.0` is the initial development version, so there is no earlier Gem Forms version to migrate
from. For a new application, start with [Installation](../getting-started/installation.md) and then
build [Your first form](../getting-started/first-form.md).

### Validator state access

State signals are no longer direct validator-context properties. Read `dirty`, `disabled`,
`disabledReasons`, `enabled`, `hidden`, `pristine`, `readonly`, `required`, `submitting`, `touched`,
`untouched`, `visible`, and `writable` through `context.node()` or `context.field()` instead.

For example, replace `({ touched }) => touched()` with `({ node }) => node().touched()`.
The same migration applies to inline validators, `validator()`, built-in validator `when` options,
and all `asyncValidator()` callbacks. State reads retain their existing reactive tracking rules.
`value`, `node`, `field`, `parent`, and `path` remain on the shared context.

### Validator node signals and navigation

`context.node` and `context.field` are now the same readonly signal returning the validated node.
Inline callbacks and inline helpers infer the concrete primitive, its value type, and its children
or items. Omit helper generics to allow inference from the enclosing primitive.

| Previous access | New access |
| --- | --- |
| `context.field` as a node | `context.node()` or `context.field()` |
| `context.field.dirty()` | `context.node().dirty()` or `context.field().dirty()` |
| `context.field()` to read a value | `context.value()` (preferred) or `context.field().value()` |
| `context.form()` | `context.node().form()` or `context.field().form()` |
| `context.root()` | `context.node().root()` or `context.field().root()` |

Flat `form` and `root` context properties are removed. The node signals never return `null` and
keep their identity across value changes or tree moves. Explicit `TField` context types appear
as `Signal<TField>` on both aliases. Reading only `context.node()` tracks identity, not value.
`context.parent()` remains available. Replace `context.api` with `context.node().api` or
`context.field().api`. Inline validators infer the concrete node API. For separately declared
helpers, provide `TField` when an exact node type is needed; `TApi` now only specializes the
remaining context navigation. Read the typed value with `context.value()`.

### Form and root ancestry lookups

`form()` now identifies workflow ownership by returning the nearest explicit `form()`. Code that
used it to reach the outermost structural node must call `root()` instead:

```ts
const checkout = form({
  payment: form({
    card: field(''),
  }),
});

checkout.payment.card.form(); // checkout.payment
checkout.payment.card.root(); // checkout
```

A standalone `group()` or `array()` previously returned itself from `form()` and now returns
`null`; its new `root()` signal returns itself. Standalone fields continue to return `null` from
`form()`, but now also expose themselves through `root()`. Update validator dependencies in the
same way: use `context.node().form()` for the owning workflow and `context.node().root()` for the complete tree.

### Field nullability options

Per-field `nullable` options were removed before the initial release. Replace
`field(value, { nullable: false })` with `field.strict(value)`, and replace
`field(value, { nullable: true })` with `field.nullable(value)`. Preserve any other options as the
last argument. The `nullable` option on `createFormPrimitives()` is unchanged because it defines a
factory-wide default rather than one field's local choice.

### Declaration shorthand contract

The initial `0.1.0` contract accepts primitive values, `Date`, functions, class instances, other
non-plain objects, and arrays as atomic field shorthand inside `form()`, `group()`, dynamic
`add()`, and object templates passed to `array()`. Plain objects create structural groups. Existing
nodes are attached unchanged.

Arrays are always atomic fields when used as object properties; their length and contents never
select the node kind. Replace an array property with `array(template)` only when its items need
independent nodes. Wrap a plain application-data object with `field(value)` when it must remain one
atomic value, or use `group({...})` when the structural branch needs options or validators.

Definition objects reject enumerable accessors, symbol child keys, and `__proto__`. Replace an
accessor with a data property before constructing the form, use a supported string child key, or
wrap the complete object with `field(value)` when it represents one leaf value. See the
[declaration shorthand matrix](../concepts/creating-nodes.md#declaration-shorthand-matrix) for exact
equivalents and inferred types.

When migrating from Angular Reactive Forms or Angular 22 Signal Forms, use the
[form-modeling patterns](../guides/form-modeling-patterns.md) and
[control-binding guide](../guides/control-binding.md). These are conceptual migrations rather than
version upgrades, so application behavior should be translated deliberately instead of through
mechanical symbol replacement.
