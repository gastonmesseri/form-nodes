---
title: Changelog
---

# Changelog

This page summarizes consumer-visible changes. The repository's
[complete changelog](https://github.com/gastonmesseri/ng-forms/blob/main/CHANGELOG.md) is the
canonical release record.

## Unreleased

### Fixed

- Nested forms, groups, and populated arrays can now be constructed inside `computed()`. Declaration
  inputs remain reactive, while internal initialization no longer makes node edits rebuild the tree.
- Pending or cancelled control-value debounce work no longer retains otherwise unreachable fields,
  forms, groups, arrays, or their parent trees through timers and custom debounce promises.
- Compiled array templates no longer retain their source fields, forms, groups, arrays, or parent
  trees through clone callbacks. Later items still use the declared values, validators, and options.

### Added

- `field()` accepts `equal: 'shallow'`, `'deep'`, or a typed comparator to retain equivalent committed
  values and avoid value-triggered revalidation, while preserving control input and interaction state.
- A reactive `root()` signal on every node returns the complete structural
  root, including standalone fields, groups, forms, and arrays.
- An `error` option on every built-in validator for replacing a failed rule's standard error with
  one or more static or reactively produced custom errors.
- `field.strict()` and `field.nullable()` provide concise local nullability overrides on package
  and configured field factories.
- `createFormPrimitives()` creates isolated form primitive factories with optional defaults for field
  nullability, validator messages, and injector inheritance policies.
- `FormValueContract<TValue>` checks an inferred form or group against a named aggregate value with
  `satisfies` while preserving concrete child-node types such as `ArrayNode`.
- A complete consumer documentation website with tutorials, API reference, recipes, integration
  guides, executable examples, and an interactive playground.
- Typed `field()`, `form()`, `array()`, and `group()` signal-based primitives.
- Synchronous and asynchronous validation with reactive, configurable messages.
- Angular `[formNode]` binding for native, signal-based, and `ControlValueAccessor` controls.

### Changed

- Callable field objects now include a runtime `patch()` method equivalent to `set()`. The public
  types continue to expose field patching only through `api` and `$api`.

- Separately declared validators now preserve their declared value type when reading through
  `context.field()` or `context.node()`, including the node's value signal and API aliases.

- Inline validators now infer their owning `Field`, `Form`, `Group`, or `ArrayNode`, including
  aggregate children and array items. This also works through inline `validator()` and
  `asyncValidator()` helpers, with configured primitives and nullability overrides. IntelliSense
  shows the expanded model for inline `context.value()` reads, matching the node value signal.
- Validator contexts expose the validated node through the same readonly signal under `node` and
  `field`. Use `context.node()` (or `context.field()`) for the node and `context.value()` for its
  value. Flat `context.form()` and `context.root()` have been removed; use `context.node().form()`
  and `context.node().root()` instead. Interaction, availability, required, and submission state
  signals also move from the flat context to the node, such as `context.node().touched()` and
  `context.node().disabled()`. This applies to synchronous validators and every asynchronous
  callback. Access the API through `context.node().api` or `context.field().api` instead of
  `context.api`; inline validators retain the concrete node API. `parent()` remains available on
  the context.

- `form()` returns the nearest explicit form workflow instead of the complete structural root.
  Nested forms own their descendants, while standalone fields, groups, and arrays return `null`;
  use `root()` when the outermost node is required.
- `field(undefined)` preserves `undefined` as its initial value, while an omitted initial value
  continues to start at `null`. Explicitly typed calls include `undefined` in the field value type.
  A no-argument `field()` from `createFormPrimitives({ nullable: false })` now also typechecks as
  `Field<unknown>`, matching its existing `null` initial value.
- Field-level `nullable` options have been removed. Use `field.strict()` or `field.nullable()` for
  local nullability choices; `createFormPrimitives({ nullable })` remains the factory-wide default.
- Form and group callable values display their complete nested object shape in IntelliSense rather
  than internal value and normalization helper types.
- Nested object shorthand and object templates in `array()` now create structural `Group` nodes.
  `Form` is reserved for explicit submission workflow boundaries.
- Object shorthand validates the complete declaration before construction, reports nested error
  paths, and rejects enumerable accessors, symbol child keys, and `__proto__`. Inherited and
  non-enumerable properties are ignored, and diagnostics recommend `field(value)` when an object
  was intended to remain an atomic field value.
- `form.add()` and `group.add()` accept the same field and nested-group shorthands as initial
  declarations through both the single-child and atomic batch signatures, with aligned runtime and
  TypeScript normalization.
- `array()` object templates and object-template factories accept field shorthands such as
  `{ name: '', age: 0 }`, producing independently cloned groups and fields with matching TypeScript
  inference.
- Array values in `form()`, `group()`, dynamic `add()`, and `array()` object templates consistently
  become atomic `Field` nodes. Only an explicit `array(...)` creates a dynamic collection, so the
  inferred node never depends on array length or contents. Empty mutable array shorthands infer
  `unknown[]` instead of `never[]`.

## 0.1.0

Initial development version. It is not presented as a stable 1.0 API. Review
[Versioning and releases](./versioning.md) before adopting a pre-1.0 update.

## Changelog categories

Each release uses the categories that apply:

- **Added** for new consumer-facing capabilities.
- **Changed** for behavior or API changes.
- **Deprecated** for APIs scheduled for removal.
- **Removed** for removed APIs.
- **Fixed** for corrected behavior.
- **Security** for security-related changes.

Breaking changes include a direct link to their corresponding
[migration instructions](./migrations.md).
