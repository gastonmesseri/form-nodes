# Project instructions

- Use English throughout the entire project.
- Write all source code, identifiers, comments, documentation, tests, commit-facing text, warnings, errors, and generated user-facing copy in English.
- Keep new and updated files in English even when the conversation with the user is in another language.
- `form()` and `field()` must remain safe to declare and use outside an Angular injection context. Their synchronous behavior and explicitly triggered asynchronous validation must always work without dependency injection.
- Reactive dependency tracking for asynchronous validators must work both inside and outside an Angular injection context.
- When an explicit or current injector exists, its `DestroyRef` must own and clean up the asynchronous validation watcher. Outside dependency injection, use weak ownership so an unreachable node and its watcher can be garbage-collected without keeping the form tree alive.
- Use Angular 22 Signal Forms as the primary reference for the library's internal behavior, not for its public API design or naming.
- State rules and propagation should behave comparably to Angular 22 Signal Forms whenever applicable. This includes what `disabled` depends on, how validity is aggregated, when fields are considered dirty or touched, and which descendants are affected by operations such as `disable()`, `markAsTouched()`, and `reset()`.
- Treat the latest Angular 22 Signal Forms source code and its tests as the primary authority for determining exact internal behavior. Prefer evidence from the implementation over assumptions based only on the documentation.
- Use Angular documentation as a secondary reference. When the documentation is ambiguous, incomplete, or differs from the implementation, follow the latest Angular 22 source and tests for behavioral decisions.
- For every request that adds, changes, fixes, or evaluates form behavior, inspect the latest available Angular 22 Signal Forms source code and relevant tests before proposing or implementing the change.
- Resolve and use the latest Angular 22 maintenance branch or release tag rather than relying on Angular's `main` branch. Record the inspected branch, tag, or commit when reporting implementation work.
- Identify the exact Angular implementation paths and tests governing the requested behavior, then derive this library's expected state transitions, propagation rules, validation effects, and edge cases from that evidence.
- Do not rely on memory or documentation alone for behavioral work when the Angular 22 source can be inspected.
- The library may use different signatures, terminology, and API semantics. When its internal state behavior intentionally differs from Angular 22 Signal Forms, document the difference clearly and cover it with tests.
- Prefix runtime properties and methods that are intentionally omitted from the public API types with `_`.
- Keep `docs/behavior.md` updated whenever form behavior or a public feature changes, including state dependencies, propagation, interaction effects, validation effects, and important edge cases.
- Prefer modern Angular APIs in all new and updated code. Use signal-based APIs such as `input()`, `output()`, `model()`, `viewChild()`, and `contentChild()` instead of their decorator-based equivalents when applicable, and declare host bindings and listeners in the directive or component `host` metadata instead of using `@HostBinding` or `@HostListener`.
- Omit explicit `: void` return annotations from function and method implementations when TypeScript can infer them. Keep `void` where it is part of a type contract, callback signature, overload, abstract declaration, or interface/type member without an implementation body.
- Give named arrow functions declared with `const` a block body with an explicit `return`, whether they are exported or internal. Concise expression bodies remain allowed for inline callbacks such as those passed to `map()`, `filter()`, or `some()`.
- In classes, group properties created with `computed()` immediately before the constructor.
- End every completed change handoff with a suggested English Conventional Commit message that summarizes the delivered change.

## Import style

- Separate third-party imports from project imports with exactly one blank line.
- Keep third-party imports in the first group and project imports in the second group.
- Sort imports within each group by ascending length of the complete import line, from shortest to longest.
- Keep every import on a single line. Do not use multiline imports, including imports with several named symbols.

## Type API style

- Declare signals and other stateful values as properties in public object types.
- Declare actions and operations with method syntax in public object types so editors distinguish state from behavior in IntelliSense.
- In public configuration types, especially options such as `FieldOptions`, `FormOptions`, and `ArrayOptions`, prefer inline unions when they make the accepted values immediately visible in IntelliSense. Do not hide a small, consumer-relevant union such as `number | 'blur'` or `boolean | string | (() => boolean | string)` behind a named alias merely for reuse; an alias may still exist for consumers or internal contracts when independently useful.
- Mark public parameterized functions that participate in signal dependency tracking with a JSDoc `@reactive` tag. Briefly describe the tracking or memoization semantics after the tag. Do not add the tag to ordinary `Signal` properties, whose type already communicates reactivity.

## Public API testing

- Treat `field()` and `form()` as the library's primary public API and maintain comprehensive behavioral coverage in `field.spec.ts` and `form.spec.ts`.
- Test public behavior through these primitives even when the underlying utility, validator runner, marker, watcher, or state helper already has focused unit tests of its own.
- Cover complete observable state transitions rather than isolated implementation details. This includes values, errors, validation status, pending state, interaction state, inherited state, cancellation, reset behavior, and parent-child propagation.
- For reactive and asynchronous behavior, verify the trigger as well as the result. Assert when validators execute, how many times they execute, which signal changes cause re-execution, whether stale work is cancelled, and what consumers observe before, during, and after completion.
- Add corresponding field-level and form-level tests whenever behavior applies to both leaf nodes and aggregate nodes. Include nested-form coverage when propagation or aggregation could behave differently at greater depth.
- Keep lower-level unit tests for edge cases and implementation contracts, but never use them as a substitute for public `field()` and `form()` integration coverage.
- Prefer assertions against the public API. Only inspect internal members when the behavior cannot be verified meaningfully through public state and actions.

## Required verification

- Always execute the relevant focused tests while implementing or reviewing a change; do not rely only on static inspection or previously reported results.
- Always run `npm run lint` after source or configuration changes and resolve all errors and warnings before handing off the work. This is also included by `npm run typecheck` and must remain enabled there.
- Before handing off completed code changes, run `npm run typecheck`, `npm run build`, and `npm run test:coverage` unless the change is strictly non-code documentation with no effect on examples, configuration, or generated output.
- Run `npm run test:types` whenever public types, overloads, inference, exports, or IntelliSense-facing declarations change. This is also included by `npm run typecheck` and must remain enabled there.
- Run `npm run test:package` whenever package metadata, build configuration, public exports, peer dependencies, or published artifact structure changes.
- Run `npm run test:browser` whenever `[formNode]`, native-control behavior, DOM events, accessibility attributes, `ControlValueAccessor` interoperability, or browser-specific behavior changes. Install the Playwright Chromium binary first when needed with `npx playwright install chromium`; `PLAYWRIGHT_USE_SYSTEM_CHROME=true npm run test:browser` may be used to verify against an installed Chrome browser.
- Treat a command that exits successfully without discovering the expected test files as a failed verification. Confirm that focused and browser runs report the intended files and a nonzero test count.
- If an environmental limitation prevents a required command from running, report the exact command, failure, and unverified scope explicitly instead of claiming the change is fully verified.
