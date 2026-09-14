# Reactive Forms to Form Nodes migration audit

Audited on 2026-09-11. This is a migration risk assessment, not a proposal to make every behavior
identical or a claim that all third-party controls have been tested. The original audit made no implementation changes; subsequent fixes are recorded in the decision log. Priorities reflect silent data changes and broken workflows before API
renames and compilation failures.

The reference is Angular **v22.1.6**, commit
`356adf749188d996a641181c56621a6285126f3c`, for both Reactive Forms and Signal Forms source/tests.
The local differential experiments used the repository's installed Angular **21.0.7**; their
Reactive Forms behavior was cross-checked against the cited Angular 22 implementation.
Form Nodes behavior refers to the current checkout, after removal of automatic native form binding.

Evidence: 14 temporary differential tests passed, alongside 572 existing field/form/presence tests
(586 total). Two additional Chromium differential tests reproduced nullable text parsing and date
representation differences. The temporary probes were removed after the audit. These checks do not
constitute complete application migration or third-party UI certification.

## Highest-priority findings

1. **Nullable text parsing was confirmed and fixed (2026-09-12).** Before the fix, `field<string>(null)`
   on a native text input treated nonempty text as numeric input. Typing `Ada` left the model null and produced `parse`; Reactive
   Forms' `FormControl<string | null>(null)` accepts the string. The generic cannot disambiguate
   runtime null. This also matters after resetting an initially string-valued field to null.
2. **Disabled values remain in Form Nodes aggregate values (accepted, 2026-09-14).** This aligns
   with Angular Signal Forms. Migrating Reactive Forms `form.value` to `form()` can add keys to API
   payloads; explicitly construct a DTO when exclusion is required. No library change is planned.
3. **Reset contracts differ (no-argument reset accepted, 2026-09-14).** Nullable Reactive Forms
   controls normally reset to null; nonnullable controls to their default. Form Nodes `reset()`
   preserves committed values, consistent with Signal Forms, while `resetToInitial()` restores
   captured initial data. Neither is automatically the last server-loaded or saved record;
   reset baselines and payload shapes remain separate review items.
4. **Presence still differs for collections and NaN.** Both implementations now accept false for
   `required`, but Reactive Forms rejects empty arrays/sets and accepts NaN; Form Nodes does the reverse.
   Reactive Forms `minLength(1)` permits empty arrays/sets; Form Nodes rejects them.
5. **Pending validation does not block the default Form Nodes submit action.** Projects previously
   requiring `form.valid` should use `submitWhen: 'valid'`. This blocks rather than waits/retries.
6. **Readonly/hidden state changes validation and interaction.** Form Nodes suppresses validation,
   dirty and touched for these nodes. A Reactive Forms control displayed with HTML readonly or CSS
   visibility retains its model validation and interaction state.

The nullable text defect has been fixed; item 1 and its decision log record the new behavior.
The existing required-collection and NaN behavior was accepted on 2026-09-14 (items 7 and 8).
The remaining headline differences are existing contracts that need explicit migration choices.

## Review process

Review each numbered item independently before deciding whether to change the library. The proposed
migration actions are investigation guidance, not approved implementation tasks. Keep item numbers
stable so future discussions and commits can refer to them.

Use these review statuses:

- **Pending review:** no decision yet.
- **Planned:** a code, documentation, or test change has been agreed.
- **Completed:** the agreed work and verification are finished.
- **No change:** the current behavior is intentional and needs no further work.

Record decisions below the checklist with the item number, date, rationale, agreed action, and any
related issue, commit, or verification results. A confirmed difference does not automatically require
a compatibility change.

## Ordered migration checklist

Each row states the observed contract or a concrete integration boundary to test. Related cases
are grouped to avoid treating API renames as equivalent in severity to silent behavior changes.

| # | Area | Difference or corner case | Migration action | Review status |
| --- | --- | --- | --- | --- |
| 1 | Nullable native text | Before the fix, a runtime null selected numeric parsing in Form Nodes, even with a string generic; Reactive Forms' text accessor returns strings. Reproduced in Chromium. | Fixed: initially nullish text fields accept strings and clearing writes an empty string. Established numeric text bindings retain their representation through null resets; rebinds clear inference. Use type="number" for initially null numeric fields. | Completed |
| 2 | Disabled payloads | An enabled Reactive FormGroup omits disabled children from `.value`; `.getRawValue()` includes them. Form Nodes includes their committed values in `form()`, consistent with Angular Signal Forms. A disabled Reactive group includes all children. | Accepted as intentional. Keep aggregate values complete; explicitly construct DTOs when exclusion matters during migration. | No change |
| 3 | Disabled array entries | Reactive FormArray filters disabled entries from an enabled array's value, potentially shifting value indexes relative to controls. Form Nodes preserves entries and their positions, consistent with Angular Signal Forms. | Accepted as intentional. Keep disabled entries in the model; explicitly construct a filtered payload when required and account for any resulting index changes. | No change |
| 4 | No-argument reset | Reactive controls use their defaultValue (normally null, initial value with nonNullable). Form Nodes keeps current committed data, consistent with Angular Signal Forms. Native reset on an explicitly bound Form Nodes form also uses this value-preserving reset. | Accepted as intentional. Use reset() to clear interaction state while retaining committed values, reset(value) to supply replacement data, or resetToInitial() to restore captured initial data. | No change |
| 5 | Reset baseline | Form Nodes initial snapshots are declaration-time/effective array-item initialization snapshots; later loading/saving does not rebase them. Supported objects are cloned; opaque objects retain references. Angular 22 also supports overwriteDefaultValue on reset, which is not an interchangeable node option. | Keep a separate last-saved snapshot when Cancel means discard edits since the last save. Test mutable objects, dates, maps, and classes. | Pending review |
| 6 | Reset payload shape | Reactive Forms accepts partial reset objects and boxed `{ value, disabled }` states. Form Nodes complete reset inputs are values, not Reactive FormControlState objects. Unsafe partial objects can assign undefined to missing static children; omitted dynamic children keep values. | Convert both value and availability explicitly. Do not carry casts or boxed state objects across APIs. | Pending review |
| 7 | Required collections | Reactive required rejects `[]` and empty Set. Form Nodes required accepts both, consistent with Signal Forms. False, zero and whitespace-only strings pass in both Reactive Forms and Form Nodes; neither required trims strings. | Accepted as intentional. Keep required independent of collection cardinality; use minLength(1) when at least one item is required. | No change |
| 8 | Required NaN | Reactive required accepts NaN; Form Nodes rejects it, consistent with Signal Forms. notNil accepts NaN, false and empty strings because it tests only null/undefined. | Accepted as intentional. Keep NaN invalid for required; use notNil when only null/undefined should fail. | No change |
| 9 | Empty minimum length | Reactive minLength skips zero-length values, including arrays and sets. Form Nodes now measures empty strings and collections as zero, skipping only nullish values. | Implemented: validate empty strings against positive minimums. Use when to retain optional empty text; combine with required to reject nullish values too. | Completed |
| 10 | Pending submit gate | Reactive ngSubmit emits regardless of validity; application code decides. Form Nodes submit gates automatically and defaults to not-invalid, which permits pending-only state. | Reproduce the old handler's gate. Use submitWhen: 'valid' when all validators must have finished successfully; implement waiting/retry separately if required. | Pending review |
| 11 | Native form ownership | `[formNode]` on a child does not intercept the parent form. `<form [formNode]>` applies novalidate and handles submit/reset. A raw `(submit)` handler owns prevention and browser-validation policy. | Choose one submit owner; remove duplicate forwarding handlers when using an explicit form binding. | Pending review |
| 12 | Readonly/hidden validation | Form Nodes readonly/hidden suppresses a node's validators, errors and pending state; HTML readonly/CSS hiding does not do this to a Reactive FormControl. Values remain in the model. | Test wizard steps and locked fields. Decide whether a display restriction should also remove validation participation. | Pending review |
| 13 | Disabled status | A disabled Reactive control has DISABLED status, so valid and invalid are both false. A disabled Form Nodes node reports valid and is independently disabled. The NgControl bridge has its own Angular-shaped status projection. | Audit status switches and enabled/valid button conditions; distinguish node state from bridge state. | Pending review |
| 14 | All children disabled | Reactive groups/arrays can become DISABLED when every child is disabled. Form Nodes availability does not aggregate upward. Parent validators can still inspect the retained child values. | Test empty and all-disabled sections, their root validators, and submit-button state. | Pending review |
| 15 | Re-enabling a group | Reactive enable recursively enables children. Form Nodes removes the parent's own disabling condition, revealing child-owned disablement. A reactive disabled condition cannot be overridden by enable(). | Test permission locks and temporary whole-form disabling around save. | Pending review |
| 16 | Interaction suppression | Form Nodes hides dirty/touched for noninteractive nodes and restores stored state when they become interactive. Reactive disabled controls retain their own flags. | Test unsaved-change guards, error visibility and disable/enable cycles. | Pending review |
| 17 | Touch propagation | Reactive group.markAsTouched() marks that group and ancestors; markAllAsTouched() traverses descendants. Form Nodes markAsTouched() traverses by default. Its skipDescendants is not Reactive onlySelf. | Audit every touch call, including nested forms and custom aggregate controls. | Pending review |
| 18 | Clearing interaction | Reactive markAsPristine()/markAsUntouched() clear descendants. Form Nodes aggregate versions clear only own flags, so descendant state may keep the aggregate dirty/touched. | Do not use value-resetting APIs casually to fix flags; choose explicit descendant clearing or a deliberate reset. | Pending review |
| 19 | Blur commits | Reactive updateOn: 'blur' delays the view write and dirty transition until the accessor's blur callback. Form Nodes control state changes and becomes dirty immediately; committed data waits. markAsTouched() itself flushes pending data in Form Nodes. | Test autosave, error timing, repeated blur and programmatic touch while editing. | Pending review |
| 20 | Submit commits | Reactive updateOn: 'submit' is a directive-integrated strategy, not a time debounce. Form Nodes has no same-named strategy; node submit/touch/flush commits buffers. Parent control-value reads do not collect all descendant drafts. | Recreate the intended commit boundary; do not mechanically map submit to blur. | Pending review |
| 21 | Events versus signals | Reactive valueChanges emits for normal programmatic setValue, including equal values, and normally on enable/disable. Form Nodes onValueChange reports changed exposed committed values; equal writes and state-only changes do not notify. Effects can coalesce writes and are not a synchronous event log. | Audit side effects, dependent requests, analytics and tests that count emissions. | Pending review |
| 22 | Binding outputs | formNodeValueChange/formNodeControlValueChange are initiated by bound control adapters. Programmatic node writes do not independently emit them. NgControl bridge streams observe control values, including pending drafts. | Select onValueChange, signal observation, binding outputs or bridge streams according to the needed source/timing. | Pending review |
| 23 | Notification controls | Reactive emitEvent, onlySelf, emitModelToViewChange and emitViewToModelChange are not interchangeable Form Nodes mutation options. onValueChange callbacks are synchronous and composite operations batch notifications. | Rework initialization suppression, feedback-loop guards and independent ancestor updates explicitly. | Pending review |
| 24 | Equality/mutation | Signals normally use Object.is; mutating an object and setting the same reference can leave dependent validation/UI unnotified. Optional shallow/deep/custom equality can retain an older exposed reference. Reactive setValue normally recomputes/emits even for the same reference. | Use immutable updates and test object/Date/array/Set mutation and comparator behavior. | Pending review |
| 25 | Validator contracts | Reactive validators receive AbstractControl and return an error map. Node validators receive a context with value() and return kind-bearing errors. An unsafe direct port can ignore malformed results or read a function instead of its value. | Port or deliberately adapt validators; verify a failing sample for every migrated custom rule. CVA NG_VALIDATORS adaptation is a separate supported path. | Pending review |
| 26 | Error shapes | Reactive requiredTrue uses the required key; Form Nodes uses requiredTrue. minlength/maxlength become minLength/maxLength, with different detail fields. No errors is null in Reactive Forms and an empty array for node errors; getError misses return undefined for nodes. | Audit translations, template branches, error presenters, analytics and server mappings. | Pending review |
| 27 | Duplicate/group errors | Reactive composition merges maps by key. Form Nodes retains multiple errors with the same kind and getError returns the first. Own errors remain separate from descendant errors in both approaches; Form Nodes allErrors collects descendants. | Test overlapping validators and distinguish form-level cross-field errors from leaf errors. | Pending review |
| 28 | Validator execution | Reactive validation runs on its imperative update pipeline. Node synchronous validation is lazy and tracks signals; sibling/external signal changes can revalidate without an explicit update. Plain mutable variables are not reactive. | Keep validators pure. Replace mutable rule inputs with signals and remove dependence on invocation side effects/counts. | Pending review |
| 29 | Async setup | Form Nodes requires asyncValidator wrappers, schedules initial execution in a microtask, and tracks dependencies before the first await. Parameterized params mode defines dependencies separately. | Port sibling/country dependencies explicitly and test rapid changes, cancellation and request counts. | Pending review |
| 30 | Observable completion | Reactive composed async validators use forkJoin and need completion. Form Nodes consumes the first emission and unsubscribes; empty completion means no error. | Review startWith(null), BehaviorSubject validators, multiple emissions and noncompleting streams. An early null can prematurely succeed in Form Nodes. | Pending review |
| 31 | Async failures | Form Nodes rejects no values on the model when a validator promise rejects; absent onError, it contributes no error. Reactive validator stream failures also require application handling and must not be assumed to become an invalid result. | Map network failure to an explicit validation result if inability to validate must block submission. Test timeout/offline separately from a valid answer. | Pending review |
| 32 | Pending/invalid precedence | Reactive parent status can be PENDING while an enabled sibling is invalid. Form Nodes is invalid as soon as an error exists, while pending can simultaneously remain true. | Test mixed sync-invalid and async-pending siblings; avoid a single status switch that assumes exclusivity. | Pending review |
| 33 | Async publication/debounce | Node async validators publish independently in declaration order; errors may appear before all finish. Callback-style dependency discovery can make an initial debounced request before its publication delay; explicit params mode waits before invoking. | Recheck HTTP traffic and UI timing instead of assuming debounce always delays every request. | Pending review |
| 34 | Number conversion | Reactive number/range accessors return numbers/null based on input type. Form Nodes also consults the current model representation. Numeric text inputs use Number rather than Reactive text's string transport. min/max use numeric comparisons instead of Reactive parseFloat permissiveness for unsafe string values. | Test null, empty, zero, numeric strings, decimal separators, exponents and invalid edits. Keep model types and controls consistent. | Pending review |
| 35 | Date conversion | Reactive native date-like controls commonly use string values. Form Nodes can return string, numeric timestamp or Date based on current value; null date input chooses Date. Date-only valueAsDate is UTC. Reproduced in Chromium. | Audit JSON payloads, time zones, local display and initially empty date fields. | Pending review |
| 36 | Native parse errors | Form Nodes retains the last valid committed value while exposing a parse error for invalid raw input. Reading only node() can therefore return an earlier value while the UI shows invalid text. | Gate submission on validation, and test badInput, clearing, reset and rebinding. | Pending review |
| 37 | Pattern semantics | Reactive pattern accepts strings and adds anchors; Form Nodes accepts RegExp/reactive RegExp. Replacing 'abc' with /abc/ changes whole-value matching to substring matching. Form Nodes resets lastIndex for global/sticky regexes. Native HTML patterns also impose their own matching semantics. | Preserve intended anchoring and flags; test repeated runs and native browser validity separately from model validity. | Pending review |
| 38 | Template validators | Reactive required/minlength/etc. directives match Reactive Forms selectors. A required attribute next to only [formNode] does not create a node validator; node constraint synchronization can replace that native property. | Move validation rules into nodes; do not rely on attributes surviving a directive migration. | Pending review |
| 39 | Select/radio values | Reactive accessors support option ngValue/compareWith and arbitrary radio values. Form Nodes native fallback reads option.value and radio.value as strings, with string arrays for multiple selects. A custom/CVA accessor may retain richer semantics. | Audit object-valued selects, numeric IDs, identity comparison, null options and radio group names using the actual chosen adapter. | Pending review |
| 40 | Array structure | Reactive FormArray setValue requires existing controls; patchValue does not create rows; reset keeps the control structure. Form Nodes set/reset can resize and reconcile rows, and nullish complete array values normalize to an empty array. | Test add/remove/reorder, retained identity, dirty state, subscriptions and server error targets. Use trackBy for entity identity where appropriate. | Pending review |
| 41 | Runtime shape checks | Reactive setValue throws for missing/extra controls. Form Nodes requires full shapes in TypeScript but runtime set walks supplied keys, preserves omitted branches and warns/ignores unknown ones. Array index bounds and negative-index conventions also differ. | Validate external DTOs before assigning; compiler checks do not protect any/JSON input. | Pending review |
| 42 | Node topology | A Reactive nested FormGroup is ordinarily structural. Explicit nested form() starts a Form Nodes submission workflow; group()/object shorthand expresses structure. Child names can shadow node API names such as valid, reset or submit; $api resolves collisions. | Map groups intentionally and audit get/path usage, optional children and domain key collisions. | Pending review |
| 43 | CVA compatibility boundary | CVA value/disabled/touch and synchronous NG_VALIDATORS are supported, but the injected NgControl bridge is not a full FormControl. updateValueAndValidity is a no-op, validator properties do not expose transferable functions, and NG_ASYNC_VALIDATORS is not adapted. | Exercise each third-party component's real validator and NgControl dependencies; migrate async rules to nodes. Do not infer compatibility from rendering alone. | Pending review |
| 44 | Manual/server errors | Nodes have no general public setErrors equivalent. The CVA bridge has binding-owned setErrors whose errors persist across value writes until cleared/reset/destroyed, unlike Reactive revalidation replacing manual errors. Submission-returned targeted errors have their own edit/reset/staleness lifecycle. | Identify error ownership and test clear-on-edit, retry, concurrent edits and late server responses. | Pending review |
| 45 | Submission result/lifecycle | Reactive ngSubmit itself does not manage concurrency, return server errors, mark all descendants touched or own an async submitting flag. Node submit does. Returned HTTP response objects are not generic successful action results; errors are kind-bearing objects and exceptions propagate. Reset does not cancel an in-flight action. | Adapt existing handlers, avoid returning raw service responses, and test double-click, Enter, missing action, failures, resets and navigation during save. | Pending review |
| 46 | UI conventions | Reactive status classes and submitted directive state do not transfer automatically. Form Nodes classes are configurable; useFormNodeState/useClosestFormState rely on supported binding/DI ownership. Default form-node-errors shows messages based on interaction/submission rather than every invalid state. | Audit CSS selectors, Material error state matchers, accessibility IDs and group/global error presentation. | Pending review |
| 47 | Lifecycle/environment | Nodes can be created outside DI, but async watcher ownership can adopt a binding injector or inherit an ancestor. Destroy/rebind/detach can cancel work; removed nodes and dynamically reconciled rows have independent lifetime. | Test route/dialog closure, service-held forms, arrays, SSR/hydration and late validator responses. | Pending review |
| 48 | Ordinary behavior that should stay stable | Programmatic set/patch normally does not mark fields dirty in either system; dirty is not a comparison with the initial value. Own group errors are not a descendant summary. Disabling a field is not a server-side authorization rule. | Preserve these invariants instead of introducing unnecessary migration rewrites. | Pending review |

## Decision log

### Item 1 — Nullable native text parsing

- **Date:** 2026-09-12.
- **Decision:** fix the null-as-number inference for an unestablished native text binding.
- **Behavior:** initial null/undefined and nullable string resets allow text editing. Strings retain
  leading zeros and whitespace; user clearing produces ''. Numeric text bindings remember the
  last observed non-nullish representation through clearing/reset and forget it on rebinding.
- **Rationale:** TypeScript generics cannot disambiguate null at runtime. The input type provides
  an explicit numeric choice for initially null numeric models.
- **Verification:** dedicated browser coverage for standalone/nested nullable fields, reset,
  required state, inherited blur debounce, established numeric text, representation changes and
  rebinding; existing field/form/native integration tests remain part of regression verification.
- **Documentation:** control-binding guide, behavior reference, and unreleased changelogs updated.


### Item 2 — Disabled values in aggregate payloads

- **Date:** 2026-09-14.
- **Decision:** retain disabled children's committed values in `form()`; no library change.
- **Rationale:** disabling a field changes its availability and validation participation without
  removing its data from the model. This agrees with Angular Signal Forms; callers migrating
  Reactive Forms `.value` must explicitly construct a DTO if they need to exclude disabled values.
- **Angular reference:** latest stable Angular 22 tag checked on this date: **v22.1.6**, commit
  `356adf749188d996a641181c56621a6285126f3c`. In `packages/forms/signals/src/field/node.ts`,
  `value` exposes `structure.value`. In `structure.ts`, the root retains the supplied model signal
  and children use `deepSignal` into their parent's value, without filtering by disabled state.
  Reviewed disabled-state tests in `signals/test/node/field_node.spec.ts` and explicit enabled-state
  filtering tests in `signals/test/node/compat/extract_value.spec.ts`.
- **Verification:** the existing disabled-state tests in `src/lib/primitives/field.spec.ts` and
  `src/lib/primitives/form.spec.ts` passed: 23 tests across two files. Aggregate value composition
  was also inspected and reads every child without a disabled-state filter.
- **Scope:** this decision covers object payloads; see item 3 for the subsequent array decision.

### Item 3 — Disabled array entries

- **Date:** 2026-09-14.
- **Decision:** retain disabled array entries and their positions; no library change.
- **Rationale:** disabling an item must not implicitly remove its data or shift later value indexes.
  This follows the same complete-model contract accepted for item 2 and agrees with Angular
  Signal Forms. Applications that need selected or enabled rows should explicitly build that payload.
- **Angular reference:** latest stable Angular 22 tag rechecked: **v22.1.6**, commit
  `356adf749188d996a641181c56621a6285126f3c`. The root structure keeps the model signal, and
  child values use `deepSignal` with their parent key in `signals/src/field/structure.ts`.
  Reviewed the element-level disabled logic and dynamic-element tests in
  `signals/test/node/field_node.spec.ts`; disabled state does not filter the model array.
- **Verification:** inspected `ArrayNode.value` and `exposedValue`, which map every item in order
  without filtering by disabled state. The existing array disabled-reason propagation test passed
  (one selected test in `src/lib/primitives/array.spec.ts`).

### Item 4 — No-argument reset

- **Date:** 2026-09-14.
- **Decision:** keep the existing `reset()` contract and the separate `resetToInitial()` operation;
  no library change.
- **Behavior:** `reset()` preserves committed values, discards pending control edits, and clears
  dirty/touched state recursively. Form Nodes also clears the form's submitted state.
  `reset(value)` supplies replacement data; `resetToInitial()` restores captured initial data
  while resetting interaction state.
- **Rationale:** preserving committed data on a no-argument reset matches Angular Signal Forms.
  Restoring initial data is an explicit operation in Form Nodes, so migration should select the
  operation that expresses the application's intent.
- **Angular reference:** latest stable Angular 22 tag rechecked: **v22.1.6**, commit
  `356adf749188d996a641181c56621a6285126f3c`. `signals/src/field/node.ts` implements `_reset`
  by aborting pending synchronization, conditionally writing a supplied value, restoring the
  control value from committed data, clearing interaction flags, and resetting children.
  Reviewed the no-value reset and pending-debounce reset tests in
  `signals/test/node/field_node.spec.ts`.
- **Verification:** 41 existing reset-related tests passed across
  `src/lib/primitives/field.spec.ts` and `src/lib/primitives/form.spec.ts`, including
  `resetToInitial` coverage.
- **Scope:** item 4 is closed; reset baselines (item 5) and reset payload shapes (item 6)
  remain separate review decisions.

### Items 7 and 8 — Required collections and NaN

- **Date:** 2026-09-14.
- **Decision:** retain the existing behavior for both items; no library change.
- **Item 7:** empty collections continue to pass `required`. Use an explicit cardinality rule
  such as `minLength(1)` when at least one item is needed.
- **Item 8:** `NaN` continues to fail `required`. `notNil` remains available for checking only
  null/undefined absence.
- **Rationale:** both existing behaviors are accepted and align with Angular Signal Forms
  **v22.1.6**. The prior suggestion to change required-array/Set behavior was not adopted.
- **Scope:** the subsequent item 9 decision changes minimum-length validation for empty strings,
  without changing the accepted required-collection or NaN behavior.

### Item 9 — Minimum length includes empty strings

- **Date:** 2026-09-14.
- **Decision:** measure empty strings as length zero, consistently with collections. A positive
  minimum now rejects `''`; a zero minimum permits it. Nullish values remain exempt and whitespace
  is not trimmed. The public validator types also accept explicitly undefined-valued fields.
- **Rationale:** an existing string has a measurable length, including zero. Optional empty text
  is expressed explicitly with `minLength(3, { when: ({ value }) => value() !== '' })`.
- **Compatibility:** this is a breaking change and a deliberate difference from Angular Signal
  Forms **v22.1.6**, commit `356adf749188d996a641181c56621a6285126f3c`. Its `min_length.ts`
  skips empty strings, and its `min_length.spec.ts` explicitly tests this behavior.
- **Observable effects:** a nullable text field may start valid with null and become invalid when
  cleared to ''. Required empty text now reports both required and minLength errors. Errors affect
  parent validity and submission normally. Reset validates the preserved or restored committed
  value; pending drafts are still discarded. An inactive when condition removes constraint metadata.
- **Documentation:** the validator reference, catalog, behavior reference, migration guide,
  executable examples, and unreleased changelogs describe the new contract and optional-field migration.
- **Verification:** 1,827 unit tests across 113 files passed with 100% statement/function/line
  coverage and 99.28% branch coverage. Chromium passed 318 tests across 21 files plus 11 production
  AOT tests, including new empty-text binding coverage. Type checking, lint, public type and
  template checks, package build/consumer checks, and the documentation build passed;
  59 executable documentation examples passed.

## Review notes — Items 7–9 (2026-09-14)

Items 7 and 8 are accepted as **No change** above. Item 9's approved change is reflected in the
table below; before that change, Form Nodes also skipped empty strings in minLength.

The latest stable Angular 22 tag was rechecked: **v22.1.6**, commit
`356adf749188d996a641181c56621a6285126f3c`. Items 7 and 8 and collection minimum-length behavior
align with Signal Forms; empty-string minimum length deliberately differs. The previously accepted
boolean exception remains separate: Form Nodes `required`
accepts `false`, while Signal Forms rejects it.

| Rule and input | Reactive Forms | Signal Forms | Form Nodes |
| --- | --- | --- | --- |
| required: null, undefined, or empty string | Invalid | Invalid | Invalid |
| required: false | Valid | Invalid | Valid |
| required: zero or whitespace-only string | Valid | Valid | Valid |
| required: empty array or Set | Invalid | Valid | Valid |
| required: empty Map or plain object | Valid | Valid | Valid |
| required: NaN | Valid | Invalid | Invalid |
| minLength(1): empty string | Valid | Valid | Invalid |
| minLength(1): empty array or Set | Valid | Invalid | Invalid |
| minLength(1): empty Map | Valid (unsupported size-only value) | Invalid | Invalid |

- **Item 7:** migrating a multiselect, tag list, or file collection with only `required` can silently
  permit zero selections. The current explicit cardinality rule is `minLength(1)`; combine it with
  `required` if the field can also be null. Rejecting empty arrays/Sets in `required` would be an
  intentional Signal Forms divergence. Map support and arbitrary objects must be considered
  separately rather than assuming Reactive Forms treats every zero-sized value as absent.
- **Item 8:** keeping `NaN` invalid is a defensible default for required numeric input and matches
  Signal Forms. `notNil` already offers strict null/undefined checking and accepts `NaN`.
  `required` is not a general numeric-validity rule: infinity still passes, for example.
- **Item 9:** `minLength(1)` expresses a minimum string length or collection size directly. Reactive Forms
  instead skips empty arrays/Sets to support optional values; its source explicitly states this
  rationale. An optional collection requiring at least two entries only when populated needs a
  conditional rule in Form Nodes. Optional empty strings now also need a conditional rule.

Evidence was reviewed in Reactive Forms `src/validators.ts` and `test/validators_spec.ts`, and
Signal Forms `src/api/rules/validation/{required,min_length,util}.ts` plus
`test/node/api/validators/{required,min_length}.spec.ts`, relative to `packages/forms/`.
The complete edge-case table follows the implementations; the upstream tests do not assert
every table cell. Before implementation, local verification ran the existing required/min-length
validator suites and the public field/form suites: 570 tests across four files.

## Suggested migration acceptance suite

Use real application examples rather than testing only method renames:

- **Account editor:** null names, false opt-in checkbox, separately required acceptance checkbox,
  a disabled record ID, readonly username, initial load, edit, save, Cancel, reset and failed save.
- **Address wizard:** conditionally hidden required fields, async postal lookup, cross-field country
  validation, revisiting steps, touch/dirty restoration, and enabled/disabled parent sections.
- **Dynamic order:** zero/one/many rows, disabled rows, keyed reorder, external DTO replacement,
  retained subscriptions, index-based server errors, and reset after structure changes.
- **Custom controls:** every CVA/select/date picker in use, repeated blur with debounce, object values,
  required/min/max state, NG_VALIDATORS changes, NG_ASYNC_VALIDATORS migration and error clearing.
- **Submission:** Enter/button/manual handler, pending-only state, pending plus invalid sibling,
  double-click, offline validation, server rejection, editing during save, and reset during save.
- **Reactivity:** programmatic patch, same-reference mutation, same-value writes, silent initialization,
  chained dependent fields and signals changed during asynchronous validation.

## Evidence map

Angular paths below are relative to `packages/forms/` at the pinned tag. Implementation was read
alongside the corresponding tests; local differential probes cover the explicitly reproduced cases.

| Area | Angular implementation and tests | Form Nodes implementation |
| --- | --- | --- |
| Presence, length, pattern, numeric conversion | [src/validators.ts](https://github.com/angular/angular/blob/v22.1.6/packages/forms/src/validators.ts), [test/validators_spec.ts](https://github.com/angular/angular/blob/v22.1.6/packages/forms/test/validators_spec.ts) | src/lib/validation/validators/, src/lib/utils/is-empty.ts |
| Values, disabled, reset, interaction, shape enforcement | [src/model/abstract_model.ts](https://github.com/angular/angular/blob/v22.1.6/packages/forms/src/model/abstract_model.ts), [form_control.ts](https://github.com/angular/angular/blob/v22.1.6/packages/forms/src/model/form_control.ts), [form_group.ts](https://github.com/angular/angular/blob/v22.1.6/packages/forms/src/model/form_group.ts), [form_array.ts](https://github.com/angular/angular/blob/v22.1.6/packages/forms/src/model/form_array.ts), test/form_group_spec.ts and test/form_control_spec.ts | src/lib/primitives/field-node.ts, form-group-node.ts, array-node.ts and their public primitive specs |
| Signal Forms state authority | [signals/src/field/state.ts](https://github.com/angular/angular/blob/v22.1.6/packages/forms/signals/src/field/state.ts), [validation.ts](https://github.com/angular/angular/blob/v22.1.6/packages/forms/signals/src/field/validation.ts), signals/test/node/field_node.spec.ts and validation_status.spec.ts | src/lib/primitives/field-node.ts, form-group-node.ts and docs/behavior.md |
| Native controls, updateOn, CVA | [src/directives/shared.ts](https://github.com/angular/angular/blob/v22.1.6/packages/forms/src/directives/shared.ts), default_value_accessor.ts, number_value_accessor.ts, select_control_value_accessor.ts, reactive_directives/form_group_directive.ts; signals/src/directive/form_field.ts and signals/test/web/interop.spec.ts | src/lib/form-node/adapters/native-control/native-control-value.ts, sync-native-control-state.ts; CVA adapters and FormNodeNgControl |
| Async behavior and submission | src/validators.ts composeAsync; [signals/src/api/structure.ts](https://github.com/angular/angular/blob/v22.1.6/packages/forms/signals/src/api/structure.ts), signals/src/field/submit.ts and signals/test/node/submit.spec.ts | src/lib/validation/utils/resolve-async-validation-result.ts, async validation runner, src/lib/primitives/form-group-node.ts |

This inventory separates deliberate Signal Forms-inspired semantics from compatibility gaps.
Any future implementation changes should make that distinction explicit in documentation and tests.
