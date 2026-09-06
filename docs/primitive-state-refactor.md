# Primitive state refactor guide

The primitive migrations move implementation state and operations into internal classes while
preserving the existing callable public API. `FieldNode` owns fields, `ArrayNode` owns arrays, and
`FormGroupNode` shares form/group logic. The goal is easier reading and maintenance. Use the checklist
below for future refactors; a separate class for every primitive is not a requirement.

## Field prototype roadmap

- [x] Keep public overloads, argument normalization, and nullability helpers in `field.ts` during
  the initial migration. The subsequent construction-entry extraction below moves validator/option
  resolution beside the class.
- [x] Move state, operations, and node assembly into `FieldNode`; callers retrieve the existing node through `getNode()`.
- [x] Preserve callable nodes, action aliases, callback-safe actions, and weak debounce ownership.
- [x] Use plain internal member names and a blank line between class members.
- [x] Group properties by responsibility: non-signal members first, writable signals together immediately before `getError`, then computed signals in a separate block immediately before the constructor.
- [x] Initialize argument-independent signals as members. After review, also declare the three availability signals with `false` defaults and apply their configured values in a narrow constructor `untracked()` block. Initialize the validator signal as a member with `[]` and populate it before validation setup. After further review, initialize value signals as members with temporary `undefined as TValue` storage and seed their actual values before context creation; verify both class-field emit modes.
- [x] Distinguish mutable `selfTouched`/`selfDirty` from computed `touched`/`dirty`, consistently with availability state.
- [x] Order methods so main operations precede their supporting helpers: value and interaction operations, validator management and its watcher, hierarchy and focus, debounce helpers, then node assembly.
- [x] Clarify node assembly names. The final assembly uses `publicApi` for shared node members and `internalApi` for that API plus internal hooks.
- [x] Align callable assembly with array and form/group using `Object.defineProperties()` and
  `Object.getOwnPropertyDescriptors()`. Preserve the field's descriptors and API aliases; array
  requires this pattern to replace the callable's built-in `length` with its public signal.
- [x] Extract custom debounce execution into `startCustomControlDebounce()` so `setControlValue()` shows the strategy selection directly. Preserve cancellation, synchronous failures, stale settlements, and weak callback ownership.
- [x] Normalize computed callback formatting: concise simple expressions and array literals, explicit return blocks for longer conditions and decisions, and consistent statement terminators.
- [x] Separate constructor phases with blank lines: prepare configuration, seed all signals in one
  `untracked()` block, create the context, prepare metadata and asynchronous validation, assemble and
  register the node, and start its watcher. Keep configuration reads outside `untracked()`.
- [x] Review the field prototype after the first readability pass. Verify public tests, type checking, build, coverage, emitted declarations, runtime API shape, and weak debounce ownership; record the next candidates below.

## Second readability audit

The first six readability changes and the four follow-up improvements below are complete.
That audit completed the field-only prototype. The subsequent array migration is recorded below.

- [x] Use `FieldApi<TValue>['root']` for the internal root assertion. This replaces the narrower
  `Signal<Field<TValue>>` assertion and reflects the existing contract, including aggregate roots.
- [x] Extract `registerControlBinding()` and `flushControlValueOnBlur()` so `createNode()` forwards
  those lifecycle operations. Keep simple one-line state setters inline.
- [x] Name the immediate numeric-debounce condition `isImmediate` inside `setControlValue()` so readers can
  distinguish unchanged values from delay handling without parsing one long boolean expression.
  Keep this as a local expression and preserve handling of zero, negative, and non-finite delays.
- [x] Rename the weak-reference member to `stateRef` and let `new WeakRef(this)` infer its type.
  Retain local weak-reference captures in scheduled callbacks.

Review findings and boundaries:

- Replacing the `form`, `root`, and `getError` assertions with ordinary property annotations fails
  isolated TypeScript checks. Their generic public contracts require more information than the
  implementation currently infers. Do not remove these assertions just to reduce syntax.
- Keep both asynchronous watcher references. The target is deliberately retained by the field
  because `createReactiveWatch()` keeps a weak reference to it; the watcher reference controls
  injector ownership. Combining or deleting them is not a cosmetic simplification.
- Use `getNode()` as the existing-instance access point after review. It returns the node already
  assembled during construction; `createNode()` remains responsible for that assembly.
- Use `FieldNode` for the internal class. The name emphasizes its role at the `field()`
  entry point: receive configuration and provide a callable field node. The instance also owns
  the node's signals and operations throughout its lifetime.
- Keep responsibility-based property groups instead of collecting all uninitialized properties
  at the top. Initialization order remains explicit in the constructor.
- At this stage, `group()` delegated to `createObjectNode()` in `form.ts`; the subsequent migration
  reviewed that shared boundary and moved it to `FormGroupNode` rather than separate form/group classes.

The naming and instance-access decisions are resolved as `FieldNode` and `getNode()`.
Their decision history remains recorded in [TODO.md](../TODO.md).
After completing the array migration, `FieldNodeFactory` and `ArrayNodeFactory` were renamed to
`FieldNode` and `ArrayNode`, with files `field-node.ts` and `array-node.ts`. The public `ArrayNode`
type keeps its name; implementation modules alias its import as `ArrayNodeType` where necessary.

## Third readability audit

The three follow-up items are complete. The ownership correction also required isolating the
existing form/group, array, and shorthand-object recipes. Those primitives were still function-based
at that stage; the subsequent array migration preserves the same ownership boundary.

- [x] Isolate clone recipes from live instances. The field, form/group, and array recipes use separate
  function scopes containing only declarative inputs, and shorthand-object recipes
  capture compiled child factories separately from the original definition. This fixes source-tree
  retention rather than merely changing formatting.
- [x] Rename the stored `validatorSource` constructor parameter to `initialValidatorSource` so its
  purpose is distinct from the mutable `validators` signal. `_clone` reuses the originally supplied
  source, not the source subsequently supplied to `setValidators()`. This is an original reference,
  not a deep-frozen snapshot.
- [x] Separate node members, public API, internal API, and callable-node assembly visually.
  The initial spacing between property groups inside `nodeMembers` was removed after review;
  keep that object compact. Blank lines between class members remain the convention.
- [x] Declare forwarding callbacks directly in `nodeMembers` and reuse `setControlValue` for
  `internalApi._setControlValue`. After review, include `patch` in `nodeMembers` as another
  forwarder to `set()`, and remove the now-redundant `publicApi` object. The callable field carries
  `patch` at runtime, while its public type still omits it; typed access remains on `api` and `$api`.
  `patch` and `set` now have separate forwarding functions with the same behavior.
- [x] Rename the remaining `nodeMembers` object to `publicApi`: it now contains the complete shared
  API, and `internalApi` extends it directly. The intermediate object remains unnecessary.

- [x] Complete the cross-node discriminant cleanup: the directive and Angular adapter use
  `$api.nodeType()` for capability selection. Remove the duplicate `_nodeType` property from
  field, form/group, array, and the internal type. Named children cannot shadow the `$api` path.

Clone-ownership evidence:

- A temporary Node experiment kept an array alive after releasing its field template and the
  template's parent form. Both objects remained reachable after forced collection, while a control
  field without retained callbacks was collected. Creating later array items still worked.
- The pre-class implementation showed the same retention. This is not a regression introduced by
  the class extraction, and it does not invalidate the separate pending-debounce ownership checks.
- An isolated experiment moved clone-callback creation into a function receiving only the original
  value, validator source, and clone options. The template and parent were then collected, and the
  array still created a new item with the declared initial value. Both class-field emit modes passed
  this experiment. It is evidence for the proposed fix, not a complete verification of all cloning.
- Permanent regression coverage runs isolated Node processes with forced collection in both
  class-field emit modes. It checks direct field, nested shorthand, form, group, and array source
  collection followed by future item creation. It also verifies original validators and debounce
  options, plus independent asynchronous validation and explicit-injector cleanup for a deliberately
  retained source. Application-owned values and callbacks keep their existing identity.

Angular `v22.1.5` source and node-identity tests were inspected as context. Gem's compiled-template
ownership promise is specified by `create-node-definition-factory.ts` and `docs/behavior.md`;
Angular node identity is not a substitute for that contract.

Keep `context` as the stable shared context: `createValidatorContext()` enriches that same object
in place. Renaming it to suggest it permanently contains only a value would be misleading.
No additional subcomponents, base classes, or generic API assembly are recommended by this audit.

## Availability signal initialization

`selfDisabled`, `selfReadonly`, and `selfHidden` are declared as class members initialized to
`false`. The constructor reads their options, then seeds those existing signals inside a narrow
`untracked()` block. It does this before metadata creation, asynchronous validation setup, node
registration, and watcher startup, so consumers and validators see the configured initial state.

Static booleans remain mutable initial state, and disabled messages (including an empty string)
remain intact. Reactive functions are not invoked when seeding these signals: the existing
availability computeds still evaluate them lazily and track their dependencies. Options are read
outside `untracked()` so a getter's signal reads still participate in the caller's computation.
The surrounding reactive consumer is restored when the initialization block returns.

Angular `v22.1.5` (commit `468b65b74566537456c192ac4281795c5a1e1a5e`) was inspected for this change:

- `packages/core/primitives/signals/src/signal.ts` checks whether writes are allowed before value
  equality, so even assigning `false` to a fresh `signal(false)` fails inside a computed callback.
- `packages/core/primitives/signals/src/graph.ts` governs that write permission, and `untracked.ts`
  temporarily clears and then restores the active reactive consumer.
- `packages/core/test/signals/computed_spec.ts` covers signal creation and prohibited writes inside
  computeds; `non_reactive_spec.ts` covers untracked reads and dependency isolation.
- `packages/forms/signals/src/field/state.ts` defines effective availability, while
  `packages/forms/signals/test/node/api/readonly.spec.ts` and `hidden.spec.ts` cover initial states,
  reactive changes, inheritance, and validation suppression. The `disabled` cases in
  `packages/forms/signals/test/node/field_node.spec.ts` cover reactive disablement and messages. Gem's imperative overrides and
  constructor options remain its existing API; this refactor does not alter those semantics.

The incremental experiment moved `selfDisabled` first: six public tests failed without `untracked()`
and passed with it. `selfReadonly` and `selfHidden` were then moved separately, with focused tests
passing after each step. Coverage includes construction inside computed callbacks, default states,
static overrides, disabled messages, lazy reactive sources, option-getter dependencies, validator
execution timing, and nested-form aggregation. The focused field and form suites also pass with
`useDefineForClassFields: true`; the normal configuration uses `false`.

## Validator and value signal initialization

`validators` is also declared as a member, with `signal<Validators<TValue>>([])`. The constructor
normalizes `initialValidatorSource`, copies clone options, and reads availability options outside
`untracked()`, preserving their relative order and dependency tracking. A single `untracked()` block
then assigns validators, committed/control values, and availability state before context creation,
metadata setup, asynchronous validation setup, node registration, and watcher startup.
The temporary empty list is never used to run validation.

Focused field tests check the first synchronous metadata/error read and the first asynchronous
validator invocation for both a single validator and an array. They verify the supplied initial
value, preserved object identity, pending transitions, and exact validator call counts, including
construction inside a computed. A form-level test covers first-run asynchronous validation and
aggregation through a nested form. Existing tests cover validator replacement, cancellation,
reactive dependencies, and template cloning.

After review, `value` and `controlValue` are also declared as members using
`signal(undefined as TValue)`. There is no universal domain default for an arbitrary `TValue`;
this cast explicitly marks temporary internal storage, not a consumer-visible default value.
The constructor immediately seeds both signals from `initialValue` inside `untracked()` before
creating the field context, metadata, asynchronous validation, or public node and before registering
any bindings or watchers. `getNode()` is called only after construction completes.

This ordering is the initialization invariant. Member computeds and the memoized error reader are
lazy and must not read either signal before the seeding block. Keep validation setup, registration,
and any future callback that can expose the node after that block. If construction throws, no node
is returned. The public signals keep their original `TValue` type, including strict fields, without
adding `undefined` to the public contract. An explicitly supplied `undefined` remains a valid actual
initial value under the existing overloads.

Public field tests exercise first value/control-value reads and the first validator observation
inside a computed for strings, zero, negative zero, NaN, false, null, undefined, objects, arrays, and
functions, followed by a buffered edit and reset. A nested-form test checks complete initial
aggregate values before its first validation. Existing tests verify first asynchronous validation,
cloning, cancellation, and control integration. Both class-field emit modes are verified.

An isolated experiment moved both initializers to members using `this.initialValue`. It compiled
and preserved the value with `useDefineForClassFields: false`; with `true`, TypeScript reported two
TS2729 diagnostics and a runtime assertion observed `undefined` instead of the supplied string.
Standard class-field initializers run before constructor parameter properties are assigned.
`untracked()` changes reactive tracking/write permissions, not that JavaScript initialization order.
The chosen member placeholder followed by constructor assignment supports both modes without
reading parameter properties prematurely, adding inheritance, or introducing lazy signal wrappers.

Angular `v22.1.5` remains the inspected reference. In addition to the signal sources above,
`packages/forms/signals/src/field/validation.ts`,
`packages/forms/signals/test/node/validation_status.spec.ts`, and
`packages/forms/signals/test/node/api/validators/required.spec.ts` were inspected for initial
validation and parent aggregation. Gem's existing first-invocation deferral and explicit watcher
lifecycle are preserved by this refactor.

## Clone callback scope and placement

Keep clone creation in the implementation class's `createClone()` method, alongside its other
operations. `createNode()` calls this method once and stores the returned function as `_clone`.
The former `createObjectClone()` helper lived near the top of `form.ts`; the form/group migration
moved it into `FormGroupNode.createClone()`. These recipes do not need separate utility files.

Array templates retain `_clone` callbacks so they can create items later. A callback that reads
`this.initialValue` retains the original `FieldNode` through `this`; that state retains its node,
parent signal, and other live resources. Retaining the callback can therefore retain the source
node and parent tree even when the application no longer keeps them directly.

`createClone()` reads `this` only while extracting `initialValue`, `initialValidatorSource`, and
`cloneOptions` into local bindings. Its returned callback uses those bindings and the module-level
`FieldNode` constructor, without referencing `this`. `FormGroupNode.createClone()` similarly captures the
compiled child recipe, validators, options, node kind, and normalizer. Every invocation constructs
fresh node state from that configuration.

The important boundary is the callback's closure scope, not whether its factory is a class method.
Creating the recipe directly inside the main node-construction scope can share an environment with
other closures that retain live nodes; the earlier ownership regression reproduced this retention.
A dedicated method extracting only the required inputs provides that separation within the class.
The original module-level field helper was a structural choice, not a language requirement, and
has been replaced by the instance method after review.

The collection regression checks this implementation with `useDefineForClassFields: false` and
`true`, verifying source-tree collection and future item creation. Keep these checks when changing
recipe creation; checking the callback's syntax alone is insufficient.

This isolation is not a deep copy. Application values, validator callbacks, state sources, and
explicit injectors keep their original identity and may themselves retain application objects.

## Array migration roadmap

- [x] Keep every public overload and argument-selection rule in `array.ts` during the initial
  migration; hand normalized inputs to `new ArrayNode<TItem>(...).getNode()`. The subsequent
  construction-entry extraction below moves argument selection beside the class.
- [x] Group plain members, writable signals, and computed signals as in the completed field factory.
  Seed items and local availability/validator state before eager helpers read them. Keep the
  aggregate `value` computed from its children rather than introducing a second writable value.
- [x] Organize operations into structural edits, value/interaction changes, validation, hierarchy and
  control bindings, item creation, reconciliation, and node assembly.
- [x] Preserve positional and keyed reconciliation, item identity, parent keys, snapshot iteration,
  lazy schema samples, and the reconciliation strategy selected at construction.
- [x] Forward public actions through callbacks so extracting an action preserves its node. Invoke
  user factories and tracking callbacks without introducing an implementation receiver.
- [x] Keep `createClone()` in the class, capturing only the item factory, initial contents, original
  validators, and copied options. Preserve weak ownership and future nested item creation.
- [x] Preserve callable proxy indexing and public descriptors. `Object.defineProperties()` is still
  needed to replace the function's built-in `length` property with the public length signal.
- [x] Compare generated declarations and runtime API shape with the pre-migration baseline; verify
  public tests, both class-field emit modes, template ownership, and control integration.

The implementation class accepts the normalized item type directly, avoiding repeated evaluation of
`NormalizedNode<TDefinition>` throughout its implementation. Public signatures and inference remain
unchanged. The source-based performance fixture decreased from 88,145 types / 1,008,076
instantiations to 71,479 types / 786,139 instantiations without changing its budgets.

Angular `v22.1.5` (commit `468b65b74566537456c192ac4281795c5a1e1a5e`) was the inspected reference:
`packages/forms/signals/src/field/structure.ts`, `packages/forms/signals/src/util/array.ts`, and the
array structure, tracking, and removal tests in `packages/forms/signals/test/node/field_node.spec.ts`.
Gem's existing explicit `trackBy` and template-cloning contracts remain unchanged.

An additional forced-GC audit found existing retention while numeric/custom debounce work is pending
in the shared control-value buffer. The pre-migration array and the class behave identically in both
emit modes; an immediate-debounce control is collected. This issue was subsequently corrected separately
from the migration: shared-buffer callbacks now use isolated scopes, and custom debounce callbacks
in both the buffer and field class weakly reference their controllers. Forced-GC tests cover pending
and cancelled work in both class-field emit modes. The original finding and its resolution remain
in `TODO.md`; template-source collection and future item creation retain their own regression tests.

The subsequent form/group migration reviewed their shared `createObjectNode()` boundary together
and selected the common `FormGroupNode` implementation described below.

## Array readability audit

- [x] Extract `forEach()` into a class method and keep its public entry as a forwarding callback.
  Preserve the iteration snapshot and callback arguments.
- [x] Separate current-item indexing and incoming-key validation from `reconcileByKey()` so its
  main body describes reuse, creation, detachment, and publication. Validate both key sets before
  changing items, read `trackBy` once, and keep user tracking callbacks receiver-independent.
- [x] Clarify internal names with `itemFactory`, `preparedSchemaItem`, and `usedDefinitions`.
  Preserve receiver-independent factory calls and the configuration-only clone closure.
- [x] Introduce the local `ArrayItemNode<TItem>` alias for repeated parent-aware item types without
  changing public declarations.

Keep `controlValueBuffer?.cancel()` in value/reset operations as an explicit defensive guard.
Removing this optional chaining was considered and declined.

## Second array readability audit

- [x] Use the explicit `'set' | 'reset'` reconciliation mode instead of a boolean. Keep new-item
  initialization through `reset()` in either mode.
- [x] Name the keyed reconciliation map `remainingItemsByKey` and the incoming key list
  `incomingKeys`; read each incoming `key` once before matching and consuming an existing item.
- [x] Place `getSchemaSample()` next to `createItem()` and explain that the reserved sample becomes
  the next real item instead of being discarded after schema inspection.
- [x] Group snapshot queries and iteration together, and place `assertIndex()` beside structural
  operations. Keep item creation, schema preparation, and definition validation together.

Keep the indexed proxy inside `createNode()`. Extracting it into a separate method was considered
and declined; retain the existing constructor, computed grouping, and optional buffer cancellation.

## Form and group migration roadmap

The shared class was initially named `ObjectNode`. A subsequent naming review selected
`FormGroupNode`, with `createFormGroupNode()` and the `form-group-node.*` companion files, to make
its two supported primitives explicit. Public object-definition type names remain unchanged.

- [x] Preserve public overloads and documentation in `form.ts` and `group.ts`. Move their shared
  argument resolution to `createFormGroupNode()` in `form-group-node.ts` and construct `FormGroupNode<TNodes>`
  using the normalized child-node type rather than repeating definition normalization in the class.
- [x] Use one implementation for both object node kinds. Preserve form ownership and form-only
  submission, group inheritance, nested submission boundaries, and the public `nodeType()` value.
  `FormGroupNode` also avoids confusion with the separate `[formNode]` directive.
- [x] Group plain members, writable signals, and computed signals using the field/array conventions.
  Seed local signals inside `untracked()` after reading options and normalizing validators, before
  context creation and validation/control setup. Keep aggregate values computed from children.
- [x] Organize child queries and dynamic edits, value/reset operations, interaction/submission,
  validation, hierarchy/control bindings, cloning, and callable assembly into class methods.
  Preserve dynamic-key validation before mutation and the structure-version dependency.
- [x] Forward actions through callbacks bound to the implementation instance. Preserve rest-argument
  distinctions, child-name collisions, property descriptors, and internal API aliases.
- [x] Keep the injected definition normalizer receiver-independent for initial children and later
  dynamic additions. Carry it into clone recipes so configured shorthand defaults remain intact.
- [x] Keep `createClone()` inside the class and capture only compiled child recipes, the initial
  validator source, copied options, node kind, and normalizer. Verify source-tree collection and
  future item creation, as well as pending-debounce collection and live completion, in both
  class-field emit modes.
- [x] Compare generated public declarations and runtime shapes against the function-based baseline.
  Cover extracted form/group actions through public tests, including validation, dynamic edits,
  parent propagation, reset, submission, and child-name collisions.

The generated public declarations remain byte-for-byte identical. The source-based type-performance
fixture decreased from 71,562 types / 786,836 instantiations to 65,798 types / 741,775 instantiations
without changing its budgets.

Angular `v22.1.5` (commit `468b65b74566537456c192ac4281795c5a1e1a5e`) was confirmed as the latest
stable Angular 22 tag during this migration. The inspected reference paths were
`packages/forms/signals/src/field/{state,structure,validation,submit}.ts` and
`packages/forms/signals/test/node/{field_node,submit}.spec.ts`. Existing Gem submission, dynamic
children, and group contracts remain unchanged; this migration does not redesign their behavior.

A constructor audit also reproduced a pre-existing limitation in both implementations and both
class-field emit modes: constructing a form/group with children inside `computed()` attempts a
parent-link signal write in the child. Empty object nodes can be constructed there and retain
option-getter dependencies; public tests cover their initial availability and first validation.
The child-parenting issue was corrected separately after the migration. Construction now isolates
parent-link writes, initial array resets, buffer snapshots, and watcher ownership from the caller's
reactive context. Keep child normalization, item factories, validator-source normalization, and
configuration reads tracked so declaration inputs still rebuild the tree. Internal mutable state
must not become an incidental reconstruction trigger. This distinction also applies to fields used
inside aggregate declarations. The completed decision is retained in `TODO.md`.

After a further readability review, `FormGroupNode.submit()` uses `async` and one `try/finally`
around the awaited action. This supersedes the earlier explicit-promise implementation and its
brief extraction into a separate action method. Preflight and action invocation stay synchronous;
`async` converts synchronous failures into promise rejections. The `finally` block clears submitting
immediately if action invocation throws, or after the awaited completion otherwise. Public tests
cover these timing distinctions, invalid-submission callback failures, promise-like actions, and
inherited submitting state. The public signature remains `Promise<boolean>`.

## Construction entry functions

The initial extraction moved argument interpretation into the construction entries. After review,
that responsibility returned to the public primitives; the entries now only construct and return
nodes. This supersedes the earlier argument-resolution placement recorded in the migration steps.

- [x] Keep `createFieldNode()` in `field-node.ts` as `new FieldNode(...).getNode()`. Resolve validators,
  options, and the `field()` versus `field(undefined)` distinction in `field()`.
- [x] Keep `createArrayNode()` in `array-node.ts` as `new ArrayNode(...).getNode()`. Let `array()` select
  initial contents, validators, and options, validate counts/templates, and prepare the item factory.
- [x] Keep `createFormGroupNode()` in `form-group-node.ts` as `new FormGroupNode(...).getNode()`.
  Resolve validators and options in `form()`, `group()`, and their configured counterparts; preserve
  existing default-merging order and custom definition normalizers.
- [x] Align both entries with `createFormGroupNode()` while retaining each primitive's argument rules.
  Classes continue to own live state; clone recipes use constructors directly with resolved inputs.
- [x] Move property-based array invariants to `primitives/tests/array.property.spec.ts`, alongside
  the other primitive invariant suites. Keep their existing generated cases and model assertions.

## Checklist for each subsequent primitive

1. **Map the existing contract.** Identify overloads, inference, callable behavior, public members,
   aliases, internal hooks, initialization order, and lifecycle ownership. Capture the emitted
   public declarations before editing. Run the relevant existing public primitive tests.
2. **Choose the implementation boundary.** Keep the exported function as the typed facade. Identify
   which state and operations belong together before introducing a class. Inspect whether another
   primitive already shares the implementation; in particular, review the form/group relationship.
3. **Move code without redesigning behavior.** Preserve lazy reads, validator execution timing,
   injector ownership, cancellation, cloning, and control integration. For any behavioral question,
   inspect the latest Angular 22 maintenance source and tests and record the exact tag or commit.
4. **Respect initialization dependencies.** Declare writable signals as members. Use valid domain
   defaults when available; generic value slots may use the explicitly approved `undefined as TValue`
   placeholder only while the factory is being constructed. Seed them before context creation,
   validation setup, node publication, or registration. Isolate initialization writes with `untracked()`
   so construction inside computed callbacks remains supported, and read options before that block
   to preserve getter dependencies. Lazy computed callbacks must not be read before seeding;
   eagerly executed helpers require their dependencies first.
5. **Apply the class conventions.** Use plain member names and blank lines. Keep related properties
   together, computed signals separate, and complementary states and constraints adjacent. Use
   `self…` for mutable local state when distinguishing it from an effective computed state. Preserve
   aggregate-node propagation rather than copying a leaf's computed formulas.
6. **Assemble the existing node explicitly.** Keep the callable node and its public and internal API
   objects distinct. Preserve action identity where aliases share a function, and ensure extracted
   callbacks still work. Keep `_` prefixes on hidden node/API hooks. Register the node only after
   the state required by registration is ready.
7. **Review readability locally.** Prefer meaningful names and method ordering first. Extract a
   cohesive operation when it makes the caller easier to follow. Retain necessary lifetime
   boundaries, especially weak references in scheduled callbacks. Avoid a shared base class or a
   generic node-assembly framework without a demonstrated need.
8. **Verify the result.** Run focused public tests, `npm run typecheck` (including lint, type tests,
   and template tests), `npm run build`, and `npm run test:coverage`. Compare emitted declarations
   and investigate type-performance changes. Check both class-field emit modes when moving
   initializers. Run browser, package, and documentation checks when their respective scopes are
   affected, as required by `AGENTS.md`. Add tests for meaningful supported behavior, not retired
   member names or the arrangement of the implementation.
9. **Record decisions before moving on.** Update this roadmap and preserve resolved and deferred
   items in `TODO.md`. Keep consumer documentation and changelogs unchanged for a purely internal
   refactor; update them if an intentional consumer-visible change becomes part of the work.

## Additional concerns for aggregate nodes

- **Form:** retain child-name collisions and API escape paths, value/error aggregation, nested form
  ownership, submission, and downward state operations.
- **Group:** identify which behavior is shared with form and which is deliberately distinct before
  deciding whether a separate class improves the implementation.
- **Array:** preserve template/factory cloning, dynamic child attachment and detachment, parent keys,
  tracking, value aggregation, and ownership cleanup as items are added, removed, or reordered.
