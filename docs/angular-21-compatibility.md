# Angular 21 compatibility audit

> Historical audit: the implementation has since removed `$field` and enabled the verified
> Angular 21.2.22 / Angular 22.1.5 range. The findings below describe the pre-change package.

Audited on 2026-09-07 against Form Nodes commit `ff2ea8a`.

Angular 21 support appears feasible for the Form Nodes engine and `[formNode]`, but the current
package does not build or fully work with Angular 21. TypeScript 5.9 supports the library's
language features. The main work is adapting the Angular Signal Forms integration and verifying
its control behavior. This audit does not add Angular 21 to the supported peer range.

## Versions and method

- Latest stable Angular 21 tag resolved from GitHub and npm: `v21.2.22`, commit
  `4c0bc4345a41ab48d8361e0bff18191da9c8c065`.
- Latest stable Angular 22 tag resolved from GitHub: `v22.1.5`, commit
  `468b65b74566537456c192ac4281795c5a1e1a5e`. This remains the internal behavioral authority.
- Isolated Angular 21 installation: Angular packages `21.2.22`, TypeScript `5.9.3`,
  `ng-packagr` `21.2.7`, Vitest `3.2.7`. Source and tests were copied without implementation changes.
  The temporary package used Angular 21 peers and tooling; the working repository and lockfile
  retained their Angular 22 dependencies.
- The comparison run in the working repository used its installed Angular `22.1.3` and
  TypeScript `6.0.3`. Source inspection used the latest maintenance tags above.
- Angular 21.0 and 21.1 were not tested. Results for 21.2.22 do not establish a `^21.0.0` minimum.

Angular 21 supports TypeScript `>=5.9.0 <6.0.0` and Node.js `^20.19.0 || ^22.12.0 || ^24.0.0`.
The repository's TypeScript 6 development configuration is therefore unsuitable for an Angular 21
compiler run. See [Angular's version table](https://angular.dev/reference/versions).

## TypeScript findings

`NoInfer` was introduced in [TypeScript 5.4](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html#the-noinfer-utility-type),
and `const` type parameters in [TypeScript 5.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters).
Neither requires TypeScript 6.

To separate language compatibility from Angular API incompatibilities, the TypeScript 5.9.3
compiler was also run against the working repository's existing Angular 22 declarations:

```bash
node /path/to/typescript-5.9.3/bin/tsc -p tsconfig.type-tests.json --noEmit
node /path/to/typescript-5.9.3/bin/tsc -p tsconfig.spec.json --noEmit --lib ES2022,DOM,DOM.Iterable
```

Both passed, including the existing public inference assertions. This is a TypeScript check,
not an Angular 22 compiler configuration supported by Angular.

Without the `--lib` override, the specification project reported six diagnostics from spreading
DOM collections in `form-node.directive.spec.ts`. A TypeScript 5.9 test configuration needs
`DOM.Iterable` alongside `DOM`. No source language changes were needed for the successful check.
This audit establishes compatibility with 5.9.3, not a general minimum TypeScript version.

## Angular API and control behavior blockers

| Boundary | Angular 21.2.22 evidence | Consequence for Form Nodes |
| --- | --- | --- |
| Constraint metadata | `MIN` and `MAX` directly reduce numeric values. `MIN_DATE`, `MAX_DATE`, `MIN_NUMBER`, and `MAX_NUMBER` are absent. Angular 22 instead uses limit-selection keys plus typed limit keys. | `src/lib/interop/angular-field.ts` cannot compile or bundle. Numeric metadata needs a version-compatible implementation; date constraint propagation through `$field` needs an explicit supported contract. Aliasing the missing keys is insufficient. |
| Binding type | Angular 21 exposes bindings as `FormField<unknown>` and does not export `FormFieldBinding`. | The adapter and `provide-form-nodes-config.ts` need a compatible binding type for state, focus, element, injector, and class predicates. |
| UI type | Angular 21's `FormUiControl` is not generic. | The exported `FormNodeUiControl<TValue, TNode>` declaration cannot compile unchanged. Preserve its consumer contract without referencing an incompatible Angular type. |
| Availability rules | Angular 21 accepts a logic function directly for `disabled`, `readonly`, and `hidden`; it does not accept the Angular 22 `{ when }` object. | Adapt the rule invocation while preserving reactive node ownership. Angular 22 still accepts the older overload, but deprecates it. |
| Touched propagation | Angular 21 `markAsTouched()` affects only the selected node. Angular 22 supports descendant propagation and `skipDescendants`. | Adapt the adapter's own-node call; retain Form Nodes' existing propagation rules and nested-node tests. Do not change the public node API to match Angular 21. |
| Custom-control touch | Angular 21's own directive listens to `touchedChange`; Angular 22 listens to `touch`. | A control using only the current `touch` output cannot be assumed to report blur through Angular 21 `[formField]`. This differs from Form Nodes-owned `[formNode]` discovery. |
| Reset lifecycle | Angular 21's field reset writes an optional value and clears subtree interaction. Angular 22 additionally cancels pending sync, restores control value even when the committed value is unchanged, and invokes binding reset hooks. | The existing `$field` reset delegation cannot promise the current parsing, custom-control reset, and buffered-input behavior on Angular 21 without further integration work. |

The missing runtime imports are reachable from the package's primitives through their `$field`
registration. Therefore avoiding `$field` in application templates does not make the current
package generally installable or bundleable on Angular 21.

Relevant upstream implementation and tests inspected at both tags:

- `packages/forms/signals/src/api/rules/metadata.ts` and
  `test/node/api/validators/min.spec.ts`: numeric metadata in 21 versus typed limits in 22.
- `packages/forms/signals/src/api/rules/{disabled,hidden,readonly}.ts`: rule signatures.
- `packages/forms/signals/src/api/{types,control}.ts`: field binding and custom-control contracts.
- `packages/forms/signals/src/directive/control_custom.ts`: value and touch event routing.
- Angular 21 `packages/forms/signals/src/directive/form_field_directive.ts`: binding state and
  parsing-error ownership.
- `packages/forms/signals/src/field/node.ts` and `test/node/field_node.spec.ts`: touched propagation,
  subtree reset, and buffered input. The Angular 21 test explicitly asserts that touch does not
  propagate down. Angular 22 reset tests cover pending numeric and blur debounce, unchanged reset
  values, and cancellation.

Browse the pinned [Angular 21 source and tests](https://github.com/angular/angular/tree/v21.2.22/packages/forms/signals)
and [Angular 22 source and tests](https://github.com/angular/angular/tree/v22.1.5/packages/forms/signals).

## Executed checks

| Check | Result |
| --- | --- |
| Angular 21 `npm run build` | Failed with 15 TypeScript diagnostics: missing exports, incompatible signatures, and consequent inference errors. |
| Angular 21 `node node_modules/typescript/bin/tsc -p tsconfig.type-tests.json --noEmit` | Failed with the same 15 Angular API diagnostics. |
| Angular 21 focused runtime run | 5 files discovered: 3 passed, 2 failed; 474 tests passed, 48 failed. |
| Angular 22 focused comparison | All 5 files and 522 tests passed. |
| Angular 21 `npx vitest run` | 80 files discovered: 75 passed, 5 failed; 1,152 tests passed, 53 failed. |
| TypeScript 5.9.3 with existing Angular 22 declarations | Public type tests passed; source/specification typechecking passed with `DOM.Iterable`. |

The focused run used these existing suites:

```bash
npx vitest run src/lib/primitives/field.spec.ts src/lib/primitives/form.spec.ts src/lib/form-node/form-node.directive.spec.ts src/lib/interop/angular-field.spec.ts src/lib/form-node-state/adapters/form-field.spec.ts
```

The Angular 21 full run passed `field`, `form`, `array`, `group`, `[formNode]`, CVA/`NgControl`,
and server-rendering suites. Of the 53 failures, 49 were Signal Forms adapter/form-node-state tests
blocked by missing constraint metadata; four ownership tests failed during subprocess bundling
because of the same missing runtime exports. Passing tests under Vitest's transformation do not
override the package build failures or demonstrate that an Angular 21 application can consume it.

Browser/AOT integration, hydration, and published-package consumption were not verified on Angular 21.
The package build already fails, and no compatibility implementation was made. Upstream tests were
read as evidence; the Angular repository's own test suite was not executed.

## Work required before declaring support

1. Choose the actual Angular 21 minimum and implement a small compatibility boundary for the
   different Signal Forms exports, types, metadata, and rule signatures.
2. Resolve `$field` date constraints, touch events, reset hooks, parsing cleanup, and buffered input
   using sufficiently stable control-binding mechanisms. If Angular 21 cannot provide a current
   feature, decide and document the supported limitation instead of recreating Angular's engine.
3. Build the distributable with the oldest supported Angular compiler and TypeScript 5.9, or maintain
   a separate compatible release line. Angular requires applications to use an Angular version at
   least as new as the compiler used for their libraries; see
   [library version compatibility](https://angular.dev/tools/libraries/creating-libraries#ensuring-library-version-compatibility).
4. Run types, inference performance, templates, package-consumer builds, runtime coverage, real-browser
   controls, production AOT, SSR/hydration, and documentation examples on both supported majors.
   Include `DOM.Iterable` in the TypeScript 5.9 test configuration and verify the intended Node range.
5. Only then expand peers, update installation/compatibility documentation, and record the shipped
   support in both changelogs.

Recommendation: retain Angular 22 as the supported line while treating Angular 21 support as a
separate implementation task. The language and core engine results are encouraging, but full
control interoperability is not a dependency-only change.

## Implementation verification (2026-09-07)

The completed implementation removes the field adapter, builds the package with Angular 21.2.22
and TypeScript 5.9.3, and requires both pinned consumers in CI. Angular 22.1.5 remains the
behavioral reference identified above.

Local verification used Node.js 22.22.3:

| Check | Angular 21.2.22 / TypeScript 5.9.3 | Angular 22.1.5 / TypeScript 6.0.3 |
| --- | --- | --- |
| `npm run typecheck` (lint, specifications, inference, template fixtures) | Passed | Passed |
| `npm run build` | Passed | Passed |
| `npm run test:coverage` | 79 files, 1,174 tests passed | 79 files, 1,174 tests passed |
| `npm run test:browser` (including production AOT, SSR fixtures, hydration) | 47 browser tests + 2 production AOT tests passed | 47 browser tests + 2 production AOT tests passed |
| Shared Angular 21-built tarball: strict installation, template/declaration compilation, runtime smoke tests | Passed; 3 runtime tests | Passed; 3 runtime tests |

Both coverage runs reached 100% statements, functions, and lines, and 99.13% branches.
The Angular 21 workspace also passed `npm run test:package`, `npm run docs:typecheck`
(including 21 executable documentation examples), and `npm run docs:build`.
Angular 22 source checks ran in an isolated temporary copy; the repository's development
dependencies remain on Angular 21. Browser binaries were installed before successful runs.

## Minimum-version expansion (2026-09-07)

The supported range is now `^21.0.7 || ^22.1.5`. Angular `v21.0.7`
(`8fd585cc0b4a7fc70ecb306c0c7b17f15393d0bf`) introduces `FormField` and `FORM_FIELD`.
Its validation-error declaration has `fieldTree` but no optional `formField` property.
The adapter accepts that older declaration while continuing to omit Angular binding references
from normalized errors. Angular 22 `v22.1.5` remains the behavioral authority.

The minimum build toolchain is Angular 21.0.7, ng-packagr 21.0.0, TypeScript 5.9.3, and Node.js
22.22.3. Tests use the library's own validation-error contract and checkbox template syntax
supported by Angular 21.0.7; no tests are skipped to enable compatibility.

Both Angular 21.0.7 and Angular 22.1.5 passed type checks, 1,174 unit tests with the required
coverage thresholds, and 47 browser plus 2 production AOT tests, including SSR/hydration fixtures.
The same Angular 21.0.7-built archive passed strict installation, one template/declaration
fixture, and three runtime tests in each of Angular 21.0.7, 21.2.18, and 22.1.5.
The repository also passed the package-consumer check and documentation type/build checks.
CI's pinned Angular 21 consumer now uses the minimum 21.0.7; the 21.2.18 consumer was checked
in an isolated temporary copy.
