# Changelog

All notable changes to Gem Forms are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html). While the package is below 1.0,
a minor release may contain breaking changes; every such change must be called out here and in the
consumer migration guide.

## [Unreleased]

### Added

- Consumer documentation website, including tutorials, reference pages, recipes, integrations,
  executable examples, and an interactive playground.
- Typed `field()`, `group()`, `form()`, and `array()` signal-based form primitives. `group()` owns
  fixed object structure while `form()` additionally represents a submission workflow boundary.
- Synchronous and asynchronous validation with configurable, reactive validator messages.
- Angular `[formNode]` binding for native, signal-based, and `ControlValueAccessor` controls.

### Changed

- Plain nested object definitions and object templates passed to `array()` now normalize to
  `Group` rather than `Form`. Use an explicit nested `form()` only for an independent submission
  workflow.
- Object shorthand now validates its complete declaration before construction, reports nested
  error paths, and rejects enumerable accessors, symbol child keys, and `__proto__`. It ignores
  inherited and non-enumerable properties.

## [0.1.0] - Unreleased

Initial development version. This version has not yet been recorded as a published stable release.

[Unreleased]: https://github.com/gastonmesseri/ng-forms/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/gastonmesseri/ng-forms/releases/tag/v0.1.0
