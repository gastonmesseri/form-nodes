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

## Helpers

- Keep a companion utility file beside its implementation: `form.utils.ts` beside `form.ts`, and `form-node.utils.ts` beside `form-node.directive.ts`.
- Put other feature-specific helpers in that feature's `utils/` directory. For example, `primitives/utils/create-control-value-buffer.ts` serves the primitive implementations.
- Use `lib/utils/` when a helper is general-purpose or supports multiple features. Choose ownership from its responsibility and consumers, not its filename alone.
- Add folders when they clarify a responsibility; avoid extra layers or one folder per file merely for symmetry.

## Tests and documentation

- Keep tests for a specific implementation beside it as `*.spec.ts`.
- Put tests spanning several implementations in the feature's `tests/` directory, such as `validation/tests/reactive-validator-messages.spec.ts`.
- Keep public primitive behavior covered in `field.spec.ts` and `form.spec.ts`, even when helpers have focused tests.
- Use the root `tests/` directory for shared test helpers, public type contracts, integration fixtures, and performance checks.
- Keep contributor references in `docs/`, consumer documentation in `website/docs/`, and executable or typechecked documentation examples in `website/examples/`.
