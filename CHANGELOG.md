# Changelog

All notable changes to Form Nodes are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html). While the package is below 1.0,
a minor release may contain breaking changes; every such change must be called out here and in the
consumer migration guide.

## [Unreleased]

### Fixed

- Library console warnings now appear only in Angular development mode, including ignored keys/indexes,
  unsupported reset options, and custom-control input synchronization diagnostics.

- `[formNode]` now supports CVAs that subscribe to an injected `NgControl`: value/status streams
  and Angular control-state events follow the bound node, survive rebinding, and complete on destruction.
  CVAs can also report parsing errors through `control.setErrors()`: binding-owned errors affect node
  and ancestor validity and clear independently of configured validators on correction, reset, or detachment.
  `getError()` and `hasError()` expose these error payloads and support relative descendant paths.
  Injected `NgControl.name` and `path` now follow the bound node’s structural location through
  array moves, detachment, reattachment, and rebinding.
  CVAs can reset the bound subtree through `NgControl.reset()` or `control.reset()`, preserving
  node reset semantics and supporting local notification suppression with `{ emitEvent: false }`.
  Unsupported `onlySelf` and `overwriteDefaultValue` reset options warn and are ignored instead of interrupting reset.
  `validator` and `asyncValidator` now explicitly return `null` on both adapter surfaces: no Angular
  validator functions are exported; node validation remains observable through errors, pending, and status.
- `useControlState().value()` with `[formNode]` now reports the latest committed value even when
  node equality retains an older public value. Pending debounce input remains separate.
- Asynchronous validators preserve pending work when a computed dependency compares equal, while
  continuing to react to later value changes.
- Nested forms, groups, and populated arrays can now be constructed inside `computed()`. Declaration
  inputs remain reactive, while internal initialization no longer makes node edits rebuild the tree.
- Pending or cancelled control-value debounce work no longer retains otherwise unreachable fields,
  forms, groups, arrays, or their parent trees through timers and custom debounce promises.
- Compiled array templates no longer retain their source fields, forms, groups, arrays, or parent
  trees through clone callbacks. Later items still use the declared values, validators, and options.

### Added

- `field()`, `form()`, `group()`, and `array()` accept shallow, deep, or custom equality for exposed values,
  validation, update callbacks, and submission. Public parents compose exposed child values;
  internal writes, reset, controls, and debounce remain independent. Equality is evaluated lazily,
  and comparator errors affect exposed reads after writes have committed. Array structure and
  keyed reconciliation continue updating even when the exposed collection compares equal.
- `FormNodeValue<typeof node>` extracts the committed value type of any form, group, array, or
  field, preserving nested objects, arrays, and field nullability.
- A reactive `root()` signal on every node returns the complete structural
  root, including standalone fields, groups, forms, and arrays.
- An `error` option on every built-in validator for replacing a failed rule's standard error with
  one or more static or reactively produced custom errors.
- `field.strict()` and `field.nullable()` shortcuts for forcing one field's nullability regardless
  of the package or `createFormPrimitives()` default.
- `createFormPrimitives()` for creating isolated `form`, `field`, `group`, and `array` factories with
  optional defaults for field nullability, validator messages, and injector inheritance policies.
- `FormValueContract<TValue>` for checking an inferred form or group against a named aggregate value
  with `satisfies` while preserving concrete child-node types such as `ArrayNode`.
- Consumer documentation website, including tutorials, reference pages, recipes, integrations,
  executable examples, and an interactive playground.
- Typed `field()`, `group()`, `form()`, and `array()` signal-based form primitives. `group()` owns
  fixed object structure while `form()` additionally represents a submission workflow boundary.
- Synchronous and asynchronous validation with configurable, reactive validator messages.
- Angular `[formNode]` binding for native, signal-based, and `ControlValueAccessor` controls.

### Changed

- Support Angular `^21.0.7 || ^22.1.5`, building the library with Angular 21 and TypeScript 5.9.
  Custom-control types now expose the Form Nodes contract consistently across both majors.
- **Breaking:** Remove the `$field` adapter. Bind Form Nodes with `[formNode]="node"` instead of
  `[formField]="node.$field"`. `provideFormNodeConfig()` now configures `[formNode]` only and can
  coexist with Angular's class configuration. `useControlState()` still observes independently
  created Angular Signal Forms, Reactive Forms, and template-driven controls.

- **Breaking:** The package is now named `form-nodes`. Update dependencies, imports, and module
  augmentations to use `form-nodes`; exported APIs and runtime behavior are unchanged by the rename.

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

- `form()` now returns the nearest explicit form workflow instead of the complete structural root.
  Nested forms own their descendants, while standalone fields, groups, and arrays return `null`;
  use `root()` when the outermost node is required.
- `field(undefined)` now preserves `undefined` as its initial value, while an omitted initial value
  continues to start at `null`. Explicitly typed calls include `undefined` in the field value type.
  A no-argument `field()` from `createFormPrimitives({ nullable: false })` now also typechecks as
  `Field<unknown>`, matching its existing `null` initial value.
- Field-level `nullable` options have been removed. Use `field.strict()` or `field.nullable()` for
  local nullability choices; `createFormPrimitives({ nullable })` remains the factory-wide default.
- Form and group callable values now display their complete nested object shape in IntelliSense
  instead of exposing internal `FormValue` and normalization helpers.
- Plain nested object definitions and object templates passed to `array()` now normalize to
  `Group` rather than `Form`. Use an explicit nested `form()` only for an independent submission
  workflow.
- Object shorthand now validates its complete declaration before construction, reports nested
  error paths, and rejects enumerable accessors, symbol child keys, and `__proto__`. It ignores
  inherited and non-enumerable properties, and diagnostics recommend `field(value)` when an object
  was intended to remain an atomic field value.
- `form.add()` and `group.add()` now accept the same field and nested-group shorthands as initial
  declarations in both their single-child and atomic batch signatures, with matching runtime and
  TypeScript normalization.
- `array()` object templates and object-template factories now accept field shorthands such as
  `{ name: '', age: 0 }`, producing independently cloned groups and fields with matching TypeScript
  inference.
- Array values in `form()`, `group()`, dynamic `add()`, and `array()` object templates now normalize
  consistently to atomic `Field` nodes. Only an explicit `array(...)` declaration creates a dynamic
  collection, so node inference never depends on whether an array is empty or on its item values.
  Empty mutable array shorthands infer `unknown[]` rather than the unusably narrow `never[]`.

## [0.1.0] - Unreleased

Initial development version. This version has not yet been recorded as a published stable release.

[Unreleased]: https://github.com/gastonmesseri/ng-forms/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/gastonmesseri/ng-forms/releases/tag/v0.1.0
