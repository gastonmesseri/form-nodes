# Project organization

Organize implementation code by responsibility directly under `src/lib/`:

| Directory | Responsibility |
| --- | --- |
| `primitives/` | Field, form, group, and array declarations, types, and state. |
| `validation/` | Validator execution, messages, metadata, and built-in `validators/`. |
| `form-node/` | The `[formNode]` directive and its control integration. |
| `control-state/` | Shared control-state access and source-specific `adapters/`. |
| `interop/` | The Angular Signal Forms adapter used by `$field`. |
| `metadata/` | Node metadata storage and access. |
| `types/` | Contracts shared across features. Keep feature-specific types with their feature. |
| `utils/` | General helpers and infrastructure shared across features. |

`src/public-api.ts` defines the package exports. Internal modules use direct relative imports.

`primitives/field.ts` owns the public field overloads, argument normalization, and nullability
shortcuts. Its internal `FieldState` class in `field-state.ts` owns the signals and operations and
assembles the callable node. The class is not exported from the package; node actions remain safe
to pass as callbacks, and scheduled debounce work uses weak ownership.
Callers use only `FieldState.node`. Its implementation members use plain names without `private`
or `readonly` modifiers; `_` prefixes remain on the existing node API's internal hooks.
Mutable local state uses names such as `selfTouched` and `selfDirty`; the corresponding computed
properties use the node's public names, `touched` and `dirty`.
See the [primitive state refactor guide](primitive-state-refactor.md) for the migration checklist,
the field prototype's decisions, and the remaining readability work.

## Helpers

- Keep a companion utility file beside its implementation: `form.utils.ts` beside `form.ts`, and `form-node.utils.ts` beside `form-node.directive.ts`.
- Put other feature-specific helpers in that feature's `utils/` directory. For example, `primitives/utils/create-control-value-buffer.ts` serves the primitive implementations.
- Use `lib/utils/` when a helper is general-purpose or supports multiple features. Choose ownership from its responsibility and consumers, not its filename alone.
- Add folders when they clarify a responsibility; avoid extra layers or one folder per file merely for symmetry.

## Tests and documentation

- Keep tests for a specific implementation beside it as `*.spec.ts`.
- Put tests spanning several implementations in the feature's `tests/` directory, such as `validation/tests/reactive-validator-messages.spec.ts`.
- Keep public primitive behavior covered in `field.spec.ts` and `form.spec.ts`, even when helpers have focused tests.
- Keep fixtures used only by a feature test beside that test as `*.fixture.ts`. They participate in source type checking but are excluded from the library build and production-code coverage.
- Use the root `tests/` directory for shared test helpers, public type contracts, project-level integration fixtures, and performance checks.
- Keep command-line automation in the root `scripts/` directory, invoked through `package.json`. These scripts prepare or run checks, including Angular fixture compilation, template type checking, type-performance measurement, and package-consumer verification. Keep project-level test cases, fixtures, and shared helpers in `tests/`; feature-specific fixtures belong beside their tests in `src/`.
- Keep contributor references in `docs/`, consumer documentation in `website/docs/`, and executable or typechecked documentation examples in `website/examples/`.
