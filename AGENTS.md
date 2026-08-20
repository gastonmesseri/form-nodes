# Project instructions

- Use English throughout the entire project.
- Write all source code, identifiers, comments, documentation, tests, commit-facing text, warnings, errors, and generated user-facing copy in English.
- Keep new and updated files in English even when the conversation with the user is in another language.
- `form()` and `field()` must never require an Angular injection context to work correctly. They must remain safe to declare and use anywhere, including outside components, directives, services, constructors, and `runInInjectionContext()`.
- Do not introduce `inject()`, injection-context-dependent effects, or any implicit dependency on Angular dependency injection into these functions or their required execution paths.
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

## Import style

- Separate third-party imports from project imports with exactly one blank line.
- Keep third-party imports in the first group and project imports in the second group.
- Sort imports within each group by ascending length of the complete import line, from shortest to longest.
- Keep every import on a single line. Do not use multiline imports, including imports with several named symbols.

## Type API style

- Declare signals and other stateful values as properties in public object types.
- Declare actions and operations with method syntax in public object types so editors distinguish state from behavior in IntelliSense.
