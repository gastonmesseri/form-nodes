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
