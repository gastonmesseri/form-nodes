---
title: Compatibility
---

# Compatibility

Use this table to choose a compatible Gem Forms release. A combination is listed only after it has
been intentionally supported and verified.

| Gem Forms | Angular | Node.js | Status |
| --- | --- | --- | --- |
| `0.1.x` | `^22.0.0` | `^22.22.3`, `^24.15.0`, or `>=26.0.0` | Current development line |

Both `@angular/core` and `@angular/forms` must satisfy the Angular range. Keep Angular packages on
mutually compatible versions, as recommended by Angular itself.

## TypeScript

Use a TypeScript version supported by your installed Angular version. Applications do not need to
match the repository's development TypeScript version exactly: Angular's compiler compatibility is
the consumer-facing constraint.

## Browser and rendering environments

The package is ESM and supports the environments produced by Angular 22's supported toolchain.
The project verifies:

- Node creation and form behavior outside an Angular injection context.
- Angular AOT and template type checking.
- Native controls, signal-based controls, and `ControlValueAccessor` integration in a real browser.
- Server rendering and hydration for `[formNode]` integration.

Your application's supported browsers remain determined by its Angular build targets and browser
support policy.

## Installing a compatible line

```bash
npm install --save @gem/ng-forms@^0.1 @angular/core@^22 @angular/forms@^22
```

If npm reports a peer-dependency conflict, do not force the installation as a compatibility fix.
Check the installed Angular versions and select a Gem Forms line listed above.

## Unlisted Angular versions

An unlisted version is unsupported, not necessarily known to be incompatible. Before expanding the
range, the project must verify the complete build and integration matrix. See
[Versioning and releases](./versioning.md#angular-support-policy).
