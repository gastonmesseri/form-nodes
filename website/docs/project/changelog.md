---
title: Changelog
---

# Changelog {#changelog}

This page summarizes consumer-visible changes. The repository's
[complete changelog](https://github.com/gastonmesseri/form-nodes/blob/master/CHANGELOG.md) is the
canonical release record.

## 📦 Unreleased {#unreleased}

### Fixed

- Coordinate CVA value and disabled-state updates so enabling and setting a value in the same turn displays the latest value, including ng-bootstrap rating. Enabling also replays values that a control ignored while disabled; resets use the same synchronization order without emitting user changes.

- Refresh custom CVA views after model and disabled-state writes, including controls such as ng-bootstrap rating and timepicker that do not request a check themselves. This prevents stale rendering and expression-changed errors when enabling or disabling these controls.

- Restore CVA views on resets even when the value is unchanged, including ancestor resets and discarded pending input. Rebinding to an equal-valued node refreshes the CVA without carrying over an old draft; stale and destroyed bindings no longer participate in resets.

- Initialize CVA values and disabled state synchronously when `[formNode]` connects, so Angular Material radio groups display preloaded selections correctly, including inside nested custom controls and conditional views. Later model-to-view updates continue through the signal rendering cycle.

## 📦 3.4.0 — 2026-09-10 {#340--2026-09-10}

### Changed

- Use `.$api` as the single callable, collision-safe node API. The `.api` alias is removed; replace API accesses with `.$api`, while keeping ordinary child fields named `api`. This change is included in minor version 3.4.0 at the maintainer's request while the library has no other consumers.

### Added

- Read own and descendant validation errors with `errors({ descendants: true })` on any node. `allErrors()` remains its shortcut, while `errors()` keeps its existing own-error signal behavior and typing.

- Allow `form()` and `group()` with no arguments to create empty objects, and `array()` to create an empty collection of unknown-valued fields with null defaults. Configured factories support the same declarations and preserve their defaults.

### Fixed

- Support unannotated class self-references in parameterless `when` conditions across built-in and async validators while preserving typed contexts and checked boolean returns for context-taking conditions. Async conditions start safely after construction and restart validation when reenabled, even with unchanged values.

- Allow `requiredIf` conditions to reference their class form through a later declared computed without explicit type annotations. Form and computed types remain inferred; the condition's return type is intentionally unchecked, so consumers must return a boolean.

## 📦 3.3.0 — 2026-09-10 {#330--2026-09-10}

Released as a minor version. The incompatible nested value API migration is an explicit
versioning exception while the maintainer is the only consumer. See the
[version policy](./versioning.md#nested-value-api-exception).

### Added

- Add `formNodeSubmit` and `formNodeSubmitBlocked` outputs for native form attempts and validation-blocked attempts, with typed value, form, and original-event payloads. Pending input is flushed before notification; programmatic submissions remain callback-only.

- Added readonly `form.submitted()` to record submit attempts until the form is reset, including attempts blocked by validation or missing actions. Nested forms keep independent histories, and subtree resets clear descendant form histories. Added `useClosestForm()` to reactively observe the form owning the nearest injectable `[formNode]` binding, enabling submission-aware error components without event subscriptions.

### Changed

- Node `$api` objects and unshadowed `api` aliases are now callable Angular signals with collision-safe state and operations, typed by `CallableNodeApi`. Array APIs preserve `length()`. `useClosestForm()` now returns this API directly: replace `closestForm()?.$api.submitted()` with `closestForm()?.submitted()`; its calls still read the exposed form value.

- **Breaking:** Replaced public `controlValue()` and `setControlValue(value)` with `value.control()` and `value.control.set(value)`. Fields, groups, forms, and arrays now expose `value.committed()` for committed data before configured equality checks, and `value.committed.set(value)` for immediate writes equivalent to `set(value)`. Control writes preserve debounce and dirty tracking; neither setter emits binding outputs by itself. Exported `NodeValueSignal` describes these nested signals and hides native function members from IntelliSense on all three views. Bare `FieldNode` annotations retain the nested reads and setters; explicit value generics preserve their precise types.

## 📦 3.2.0 — 2026-09-09 {#320--2026-09-09}

### Added

- Added `resetToInitial()` to fields, groups, forms, and arrays. It restores captured initial values, clears subtree interaction state, and cancels pending control input without emitting control-originated value outputs. Object schemas are preserved; arrays restore their initial records through reconciliation. Supported data containers are copied, while opaque instances retain their references.

## 📦 3.1.0 — 2026-09-09 {#310--2026-09-09}

### Added

- Added typed `formNodeControlValueChange` and `formNodeValueChange` outputs to `[formNode]` for immediate control values and committed values after debounce or flush. Native controls, CVAs, signal controls, and enabled input/output pairs share this contract; programmatic node writes and cancelled or obsolete pending notifications do not emit. Duplicate native parsed values do not repeat notifications or restart debounce.

### Fixed

- Restored initial string-literal suggestions for explicit union types such as `field<IborCode>(...)`, including nullable and configured factories. Invalid values remain type errors, and null/undefined inference is preserved.

- Custom signal controls and enabled input/output pairs now update node values, parent values, synchronous validation, and touched state before consumer `valueChange`, `checkedChange`, and `touch` template handlers run. Debounce and consumer resets remain respected, including controls that inject `NgControl`, `FORM_NODE`, or `FormNodeDirective` during construction. CVA and pass-through transports retain their ownership, and native DOM events with custom-output names do not update the custom model.

## 📦 3.0.2 — 2026-09-09 {#302--2026-09-09}

### Fixed

- Native `[formNode]` bindings now process user input before template event handlers, so handlers can read the updated node value, parent value, and synchronous validation. Blur handlers observe the updated touched state; configured debounce and IME buffering remain respected, and resets inside handlers are no longer overwritten by a late input update. Native value listeners remain isolated from CVAs, custom controls, and pass-through bindings, including custom outputs with DOM event names.

## 📦 3.0.1 — 2026-09-09 {#301--2026-09-09}

### Fixed

- `useFormNodeState().required()` and its equivalent required-validator queries now also recognize an active own `required` error on every supported binding. Custom, composed, asynchronous, and manual errors can drive the required indicator without a directly registered required validator; the fallback clears when the error disappears.

## 📦 3.0.0 — 2026-09-08 {#300--2026-09-08}

### Changed

- **Breaking:** Renamed the common `Node` type to `AnyNode`, concrete `Field`, `Group`, and `Form` types to `FieldNode`, `GroupNode`, and `FormNode`, and the Angular `FormNode` directive/binding type to `FormNodeDirective`. `ArrayNode`, primitive factories, and `[formNode]` retain their names. `isFormNode()` now narrows to `AnyNode`. `FieldNode`, `GroupNode`, `FormNode`, and `ArrayNode` now accept omitted generic arguments for components and utilities handling unspecified values or structures; explicit arguments retain precise typing. Added `FormNodesModule` as an optional Angular import point that re-exports `FormNodeDirective` without configuring providers.

### Added

- Added `isFormNode(value)` to recognize field, form, group, and array nodes and narrow unknown values to `AnyNode` without evaluating them.

### Fixed

- Generic node APIs now expose optional `message` and binding metadata on errors returned by `errors()`, `allErrors()`, and `getError()`, matching concrete node error types.

## 📦 2.0.0 — 2026-09-08 {#200--2026-09-08}

### ◆ Changed {#changed}

- **Breaking:** Replaced the `ValidationError` namespace with directly exported types: `ValidationErrorForKind`, `ValidationErrorWithTargetNode`, `ValidationErrorWithOptionalTargetNode`, `ValidationErrorWithoutTargetNode`, and `ValidatorError`. Update qualified type references and imports; error shapes and validation behavior are unchanged.

- Validator results now ignore malformed errors and accidentally returned nodes with development-only warnings, preserving valid errors in mixed-validity arrays. Error objects require a string `kind`. Validators can also return message strings, normalized to `{ kind: 'custom', message }`, including empty strings and arrays mixing messages with error objects. The same filtering applies to resolved asynchronous and `onError` results without leaving validation pending. Ignored results do not block the form.

- Empty `form({})` and `group({})` declarations now type `forEachChild()` callbacks as `DynamicNode`, so operations such as `child.set('')` compile. Visiting added children still requires `includeDynamic: true`; nonempty declarations retain their concrete child union.

- Parameterless validator callbacks, including inline `validator()` and `asyncValidator()` callbacks, can reference their own class form without return annotations, preserving field and aggregate inference across primitive options, positional validators, and configured factories. Their return type is intentionally unchecked (including zero-argument overloads); context-taking callbacks and parameterized asynchronous validators keep their checked contracts. Option-object keys remain available in editor completion for all primitives. Initial setup for mixed synchronous and asynchronous rules is deferred so they can safely read the form after its class property is assigned; synchronous errors still suppress asynchronous execution.

- Validator queries on nodes and `useFormNodeState()` retain up to 32 reference/resolve combinations to reduce cache eviction when querying many rules; error queries retain their 20-entry limits.

- **Breaking behavior/API change:** `bindInputOutputPairs: true` now independently enables separate value/valueChange and checked/checkedChange connections. False/null pauses the complete pair connection, including state writes, touch/focus/reset hooks, and writable node access. SyncInputs no longer enables values; empty lists do nothing. Models, CVAs, and native controls retain their standard connections.

- **Breaking behavior/API change:** experimental `syncInputs` now selects only state/constraint inputs: false, 'declared', 'all', 'signal-controls', exact lists, or `{ inputs, target }`. Targets are all, signal-controls, and cva; CVA precedence is preserved on hybrid components. True and the earlier presets/mode objects are replaced by explicit selections. Declared includes initial disabled/readonly/hidden options, excluding validators. Both binding options default to false and inherit independently through nodes, factory defaults, providers, and global configuration. Validation is unchanged.

- **Breaking API change:** `configureGlobalFormNodes({ validatorMessages, classes, syncInputs })` replaces `configureGlobalValidatorMessages()`. Global options update independently below Angular providers; binding defaults are captured on connection, while global messages remain reactive. Cleanup callbacks preserve later overrides and skip already cleaned-up configurations.

- **Breaking API change:** `provideFormNodesConfig({ validatorMessages, classes, syncInputs })` replaces `provideValidatorMessages()` and `provideFormNodeConfig()`; `FormNodesConfig` replaces `FormNodeConfig`. Message factories retain injection and reactive message support, and the unified provider also works in component providers. All options inherit independently; configuring input synchronization preserves inherited classes, and configuring or clearing classes preserves synchronization. Explicit class maps replace rather than merge with inherited maps; an empty configuration is a no-op.

- **Breaking behavior change:** `forEachChild()` on forms and groups now visits only declared children by default. Pass `{ includeDynamic: true }` as its second argument to include children added with `add()` and receive `DynamicNode` callbacks. Runtime boolean options also use `DynamicNode`. Empty declarations require the option to visit their children; default callbacks use `DynamicNode`.

### ◆ Added {#added}

- `useFormNodeState().hasValidator()` supports equivalent Form Nodes/Angular required queries and direct synchronous/asynchronous validator references where available, with reactive updates, opt-in `{ resolve: true }` composition queries for `[formNode]`, and `undefined` for unsupported or disconnected queries. Its queries and `hasError()` / `getError()` now use bounded memoization to avoid recomputing consumers when results are unchanged.

- `useFormNodeState()` exposes reactive `hasError(kind)` and `getError(kind)` queries for every supported binding, returning normalized error presence and the first matching error object without traversing child paths.

- `useFormNodeState()` recognizes direct Angular `Validators.requiredTrue` and exposes numeric, length, and pattern constraints declared through standard Angular validator directives, including dynamic changes while valid.

- Each `provideFormNodesConfig()` option accepts `null` to reset only that option: no automatic classes, input synchronization disabled, or an empty provider message catalog with normal fallback. Omitted options and `undefined` still inherit.

- `provideFormNodesConfig({ validatorMessages })` accepts a message catalog object directly as well as an injectable factory. Both forms retain reactive message callbacks and the same message precedence.

- `validators({ resolve: true })` and `hasValidator(validator, { resolve: true })` inspect final validator references reached through synchronous compositions, share validation evaluation, and react to composition dependencies. Default queries retain direct-registration semantics; async validators are listed without starting their work.

### ◆ Fixed {#fixed}

- Custom-control model binding resolves public aliases and requires input/output metadata for the same model property, preventing internal signals from being selected as value models.

- `useFormNodeState().required()` now detects Angular `Validators.required` and active required directives with `[formControl]`, `[formControlName]`, and `[(ngModel)]`, including dynamic and silent updates even when the value is valid.

- Form and group `children` maps accept arbitrary runtime keys while preserving exact declared-property types. With `noUncheckedIndexedAccess`, missing-key lookups are optional. `Object.values(children)` includes `DynamicNode` in its element type to account for added children; use `forEachChild()` for the precise declared-child union.

## 📦 1.1.0 — 2026-09-07 {#110--2026-09-07}

### ◆ Changed {#changed-1}

- **Breaking type change:** form and group `children` maps now expose only declared keys in TypeScript, so `Object.values(children)` infers the union of declared child types without `undefined`. Use `get(key)` or the result of `add()` for dynamic access. Runtime maps still contain dynamically added nodes, which are not represented in this static union. `forEachChild()` uses the same declared-child union; use `get(key)` inside the callback when handling arbitrary dynamic node types.

### ◆ Added {#added-1}

- All primitive nodes now expose reactive `hasError(kind)` queries for their own errors and `hasValidator(validator)` queries for directly registered validator functions, including async validators.

- Forms and groups now provide `forEachChild((child, key) => ...)` to visit a snapshot of immediate children with the union of declared child types and reactive tracking of structural changes. Runtime iteration also includes dynamically added nodes, whose types are outside that static union.

## 📦 1.0.1 — 2026-09-07 {#101--2026-09-07}

### ◆ Fixed {#fixed-1}

- Fields, forms, groups, and arrays now satisfy Angular `Signal<T>` and are recognized by `isSignal()`, so they can be passed directly to signal-based utilities while preserving value inference and reactive updates.

## 📦 1.0.0 — 2026-09-07 {#100--2026-09-07}

First public release of `@ngblocks/form-nodes`, establishing the stable public API. Supports Angular `^21.0.7 || ^22.1.5`.

### ◆ Fixed {#fixed-2}

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

### ◆ Added {#added-2}

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

### ◆ Changed {#changed-2}

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

## 📦 Changelog categories {#changelog-categories}

Each release uses the categories that apply:

- **Added** for new consumer-facing capabilities.
- **Changed** for behavior or API changes.
- **Deprecated** for APIs scheduled for removal.
- **Removed** for removed APIs.
- **Fixed** for corrected behavior.
- **Security** for security-related changes.

Breaking changes include a direct link to their corresponding
[migration instructions](./migrations.md).
