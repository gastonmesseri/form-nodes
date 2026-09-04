---
title: Compatibility
---

# Compatibility

Use this table to choose a compatible Form Nodes release. A combination is listed only after it has
been intentionally supported and verified.

| Form Nodes | Angular | Node.js | Status |
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
npm install --save form-nodes@^0.1 @angular/core@^22 @angular/forms@^22
```

:::warning Do not bypass peer-dependency conflicts

`--force` can install an Angular combination the library has not verified. Align `@angular/core`
and `@angular/forms` first, then select the matching Form Nodes release line.

:::

## Angular 21 assessment

The current package is incompatible with Angular 21. An audit against Angular 21.2.22 and
TypeScript 5.9.3 found that the core form and `[formNode]` tests largely pass, but the package
build fails on Angular Signal Forms exports and signatures that differ from Angular 22.
The `$field` integration also needs work for constraint metadata, touch events, and reset behavior.

TypeScript language features are not the main blocker: the existing public inference tests pass
with TypeScript 5.9.3 when checked against the current Angular declarations. Angular 21 requires
TypeScript `>=5.9.0 <6.0.0`; see [Angular's version table](https://angular.dev/reference/versions).
Supporting Angular 21 requires a compatible implementation, build toolchain, and integration
verification before the peer range can be expanded.

## Repository compatibility checks

The repository checks a packed copy of the library in isolated Angular 22.1.5 / TypeScript 6.0.3
and Angular 21.2.22 / TypeScript 5.9.3 consumers. Angular 22 is required in CI; Angular 21 is an
experimental diagnostic whose failures remain visible in the workflow summary.

```bash
npm run build
npm run test:compatibility -- 22
npm run test:compatibility -- 21
```

These checks compile the public declarations and templates and run three Node runtime smoke tests.
They supplement the browser, hydration, and full behavioral checks required for a supported release.
The experimental Angular 21 run bypasses peer checks inside a temporary test directory to expose
underlying failures; it does not make Angular 21 supported. The package is still built with Angular
22, and `$field` remains available.

## Unlisted Angular versions

An unlisted version is unsupported, not necessarily known to be incompatible. Before expanding the
range, the project must verify the complete build and integration matrix. See
[Versioning and releases](./versioning.md#angular-support-policy).
