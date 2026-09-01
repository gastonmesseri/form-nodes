---
title: Versioning and releases
---

# Versioning and releases

Gem Forms versions describe the library itself; they do **not** mirror Angular's version number.
For example, Gem Forms `0.1.x` supports Angular 22, but that does not imply that Angular 22 requires
Gem Forms 22.

## Version policy

Gem Forms follows [Semantic Versioning](https://semver.org/):

| Release | After 1.0 | During the current 0.x phase |
| --- | --- | --- |
| Patch, such as `1.2.3` | Backward-compatible fixes | Backward-compatible fixes |
| Minor, such as `1.3.0` | Backward-compatible features | Features and possible breaking API changes |
| Major, such as `2.0.0` | Breaking changes | Reserved for a significant project milestone |

Before 1.0, review the changelog and migration guide before every minor upgrade. Breaking changes
must be identified explicitly; upgrading should never require discovering them through compiler or
runtime failures alone.

## Angular support policy

Compatibility is based on verified peer-dependency ranges and the project's test matrix, not only
on whether npm can install a combination. A new Angular major is supported only after the package
build, public types, Angular template compilation, package-consumer tests, and browser integration
tests pass against it.

Support for an Angular major is not assumed to include earlier or later majors. Consult the
[compatibility table](./compatibility.md) before installing or upgrading.

## Reading a release

For each upgrade:

1. Find the target version in the [changelog](./changelog.md).
2. Confirm your Angular and Node.js versions in the [compatibility table](./compatibility.md).
3. Follow any applicable instructions in [Migration guides](./migrations.md).
4. Run your application's type checks, Angular template compilation, unit tests, and binding tests.

The documentation website describes the current development line. When behavior differs between
released versions, the changelog and migration guide are the authoritative starting points.
