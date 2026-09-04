# Changelog

All notable changes to Gem Forms are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html). While the package is below 1.0,
a minor release may contain breaking changes; every such change must be called out here and in the
consumer migration guide.

## [Unreleased]

### Added

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
