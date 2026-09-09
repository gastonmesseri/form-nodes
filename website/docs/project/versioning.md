---
title: Versioning and releases
---

# Versioning and releases {#versioning-and-releases}

Form Nodes versions describe the library itself; they do **not** mirror Angular's version number.
For example, Form Nodes `3.x` supports Angular 21 and 22, but that does not imply that Angular 22 requires
Form Nodes 22.

## 📦 Version policy {#version-policy}

Form Nodes uses [Semantic Versioning](https://semver.org/) by default, with explicit exceptions
documented below:

| Release | Meaning |
| --- | --- |
| Patch, such as `1.0.1` | Backward-compatible fixes |
| Minor, such as `1.1.0` | Backward-compatible features |
| Major, such as `2.0.0` | Breaking changes |

Version `3.0.0` reorganizes public node types and Angular imports as documented in the migration guide.
The API may continue to evolve as the library is tested in applications; further incompatible
changes normally require another major release. Review the changelog
and migration guide before every upgrade, including minor releases covered by an exception. Breaking changes must be identified explicitly.
Dropping a supported Angular version requires a major release. Adding support for a new Angular
major without breaking existing consumers does not require matching that Angular version number.

## 🔌 Angular support policy {#angular-support-policy}

Compatibility is based on verified peer-dependency ranges and the project's test matrix, not only
on whether npm can install a combination. A new Angular major is supported only after the package
build, public types, Angular template compilation, package-consumer tests, and browser integration
tests pass against it.

Support for an Angular major is not assumed to include earlier or later majors. Consult the
[compatibility table](./compatibility.md) before installing or upgrading.

## 📦 Reading a release {#reading-a-release}

For each upgrade:

1. Find the target version in the [changelog](./changelog.md).
2. Confirm your Angular and Node.js versions in the [compatibility table](./compatibility.md).
3. Follow any applicable instructions in [Migration guides](./migrations.md).
4. Run your application's type checks, Angular template compilation, unit tests, and binding tests.

The documentation website describes the current development line. When behavior differs between
released versions, the changelog and migration guide are the authoritative starting points.

## 📦 Initial release exception {#initial-release-exception}

Version `1.1.0` includes the declared-child typing change documented in the migration guide.
This is an explicit exception during initial development, before consumer adoption. The general
Semantic Versioning policy above remains the rule for subsequent releases.

## Nested value API exception: 3.3.0 {#nested-value-api-exception}

The nested value API change ships in **3.3.0**, a minor release, at the maintainer's explicit
request while the maintainer is the library's only consumer. This is an exception to the default
Semantic Versioning policy, not a claim of backward compatibility.

`controlValue()` and `setControlValue()` are removed. Existing code must migrate to
`value.control()` and `value.control.set()`, as described in the
[3.3.0 migration guide](./migrations.md#nested-value-views). The changelog continues to identify
the change as breaking so its upgrade requirements remain visible.
