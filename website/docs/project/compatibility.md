---
title: Compatibility
---

# Compatibility

The current development line supports these verified minimum Angular patches:

| Form Nodes | Angular | TypeScript |
| --- | --- | --- |
| `1.0.x` | `^21.0.7` | `>=5.9.0 <6.0.0` |
| `1.0.x` | `^22.1.5` | `>=6.0.0 <6.1.0` |

Both `@angular/core` and `@angular/forms` must satisfy the peer range. Keep all Angular packages
on mutually compatible versions. Earlier Angular 21 and 22 patches are outside the verified range.
Use the Node.js and TypeScript versions supported by your Angular version; see
[Angular's version table](https://angular.dev/reference/versions). The repository uses Node.js
22.22.3 (`.nvmrc`), Angular 21.0.7, and TypeScript 5.9.3 to build the package. The package's Node.js
engine range also applies. Angular 21 consumers can use Node.js `^20.19.0`, `^22.12.0`, or
`^24.0.0`; Angular 22 consumers require Node.js `^22.22.3`, `^24.15.0`, or `^26.0.0`.
Node.js 20.19.4 is therefore supported with Angular 21, but not Angular 22. Node.js 22.22.3
is a shared supported choice for both Angular versions. The repository development baseline
does not set the minimum Node.js version for consuming the published library.

Angular 21.0.7 is the minimum because it introduces `FormField` and `FORM_FIELD`, which
`useFormNodeState()` uses to observe Angular Signal Forms. The supported range includes later
Angular 21 releases such as 21.2.18.

## Installing

In an application already using a supported Angular version:

```bash
npm install @ngblocks/form-nodes
```

Resolve peer conflicts by aligning Angular packages rather than bypassing npm's checks.

## Controls and state

Use `[formNode]` to bind Form Nodes fields, forms, groups, and arrays. The former `$field` adapter
has been removed; see the [migration instructions](./migrations.md#removing-the-field-adapter).
`useFormNodeState()` still observes `[formNode]`, Angular `[formField]`, Reactive Forms, and `ngModel`.
For Angular `[formField]`, the form model is created by Angular Signal Forms itself.

Custom controls can use `model()`, input/output pairs, or `ControlValueAccessor` on either major.
The optional `FormNodeUiControl`, `FormNodeValueControl`, and `FormNodeCheckboxControl` contracts
belong to Form Nodes and remain consistent across versions. Form Nodes' internal state rules
continue to follow the inspected Angular 22 baseline even when running on Angular 21.

## Repository verification

The compatibility workflow builds one archive with Angular 21 and installs it into independently
locked Angular 21.0.7 / TypeScript 5.9.3 and Angular 22.1.5 / TypeScript 6.0.3 consumers. Both checks
are required and use strict peer and engine resolution. CI also checks the Angular 21 consumer
on Node.js 20.19.0, the minimum supported Node.js 20 patch:

```bash
npm run build
npm run test:compatibility -- 21
npm run test:compatibility -- 22
```

The consumers check public declarations, strict Angular templates, and three runtime smoke tests.
The full release checks additionally cover type inference, validation outside injection, native and
custom controls, CVAs, production AOT, server rendering, hydration, and executable documentation.
Application browser support remains determined by Angular's supported build targets.

## Future Angular versions

A new major enters the peer range only after the package and integration checks pass. See
[Versioning and releases](./versioning.md#angular-support-policy).
