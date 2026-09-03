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

`primitives/field.ts` owns the public field overloads, nullability shortcuts, and the distinction
between omitted and explicitly undefined initial values. It delegates validator/option resolution
to `createFieldNode()` in `field-node.ts`. The internal `FieldNode` class owns signals and operations and
assembles the callable node. The class is not exported from the package; node actions remain safe
to pass as callbacks, and scheduled debounce work uses weak ownership.
Callers use `FieldNode.getNode()` to retrieve the already assembled node. Its implementation members use plain names without `private`
or `readonly` modifiers; `_` prefixes remain on the existing node API's internal hooks.
Mutable local state uses names such as `selfTouched` and `selfDirty`; the corresponding computed
properties use the node's public names, `touched` and `dirty`.
See the [primitive state refactor guide](primitive-state-refactor.md) for the migration checklist,
the completed migrations and their decisions.

`primitives/array.ts` likewise keeps its public overloads and delegates to `createArrayNode()` in
`array-node.ts`, which resolves templates, factories, initial contents, validators, and options.
`ArrayNode` owns item creation,
reconciliation, aggregate state, and callable proxy assembly. Both factories expose `getNode()` and
keep clone recipes in `createClone()` methods that capture configuration without retaining the source
instance. `array.utils.ts` contains validator-source detection for positional arguments and the
object-template assertion shared by the construction entry and class.
`primitives/form.ts` and `group.ts` retain their public overloads and delegate to the shared
`createFormGroupNode()` entry in `form-group-node.ts`. It resolves validators and options and constructs
`FormGroupNode`, which owns object children, aggregate state, dynamic edits, validation, control
bindings, and callable assembly. The same entry accepts the custom normalizer used by
`createFormPrimitives()` for initial children, later additions, and clones.

Keep each construction entry beside its class. Public declaration files retain overloads and
inference, construction entries prepare their arguments, and classes own live node state. Clone
recipes call constructors directly because their configuration is already resolved.

`FormGroupNode` serves both forms and structural groups through an explicit `nodeType`. Only forms
expose `submit()` and establish their own owning-form boundary; groups inherit the nearest form
and its submission state. Its `createClone()` captures child recipes and configuration without
retaining the source instance. The name also distinguishes it from the `[formNode]` directive.

The implementation classes are named `FieldNode`, `ArrayNode`, and `FormGroupNode`; none is a package export.
The existing public `ArrayNode` type still describes the callable node. Modules that also use the
implementation class import that public type locally as `ArrayNodeType` to distinguish the two.

Assemble callable nodes with `Object.defineProperties()` and the descriptors of the composed API
object. This shared pattern also handles function properties such as the array's `length` signal
and form children named `name` or `length`, which `Object.assign()` cannot overwrite directly.

## Helpers

- Keep a companion utility file beside its implementation: `form-group-node.utils.ts` beside `form-group-node.ts`, and `form-node.utils.ts` beside `form-node.directive.ts`.
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
- Keep local ESLint rules in `scripts/eslint-rules/` and their rule tests in `tests/eslint/`. The source lint configuration requires explicit returns for multiline arrow bodies except direct array/object literals; single-line expressions remain allowed.
- Keep contributor references in `docs/`, consumer documentation in `website/docs/`, and executable or typechecked documentation examples in `website/examples/`.
