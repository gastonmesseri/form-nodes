---
title: Changelog
---

# Changelog

This page summarizes consumer-visible changes. The repository's
[complete changelog](https://github.com/gastonmesseri/form-nodes/blob/master/CHANGELOG.md) is the
canonical release record.

## Unreleased

### Changed

- Validator queries on nodes and `useFormNodeState()` retain up to 32 reference/resolve combinations to reduce cache eviction when querying many rules; error queries retain their 20-entry limits.

- **Breaking behavior/API change:** `bindInputOutputPairs: true` now independently enables separate value/valueChange and checked/checkedChange connections. False/null pauses the complete pair connection, including state writes, touch/focus/reset hooks, and writable node access. SyncInputs no longer enables values; empty lists do nothing. Models, CVAs, and native controls retain their standard connections.

- **Breaking behavior/API change:** experimental `syncInputs` now selects only state/constraint inputs: false, 'declared', 'all', 'signal-controls', exact lists, or `{ inputs, target }`. Targets are all, signal-controls, and cva; CVA precedence is preserved on hybrid components. True and the earlier presets/mode objects are replaced by explicit selections. Declared includes initial disabled/readonly/hidden options, excluding validators. Both binding options default to false and inherit independently through nodes, factory defaults, providers, and global configuration. Validation is unchanged.

- **Breaking API change:** `configureGlobalFormNodes({ validatorMessages, classes, syncInputs })` replaces `configureGlobalValidatorMessages()`. Global options update independently below Angular providers; binding defaults are captured on connection, while global messages remain reactive. Cleanup callbacks preserve later overrides and skip already cleaned-up configurations.

- **Breaking API change:** `provideFormNodesConfig({ validatorMessages, classes, syncInputs })` replaces `provideValidatorMessages()` and `provideFormNodeConfig()`; `FormNodesConfig` replaces `FormNodeConfig`. Message factories retain injection and reactive message support, and the unified provider also works in component providers. All options inherit independently; configuring input synchronization preserves inherited classes, and configuring or clearing classes preserves synchronization. Explicit class maps replace rather than merge with inherited maps; an empty configuration is a no-op.

- **Breaking behavior change:** `forEachChild()` on forms and groups now visits only declared children by default. Pass `{ includeDynamic: true }` as its second argument to include children added with `add()` and receive `DynamicNode` callbacks. Runtime boolean options also use `DynamicNode`. Empty declarations require the option to visit their children; default callbacks have a `never` child type. `Object.values(children)` is unchanged.

### Added

- `useFormNodeState().hasValidator()` supports equivalent Form Nodes/Angular required queries and direct synchronous/asynchronous validator references where available, with reactive updates, opt-in `{ resolve: true }` composition queries for `[formNode]`, and `undefined` for unsupported or disconnected queries. Its queries and `hasError()` / `getError()` now use bounded memoization to avoid recomputing consumers when results are unchanged.

- `useFormNodeState()` exposes reactive `hasError(kind)` and `getError(kind)` queries for every supported binding, returning normalized error presence and the first matching error object without traversing child paths.

- `useFormNodeState()` recognizes direct Angular `Validators.requiredTrue` and exposes numeric, length, and pattern constraints declared through standard Angular validator directives, including dynamic changes while valid.

- Each `provideFormNodesConfig()` option accepts `null` to reset only that option: no automatic classes, input synchronization disabled, or an empty provider message catalog with normal fallback. Omitted options and `undefined` still inherit.

- `provideFormNodesConfig({ validatorMessages })` accepts a message catalog object directly as well as an injectable factory. Both forms retain reactive message callbacks and the same message precedence.

- `validators({ resolve: true })` and `hasValidator(validator, { resolve: true })` inspect final validator references reached through synchronous compositions, share validation evaluation, and react to composition dependencies. Default queries retain direct-registration semantics; async validators are listed without starting their work.

### Fixed

- Custom-control model binding resolves public aliases and requires input/output metadata for the same model property, preventing internal signals from being selected as value models.

- `useFormNodeState().required()` now detects Angular `Validators.required` and active required directives with `[formControl]`, `[formControlName]`, and `[(ngModel)]`, including dynamic and silent updates even when the value is valid.

- Empty `form({})` and `group({})` declarations now infer `DynamicNode[]` for `Object.values(children)`, supporting records populated with `add()`. Nonempty declarations retain their concrete child unions; `get(key)` still accounts for missing children.

## 1.1.0 — 2026-09-07

### Changed

- **Breaking type change:** form and group `children` maps now expose only declared keys in TypeScript, so `Object.values(children)` infers the union of declared child types without `undefined`. Use `get(key)` or the result of `add()` for dynamic access. Runtime maps still contain dynamically added nodes, which are not represented in this static union. `forEachChild()` uses the same declared-child union; use `get(key)` inside the callback when handling arbitrary dynamic node types.

### Added

- All primitive nodes now expose reactive `hasError(kind)` queries for their own errors and `hasValidator(validator)` queries for directly registered validator functions, including async validators.

- Forms and groups now provide `forEachChild((child, key) => ...)` to visit a snapshot of immediate children with the union of declared child types and reactive tracking of structural changes. Runtime iteration also includes dynamically added nodes, whose types are outside that static union.

## 1.0.1 — 2026-09-07

### Fixed

- Fields, forms, groups, and arrays now satisfy Angular `Signal<T>` and are recognized by `isSignal()`, so they can be passed directly to signal-based utilities while preserving value inference and reactive updates.

## 1.0.0 — 2026-09-07

First public release of `@ngblocks/form-nodes`, establishing the stable public API. Supports Angular `^21.0.7 || ^22.1.5`.

### Fixed

- Angular 21 consumers can now install Form Nodes on Node.js 20.19.0+, 22.12.0+, and 24.0.0+ within those majors without an engine mismatch. Angular 22 retains its higher Node.js requirements.

- `[formNode]` now recognizes CVAs assigned directly through an injected `NgControl.valueAccessor`. Method-wrapping state hooks also observe values, errors, status, and interaction changes across node edits, async validation, reset, and rebinding without rerunning validators.

- Library console warnings now appear only in Angular development mode, including ignored keys/indexes,
  unsupported reset options, and custom-control input synchronization diagnostics.

- `[formNode]` now supports CVAs that subscribe to an injected `NgControl`: value/status streams
  and Angular control-state events follow the bound node, survive rebinding, and complete on destruction.
  CVAs can also report parsing errors through `control.setErrors()`: binding-owned errors affect node
  and ancestor validity and clear independently of configured validators on correction, reset, or detachment.
  `getError()` and `hasError()` expose these error payloads and support relative descendant paths.
  Injected `NgControl.name` and `path` now follow the bound node’s structural location through
  array moves, detachment, reattachment, and rebinding.
  CVAs can reset the bound subtree through `NgControl.reset()` or `control.reset()`, preserving
  node reset semantics and supporting local notification suppression with `{ emitEvent: false }`.
  Unsupported `onlySelf` and `overwriteDefaultValue` reset options warn and are ignored instead of interrupting reset.
  `validator` and `asyncValidator` now explicitly return `null` on both adapter surfaces: no Angular
  validator functions are exported; node validation remains observable through errors, pending, and status.
- `useFormNodeState().value()` with `[formNode]` now reports the latest committed value even when
  node equality retains an older public value. Pending debounce input remains separate.
- Asynchronous validators preserve pending work when a computed dependency compares equal, while
  continuing to react to later value changes.
- Nested forms, groups, and populated arrays can now be constructed inside `computed()`. Declaration
  inputs remain reactive, while internal initialization no longer makes node edits rebuild the tree.
- Pending or cancelled control-value debounce work no longer retains otherwise unreachable fields,
  forms, groups, arrays, or their parent trees through timers and custom debounce promises.
- Compiled array templates no longer retain their source fields, forms, groups, arrays, or parent
  trees through clone callbacks. Later items still use the declared values, validators, and options.

### Added

- The npm package now provides repository, issue-reporting, and author links, clearer search metadata, and a bundled changelog.

- `provideFormNodeConfig({ syncControlInputs: false })` lets custom components and consumer templates own state and constraint inputs while retaining value/checked synchronization, interaction hooks, native controls, and CVA disabled-state callbacks. Automatic input synchronization remains enabled by default.

- `field()`, `form()`, `group()`, and `array()` accept shallow, deep, or custom equality for exposed values,
  validation, update callbacks, and submission. Public parents compose exposed child values;
  internal writes, reset, controls, and debounce remain independent. Equality is evaluated lazily,
  and comparator errors affect exposed reads after writes have committed. Array structure and
  keyed reconciliation continue updating even when the exposed collection compares equal.
- `FormNodeValue<typeof node>` extracts the committed value type of any form, group, array, or
  field, preserving nested objects, arrays, and field nullability.
- A reactive `root()` signal on every node returns the complete structural
  root, including standalone fields, groups, forms, and arrays.
- An `error` option on every built-in validator for replacing a failed rule's standard error with
  one or more static or reactively produced custom errors.
- `field.strict()` and `field.nullable()` provide concise local nullability overrides on package
  and configured field factories.
- `createFormPrimitives()` creates isolated form primitive factories with optional defaults for field
  nullability, validator messages, and injector inheritance policies.
- `FormValueContract<TValue>` checks an inferred form or group against a named aggregate value with
  `satisfies` while preserving concrete child-node types such as `ArrayNode`.
- A complete consumer documentation website with tutorials, API reference, recipes, integration
  guides, and executable examples. The unfinished interactive playground remains deferred.
- Typed `field()`, `form()`, `array()`, and `group()` signal-based primitives.
- Synchronous and asynchronous validation with reactive, configurable messages.
- Angular `[formNode]` binding for native, signal-based, and `ControlValueAccessor` controls.

### Changed

- **Breaking:** Form submission options are now flat: use `onSubmit(value, form)`, `onSubmitBlocked(form)`, and `submitWhen` instead of `submission`. The default still allows pending validation; use `'valid'` to require valid state or `'always'` to bypass the validation gate. The standalone `FormSubmissionOptions` type is removed; use `FormOptions`.

- Package and documentation links now target `gastonmesseri/form-nodes`, and the documentation site uses the `/form-nodes/` base path.

- **Breaking:** Rename `useControlState()` to `useFormNodeState()`. Update imports and calls; the returned `ControlState` types and supported bindings are unchanged.

- Support Angular `^21.0.7 || ^22.1.5`, building the library with Angular 21 and TypeScript 5.9.
  Custom-control types now expose the Form Nodes contract consistently across both majors.
- **Breaking:** Remove the `$field` adapter. Bind Form Nodes with `[formNode]="node"` instead of
  `[formField]="node.$field"`. `provideFormNodeConfig()` now configures `[formNode]` only and can
  coexist with Angular's class configuration. `useFormNodeState()` still observes independently
  created Angular Signal Forms, Reactive Forms, and template-driven controls.

- The npm package is published as `@ngblocks/form-nodes`. Use the scoped name in dependencies,
  imports, and module augmentations; exported APIs and runtime behavior are unchanged by the rename.

- Callable field objects now include a runtime `patch()` method equivalent to `set()`. The public
  types continue to expose field patching only through `api` and `$api`.

- Separately declared validators now preserve their declared value type when reading through
  `context.field()` or `context.node()`, including the node's value signal and API aliases.

- Inline validators now infer their owning `Field`, `Form`, `Group`, or `ArrayNode`, including
  aggregate children and array items. This also works through inline `validator()` and
  `asyncValidator()` helpers, with configured primitives and nullability overrides. IntelliSense
  shows the expanded model for inline `context.value()` reads, matching the node value signal.
- Validator contexts expose the validated node through the same readonly signal under `node` and
  `field`. Use `context.node()` (or `context.field()`) for the node and `context.value()` for its
  value. Flat `context.form()` and `context.root()` have been removed; use `context.node().form()`
  and `context.node().root()` instead. Interaction, availability, required, and submission state
  signals also move from the flat context to the node, such as `context.node().touched()` and
  `context.node().disabled()`. This applies to synchronous validators and every asynchronous
  callback. Access the API through `context.node().api` or `context.field().api` instead of
  `context.api`; inline validators retain the concrete node API. `parent()` remains available on
  the context.

- `form()` returns the nearest explicit form workflow instead of the complete structural root.
  Nested forms own their descendants, while standalone fields, groups, and arrays return `null`;
  use `root()` when the outermost node is required.
- `field(undefined)` preserves `undefined` as its initial value, while an omitted initial value
  continues to start at `null`. Explicitly typed calls include `undefined` in the field value type.
  A no-argument `field()` from `createFormPrimitives({ nullable: false })` now also typechecks as
  `Field<unknown>`, matching its existing `null` initial value.
- Field-level `nullable` options have been removed. Use `field.strict()` or `field.nullable()` for
  local nullability choices; `createFormPrimitives({ nullable })` remains the factory-wide default.
- Form and group callable values display their complete nested object shape in IntelliSense rather
  than internal value and normalization helper types.
- Nested object shorthand and object templates in `array()` now create structural `Group` nodes.
  `Form` is reserved for explicit submission workflow boundaries.
- Object shorthand validates the complete declaration before construction, reports nested error
  paths, and rejects enumerable accessors, symbol child keys, and `__proto__`. Inherited and
  non-enumerable properties are ignored, and diagnostics recommend `field(value)` when an object
  was intended to remain an atomic field value.
- `form.add()` and `group.add()` accept the same field and nested-group shorthands as initial
  declarations through both the single-child and atomic batch signatures, with aligned runtime and
  TypeScript normalization.
- `array()` object templates and object-template factories accept field shorthands such as
  `{ name: '', age: 0 }`, producing independently cloned groups and fields with matching TypeScript
  inference.
- Array values in `form()`, `group()`, dynamic `add()`, and `array()` object templates consistently
  become atomic `Field` nodes. Only an explicit `array(...)` creates a dynamic collection, so the
  inferred node never depends on array length or contents. Empty mutable array shorthands infer
  `unknown[]` instead of `never[]`.

## Changelog categories

Each release uses the categories that apply:

- **Added** for new consumer-facing capabilities.
- **Changed** for behavior or API changes.
- **Deprecated** for APIs scheduled for removal.
- **Removed** for removed APIs.
- **Fixed** for corrected behavior.
- **Security** for security-related changes.

Breaking changes include a direct link to their corresponding
[migration instructions](./migrations.md).
