# Primitive state refactor guide

The `field()` prototype moves implementation state and operations into an internal class while
preserving the existing callable public API. The goal is easier reading and maintenance. Use the
checklist below when evaluating the same approach for `form()`, `group()`, or `array()`; a separate
class for every primitive is not a requirement.

## Field prototype roadmap

- [x] Keep public overloads, argument normalization, and nullability helpers in `field.ts`.
- [x] Move state, operations, and node assembly into `FieldState`; callers use its `node` property.
- [x] Preserve callable nodes, action aliases, callback-safe actions, and weak debounce ownership.
- [x] Use plain internal member names and a blank line between class members.
- [x] Group properties by responsibility, with computed signals in a separate block immediately before the constructor.
- [x] Initialize argument-independent signals as members and argument-dependent signals in the constructor. Audit both class-field emit modes.
- [x] Distinguish mutable `selfTouched`/`selfDirty` from computed `touched`/`dirty`, consistently with availability state.
- [x] Order methods so main operations precede their supporting helpers: value and interaction operations, validator management and its watcher, hierarchy and focus, debounce helpers, then node assembly.
- [x] Clarify node assembly names. The final assembly uses `publicApi` for shared node members and `internalApi` for that API plus internal hooks.
- [x] Extract custom debounce execution into `startCustomControlDebounce()` so `setControlValue()` shows the strategy selection directly. Preserve cancellation, synchronous failures, stale settlements, and weak callback ownership.
- [x] Normalize computed callback formatting: concise simple expressions and array literals, explicit return blocks for longer conditions and decisions, and consistent statement terminators.
- [x] Separate constructor phases with blank lines: configuration, values and context, availability, metadata, asynchronous validation, node assembly/registration, and watcher startup. Preserve initialization order without adding wrappers.
- [x] Review the field prototype after the first readability pass. Verify public tests, type checking, build, coverage, emitted declarations, runtime API shape, and weak debounce ownership; record the next candidates below.

## Second readability audit

The first six readability changes and the four follow-up improvements below are complete.
The implementation remains a field-only prototype; selecting the next primitive is a separate step.

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
- Keep `.node` as the existing-instance access point. `createNode()` assembles a new node;
  introducing `getNode()` would needlessly obscure that distinction for the current caller.
- `FieldState` still describes a long-lived implementation that owns state and operations.
  `FieldFactory` would emphasize construction while hiding the continuing ownership. Leave a
  class rename as an open preference rather than a prerequisite for readability improvements.
- Keep responsibility-based property groups instead of collecting all uninitialized properties
  at the top. Initialization order remains explicit in the constructor.
- `group()` already delegates to `createObjectNode()` in `form.ts`; inspect that shared boundary
  before proposing separate form and group implementation classes.

Open naming and access alternatives remain recorded in [TODO.md](../TODO.md). These audit
recommendations do not resolve those preferences on the user's behalf.

## Third readability audit

The three follow-up items are complete. The ownership correction also required isolating the
existing form/group, array, and shorthand-object recipes; those primitives remain function-based.

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

The internal `_nodeType` discriminant duplicates the public `nodeType()` result. Replacing its
uses with `$api.nodeType()` is a separate cross-node cleanup involving the directive, Angular
adapter, internal type, and every primitive; it is not part of this field assembly refactor.

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
4. **Respect initialization dependencies.** Create signals with their real initial values. Do not
   introduce placeholder casts and constructor `.set()` calls solely for uniform declarations:
   writes can fail when construction happens inside a computed callback. Lazy computed callbacks
   may refer to members initialized later; eagerly executed helpers require their dependencies first.
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
