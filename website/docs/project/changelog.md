---
title: Changelog
---

# Changelog

This page summarizes consumer-visible changes. The repository's
[complete changelog](https://github.com/gastonmesseri/ng-forms/blob/main/CHANGELOG.md) is the
canonical release record.

## Unreleased

### Added

- `field.strict()` and `field.nullable()` provide concise local nullability overrides on package
  and configured field factories.
- `createFormPrimitives()` creates isolated form primitive factories with an optional field-nullability
  default for direct fields, shorthands, dynamic children, and future array items.
- `FormValueContract<TValue>` checks an inferred form or group against a named aggregate value with
  `satisfies` while preserving concrete child-node types such as `ArrayNode`.
- A complete consumer documentation website with tutorials, API reference, recipes, integration
  guides, executable examples, and an interactive playground.
- Typed `field()`, `form()`, `array()`, and `group()` signal-based primitives.
- Synchronous and asynchronous validation with reactive, configurable messages.
- Angular `[formNode]` binding for native, signal-based, and `ControlValueAccessor` controls.

### Changed

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
