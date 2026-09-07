# Project organization

Organize implementation code by responsibility directly under `src/lib/`:

| Directory | Responsibility |
| --- | --- |
| `primitives/` | Field, form, group, and array declarations, types, and state. |
| `validation/` | Validator execution, messages, metadata, and built-in `validators/`. |
| `form-node/` | The `[formNode]` directive and its control integration. |
| `form-node-state/` | Shared `useFormNodeState()` access and source-specific `adapters/`. |
| `metadata/` | Node metadata storage and access. |
| `types/` | Contracts shared across features. Keep feature-specific types with their feature. |
| `utils/` | General helpers and infrastructure shared across features. |

`src/public-api.ts` defines the package exports. Internal modules use direct relative imports.

`primitives/field.ts` owns the public field overloads, nullability shortcuts, and the distinction
between omitted and explicitly undefined initial values. It resolves validators and options, then
passes them to `createFieldNode()` in `field-node.ts`. The internal `FieldNode` class owns signals and operations and
assembles the callable node. The class is not exported from the package; node actions remain safe
to pass as callbacks, and scheduled debounce work uses weak ownership.
Callers use `FieldNode.getNode()` to retrieve the already assembled node. Its implementation members use plain names without `private`
or `readonly` modifiers; `_` prefixes remain on the existing node API's internal hooks.
Mutable local state uses names such as `selfTouched` and `selfDirty`; the corresponding computed
properties use the node's public names, `touched` and `dirty`.
See the [primitive state refactor guide](primitive-state-refactor.md) for the migration checklist,
the completed migrations and their decisions.

`primitives/array.ts` likewise keeps its public overloads, resolves templates, factories, initial
contents, validators, and options, and passes them to `createArrayNode()` in `array-node.ts`.
`ArrayNode` owns item creation,
reconciliation, aggregate state, and callable proxy assembly. Both factories expose `getNode()` and
keep clone recipes in `createClone()` methods that capture configuration without retaining the source
instance. `array.utils.ts` contains validator-source detection for positional arguments and the
object-template assertion shared by the public primitive and class.
`primitives/form.ts` and `group.ts` retain their public overloads, resolve validators and options,
and delegate to `createFormGroupNode()` in `form-group-node.ts`. That entry constructs
`FormGroupNode`, which owns object children, aggregate state, dynamic edits, validation, control
bindings, and callable assembly. The same entry accepts the custom normalizer used by
`createFormPrimitives()` for initial children, later additions, and clones.

Keep each construction entry beside its class and limit its body to `new …Node(...).getNode()`.
Public primitives own overloads, inference, and argument interpretation; configured primitives
also resolve their defaults before calling these entries. Classes own live node state. Clone
recipes retain their direct constructor calls and capture only declarative configuration.

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

## FormNode control adapters

`form-node/form-node.directive.ts` coordinates binding ownership, control-state registration,
focus, CSS classes, and native form submission/reset. Control-specific connections live in
`form-node/adapters/`:

| Module | Responsibility |
| --- | --- |
| `control-adapter.ts` | Shared binding context and connection result. |
| `resolve-control-adapter.ts` | Select the connection for the host. |
| `native-control/` | Native input events, value parsing/rendering, composition, radio/select updates, and browser validity. |
| `control-value-accessor/` | ControlValueAccessor callbacks, disabled state, accessor selection, and host validators. |
| `signal-forms-control/` | FormValueControl/FormCheckboxControl-compatible components, model connections, and experimental paired input/output connections. |
| `sync-control-inputs.ts` | Experimental state/constraint input synchronization shared by CVA and custom controls. |

The resolver preserves the existing precedence: an accessor supplied by `NgControl`, then an
accessor selected from `NG_VALUE_ACCESSOR`, then a recognized custom control, then a native
control. Both accessor discovery paths use the same CVA adapter. `form-node-ng-control.ts`
remains the Angular compatibility facade outside the adapters.

Within `signal-forms-control/`, `model-transport.ts` connects through public model operations.
`paired-transport.ts` connects paired inputs and outputs, with activity gated by `syncInputs`
in `custom-control-adapter.ts`. Optional state/constraint writes use the separate shared
input synchronizer. The Angular input-writing implementation remains isolated in
`form-node/angular-internals/component-input-writer.ts`.

Adapters read the current node through the binding, so rebinding does not require replacing
the adapter. Effects, subscriptions, and DOM listeners use the host injector's lifetime.
`native-control/sync-native-control-state.ts` applies native attributes and accessibility state after
selection, skipping properties already handled as custom inputs. The directive retains
node-binding registration and injector leases. Native `<form>` hosts follow the directive's
submission/reset path instead of selecting a value adapter.

These modules are internal implementation boundaries, not a public adapter registration API.
The separation follows the native/CVA/custom responsibilities inspected in Angular Signal
Forms v22.1.5 (`468b65b74566537456c192ac4281795c5a1e1a5e`), while preserving Form Nodes' existing
public contracts and experimental opt-in behavior.

## Helpers

- Keep a companion utility file beside its implementation: `form-group-node.utils.ts` beside `form-group-node.ts`.
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
