# 100 Ranked Opportunities for Form Nodes

The strongest opportunities are better handling of saved data, interoperable validation, and reusable form workflows. Form Nodes already has a substantial reactive state engine. The next useful layer would reduce the application code needed to load, edit, validate and save a real record reliably.

This report ranks **exactly 100 proposals** against **Form Nodes 3.7.0**, commit `10db4cc784efd4cf55596a5c3df8407a0c710094`. It is a product research backlog, not a commitment to implement all 100 or a claim that the library lacks 100 fundamental capabilities. Some entries are new public APIs; others package workflows already possible through composition, or propose optional adapters and tools. Every entry identifies that distinction.

The [companion CSV](./form-framework-opportunities.csv) contains the same ranking, current support, proposed increment, rationale, evidence, placement, effort and related foundations for sorting and filtering. Proposed names in this report are conceptual, not available APIs.

## Recommendation

Start with two small design tracks: **saved-baseline semantics** (#2–4) and **Standard Schema validation** (#1). These have broad application value and support later work such as autosave, server refreshes and schema-driven forms. Explore the validation runner and display policy (#10–11) next, then use them to productize the existing wizard recipe (#13).

Keep transport, storage, router integrations and rendering in optional entry points or companion packages. The lower-ranked control and designer ideas are possible ecosystem directions, not reasons to turn the core into a component suite. A simpler published recipe may be preferable to a permanent API when a workflow has little shared policy.

## Scope, evidence and ranking

Research date: **11 September 2026**. The comparison covers Angular Signal Forms, Formly, React Hook Form, TanStack Form, Final Form, Mantine, Ant Design, Conform, React Spectrum, VeeValidate, Vuelidate, FormKit, Formwerk, Felte, Superforms, Modular Forms/Formisch, Ember Changeset, MobX React Form/MobX Formkit, Parsley, jQuery Validation, JSON Forms, react-jsonschema-form, SurveyJS and Form.io, plus adjacent router and persistence integrations. This spans Angular, React, Vue, Svelte, Qwik, Ember, jQuery and framework-independent JavaScript.

The order is an editorial judgment based on recurring application usefulness, fit with the existing node model, reduction of difficult application code, enabling value for other features, and implementation/maintenance cost. There are no invented adoption measurements or numerical ROI scores. Nearby ranks are less significant than the tiers. Priority is not implementation order: a highly valuable workflow can depend on a lower-ranked foundation.

Gap labels:

- **API:** the specific state or operation is not available through the audited public contract. This does not mean applications cannot emulate it.
- **Composition:** the building blocks already exist; the missing deliverable is a maintained helper with shared lifecycle and edge-case policy.
- **Integration:** an external schema, transport, UI or tooling capability is not shipped as an official adapter/package.

The catalog contains **29 API extensions, 28 composition helpers and 43 integrations**. Only **17 proposals** are assigned to the core; the remainder belong in optional helpers, adapters, UI packages or development tools.

Placement is a recommendation, not an architectural decision. **Core** means a primitive/state contract; **Helper** means a composable optional API; **Adapter** means a framework/platform or third-party boundary; **UI package** and **Tool** should remain separate from the state engine. Effort **S/M/L** indicates relative scope including tests and documentation, not a time estimate. L can range from a difficult state change to an entirely new product; the text explains that difference.

Each entry separates an observed external precedent from the proposed Form Nodes adaptation. Extra policies in the proposal are our inference, not claims that the cited framework already implements every detail. References are official documentation, maintainer source, or explicitly marked companion examples. Most web documentation is unversioned and has no reliable publication date; the research date is an access date. Historical, maintenance-mode, community and experimental references are identified in the source register. A documented feature is not evidence of its performance or production reliability.

### Existing capabilities excluded from the count

The public export surface and implementation are authoritative when older prose differs. In particular, a historical boundary statement in `docs/behavior.md` should not be read as evidence that dynamic object children are missing.

| Already present | Evidence in this repository | Consequence for the proposals |
| --- | --- | --- |
| Callable typed fields, groups, forms and arrays; dynamic named children | [Public exports](../../src/public-api.ts), [form factory](../../src/lib/primitives/form.ts), [node contract](../../src/lib/types/node.type.ts) | No proposal for basic field arrays, nested forms or add/remove children. |
| Synchronous/reactive validation, cancellable async work and custom rule composition | [Validation implementation](../../src/lib/validation/async-validator.ts), [validator API](../../src/lib/validation/validator.ts) | #1, #6, #10 and #38 add integration or orchestration rather than basic async validation. |
| Committed/control value access, including comparator-bypassing reads | [Value contract](../../src/lib/types/node-value-signal.type.ts) | No generic raw-value-access proposal. An aggregate control read is not a recursive snapshot of every descendant's pending input. |
| Interaction dirty/touched state, reset and resetToInitial | [Node contract](../../src/lib/types/node.type.ts), [field tests](../../src/lib/primitives/field.spec.ts), [form tests](../../src/lib/primitives/form.spec.ts) | #2 adds comparison-to-baseline state without redefining dirty; #3 adds explicit baseline replacement. |
| Stable array reconciliation and reordering | [Array primitive](../../src/lib/primitives/array.ts), [reorderable arrays cookbook](../../website/docs/cookbook/reorderable-arrays.md) | #90 is accessible UI orchestration around existing operations. |
| Returned submission errors, gates and stale-result protection | [Behavior specification](../behavior.md), [form tests](../../src/lib/primitives/form.spec.ts) | #9 is a path adapter; #19 and #22 extend submission lifecycle. |
| CVA errors, flexible single/array/nullish validation results and state observation | [Form node state](../../src/lib/form-node-state/form-node-state.ts), [error contributions](../../src/lib/form-node-state/control-errors.ts) | #23 extends independent application error ownership; it does not introduce CVA validation. |
| Standalone value binding and optional explicit nodes | [Directive](../../src/lib/form-node/form-node.directive.ts), [standalone binding tests](../../src/lib/form-node/form-node-value.spec.ts) | No proposal to add standalone or one-way binding. |
| onValueChange, factories, global/scoped defaults and message catalogs | [Exports](../../src/public-api.ts), [messages](../../src/lib/validation/validator-messages.ts) | Autosave/calculations are productized composition; locale packs add translations, not localization infrastructure. |
| Native numeric/date parsing, parse errors and custom control adapters | [Native value adapter](../../src/lib/form-node/adapters/native-control/native-control-value.ts), [control adapter contract](../../src/lib/form-node/adapters/control-adapter.ts) | #5 generalizes conversion; specialized widgets remain optional adapters. |
| Conditional hidden/disabled/readonly state, focus and error aggregation | [Node contract](../../src/lib/types/node.type.ts), [behavior](../behavior.md) | Declarative rules and error navigation add a layer over existing state. |
| Multi-step and server-data editing recipes | [Multi-step cookbook](../../website/docs/cookbook/multi-step-form.md), [server-data cookbook](../../website/docs/cookbook/edit-server-data.md) | #13 and #20 package existing recipes and address their orchestration gaps. |

The baseline review ran `npx vitest run src/lib/primitives/field.spec.ts src/lib/primitives/form.spec.ts src/lib/form-node/form-node-value.spec.ts`: **3 files and 568 tests passed**. These establish the reviewed baseline; they do not validate any proposed feature. This change contains research documents only.

### Angular behavior reference

The latest stable Angular 22 release resolved during this review was **v22.1.6**, commit **`356adf749188d996a641181c56621a6285126f3c`**. Preview tags for later minors were excluded. The inspected paths below are pinned to that commit; Angular `main` was not used as the behavior authority.

| Question | Implementation and relevant tests inspected | Implication for Form Nodes |
| --- | --- | --- |
| Schema validation and issue targeting | `src/api/rules/validation/standard_schema.ts`; `test/node/api/validators/standard_schema.spec.ts` | Preserve one relevant schema evaluation, nested issue targeting and reactive/async transitions; adapt ownership so DI-free use still works. |
| Interaction state and aggregation | `src/field/state.ts`; reset/interaction cases in `test/node/field_node.spec.ts` | Keep dirty as interaction state. Introduce comparison state separately. |
| Submission, pending work and errors | `src/field/submit.ts`; `test/node/submit.spec.ts` | Preserve error ownership and submission propagation; make new waiting/cancellation behavior explicit. |
| Metadata reducers | `src/api/rules/metadata.ts`; `test/node/api/metadata.spec.ts` | Typed metadata needs specified aggregation and lifecycle, not an unstructured mutable bag. |
| Experimental automation | `src/webmcp/registration.ts`; `test/web/webmcp.spec.ts` | Treat WebMCP as exploratory. Existing inference rejects null/undefined/empty arrays; a robust adapter should use declared schemas. |

Pinned source links: [1](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/src/api/rules/validation/standard_schema.ts), [2](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/test/node/api/validators/standard_schema.spec.ts), [3](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/src/field/state.ts), [82](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/test/node/field_node.spec.ts), [83](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/src/field/submit.ts), [4](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/test/node/submit.spec.ts), [5](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/src/api/rules/metadata.ts), [84](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/test/node/api/metadata.spec.ts), [6](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/src/webmcp/registration.ts), [85](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/test/web/webmcp.spec.ts).

## Ranked shortlist

| Rank | Opportunity | Recommended home | Effort |
| --- | --- | --- | --- |
| 1 | Standard Schema validation adapter | Adapter | L |
| 2 | Changes relative to a saved baseline | Core | M |
| 3 | Redefine the reset baseline after loading or saving | Core | M |
| 4 | Refresh server data while preserving local edits | Helper | L |
| 5 | Typed control-to-model codecs | Adapter | L |
| 6 | Validation execution triggers independent of value commits | Core | L |
| 7 | Public mutation batching | Core | M |
| 8 | Nonblocking warnings | Core | M |
| 9 | Backend error maps addressed by paths | Adapter | M |
| 10 | Awaitable validation of a field or subtree | Core | L |
| 11 | Shared error visibility policy | Helper | M |
| 12 | Development-only node inspector | Tool | L |
| 13 | First-class wizard controller | Helper | L |
| 14 | Autosave coordinator | Helper | L |
| 15 | Opt-in persistent drafts | Helper | M |
| 16 | Capture and restore form checkpoints | Helper | L |
| 17 | Export changed values and structural patches | Helper | L |
| 18 | Accessible error summary with invalid-field navigation | Helper | M |
| 19 | Cancelable submission with AbortSignal | Core | M |
| 20 | Async record initialization state | Helper | M |

## Complete ranking: 1–20, first shortlist

### 1. Standard Schema validation adapter

**Validation · Integration · Adapter · Effort L.** Independent starting point.

**Current support:** Custom sync and async validators exist; no exported Standard Schema bridge.

**Proposed addition:** Accept compatible schemas, execute once per relevant value revision, and map nested issues to live nodes without requiring injection. **Why here:** Avoids duplicating domain rules and connects several schema ecosystems through one small public entry point.

**Precedent:** Angular 22 implements a Standard Schema bridge and tests reactive schemas and nested issue paths. [1](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/src/api/rules/validation/standard_schema.ts), [2](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/test/node/api/validators/standard_schema.spec.ts), [7](https://tanstack.com/form/latest/docs/framework/react/guides/validation)

### 2. Changes relative to a saved baseline

**State · API · Core · Effort M.** Related foundations: #3.

**Current support:** dirty() records interaction and stays dirty after a user restores the original value.

**Proposed addition:** Add a separate comparison-based changed state for leaves and aggregates, with explicit equality and array-order semantics. **Why here:** Supports correct Save buttons and unsaved-change warnings across ordinary edit screens.

**Precedent:** React Hook Form exposes isDirty relative to default values. [10](https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/docs/useform/formstate.mdx)

### 3. Redefine the reset baseline after loading or saving

**State · API · Core · Effort M.** Independent starting point.

**Current support:** reset(value) changes values and interaction; resetToInitial() retains declaration-time defaults.

**Proposed addition:** Provide an explicit operation to accept a new baseline, including partial/subtree policy and array identity handling. **Why here:** Makes the saved server record the next meaningful reset target.

**Precedent:** Mantine exposes setInitialValues; Inertia exposes defaults updates. [21](https://mantine.dev/form/values/), [28](https://inertiajs.com/docs/v2/the-basics/forms)

### 4. Refresh server data while preserving local edits

**Data workflow · Composition · Helper · Effort L.** Related foundations: #2, #3.

**Current support:** set(), patch() and trackBy reconciliation exist; callers implement edit-aware merging.

**Proposed addition:** Merge incoming records against a baseline, preserving edited fields and reporting conflicting edits or row removals. **Why here:** Prevents a background refresh from silently overwriting work.

**Precedent:** Final Form documents keepDirtyOnReinitialize; React Hook Form offers keepDirtyValues. [17](https://final-form.org/docs/final-form/types/Config), [11](https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/docs/useform/reset.mdx)

### 5. Typed control-to-model codecs

**Controls · API · Adapter · Effort L.** Independent starting point.

**Current support:** Native number/date parsing and CVA error contributions exist; custom conversion is application code.

**Proposed addition:** Expose reusable parse/format contracts with different control and model types, preserving incomplete input and the last valid committed value. **Why here:** Simplifies dates, money and third-party controls without repeating conversion and error lifecycle logic.

**Precedent:** Superforms provides typed value proxies for string-facing inputs. [29](https://superforms.rocks/concepts/proxy-objects)

### 6. Validation execution triggers independent of value commits

**Validation · API · Core · Effort L.** Independent starting point.

**Current support:** Reactive validators and buffered commits exist; debounce changes when values commit.

**Proposed addition:** Offer explicit change, blur or submit validation scheduling while retaining immediate committed-value updates when requested. **Why here:** Reduces expensive work without delaying the model that other application logic reads.

**Precedent:** TanStack Form separates validation by event cause. [7](https://tanstack.com/form/latest/docs/framework/react/guides/validation)

### 7. Public mutation batching

**State · API · Core · Effort M.** Independent starting point.

**Current support:** Individual aggregate operations batch internally; separate consumer operations still form separate updates.

**Proposed addition:** Expose a scoped batch for several mutations, with defined callback delivery, validation timing and exception behavior. **Why here:** Keeps dependent multi-field changes coherent and avoids repeated application callbacks.

**Precedent:** Final Form exposes batch() and separate validation pause/resume operations. [16](https://final-form.org/docs/final-form/types/FormApi)

### 8. Nonblocking warnings

**Validation · API · Core · Effort M.** Independent starting point.

**Current support:** Validation errors participate in invalidity; informational feedback requires separate application state.

**Proposed addition:** Add a warning channel with its own aggregation and messages that never blocks submission. **Why here:** Allows quality advice and suspicious-value hints without misclassifying acceptable data as invalid.

**Precedent:** Felte supports separate warning validators and stores. [26](https://felte.dev/docs/svelte/validation)

### 9. Backend error maps addressed by paths

**Validation · Integration · Adapter · Effort M.** Related foundations: #29.

**Current support:** onSubmit can return node-targeted errors and rejects stale results; applications translate backend paths themselves.

**Proposed addition:** Translate configurable backend path formats into live node targets, reporting unmatched paths and preserving request/value revision checks. **Why here:** Removes recurring glue for nested API validation responses.

**Precedent:** Vuelidate accepts external result maps; VeeValidate accepts field error maps. [24](https://vuelidate-next.netlify.app/advanced_usage), [22](https://vee-validate.logaretm.com/v4/guide/composition-api/handling-forms)

### 10. Awaitable validation of a field or subtree

**Validation · API · Core · Effort L.** Independent starting point.

**Current support:** Consumers read validation signals and configure validators; no public node-level awaitable validation runner is exposed.

**Proposed addition:** Run or join relevant validation, resolve against a defined value revision, and handle cancellation, detachment and pending descendants. **Why here:** Provides a dependable foundation for Next, Check and Save workflows.

**Precedent:** VeeValidate exposes validate() and validateField(). [23](https://vee-validate.logaretm.com/v5/api/use-form/)

### 11. Shared error visibility policy

**Validation UX · Composition · Helper · Effort M.** Independent starting point.

**Current support:** dirty, touched, submitted and errors are available; each component decides when to show messages.

**Proposed addition:** Provide a reactive visible-errors policy for blur, touch, submission and optional delayed presentation, without altering validity. **Why here:** Makes custom controls consistent and avoids premature or flickering feedback.

**Precedent:** FormKit configures validation visibility separately from rule execution. [37](https://formkit.com/essentials/validation)

### 12. Development-only node inspector

**Developer tools · Integration · Tool · Effort L.** Independent starting point.

**Current support:** Signals and error queries are inspectable manually; no dedicated form inspector ships.

**Proposed addition:** Inspect tree structure, committed/control values, contributing errors, interaction state and ownership, with values redacted by default. **Why here:** Shortens diagnosis of complex forms and makes the library easier to learn.

**Precedent:** React Hook Form ships a DevTools companion. [13](https://github.com/react-hook-form/devtools)

### 13. First-class wizard controller

**Workflow · Composition · Helper · Effort L.** Related foundations: #10, #18.

**Current support:** A multi-step cookbook already demonstrates branch rendering, touching and validity checks.

**Proposed addition:** Package step registration, guarded navigation, pending-validation coordination and routing to the step containing a submission error. **Why here:** Turns a repeated recipe into a consistent, testable workflow API.

**Precedent:** FormKit provides step navigation and beforeStepChange guards. [36](https://formkit.com/plugins/multi-step)

### 14. Autosave coordinator

**Data workflow · Composition · Helper · Effort L.** Related foundations: #2, #3, #19, #25.

**Current support:** onValueChange can start a save; consumers own queuing, cancellation, retries and saved-state tracking.

**Proposed addition:** Coordinate debounced saves of committed snapshots, coalesce newer edits, expose outcomes, and accept only the revision actually saved as the baseline. **Why here:** Removes a common source of races and misleading saved indicators.

**Precedent:** React Final Form publishes autosave examples. [19](https://final-form.org/docs/react-final-form/examples)

### 15. Opt-in persistent drafts

**Persistence · Integration · Helper · Effort M.** Related foundations: #16.

**Current support:** Applications can observe values and use storage; no managed persistence adapter ships.

**Proposed addition:** Persist selected fields with a key, expiry, serialization policy and restore decision; clear the draft only under an explicit successful-save policy. **Why here:** Protects long forms from reloads without requiring each app to build storage lifecycle code.

**Precedent:** FormKit provides a local-storage plugin with persistence hooks and expiry. [35](https://formkit.com/plugins/local-storage)

### 16. Capture and restore form checkpoints

**State · API · Helper · Effort L.** Related foundations: #7.

**Current support:** reset and resetToInitial exist; they do not capture arbitrary current interaction and structural checkpoints.

**Proposed addition:** Capture values, supported node structure and interaction state; restore synchronously while cancelling stale pending work and rebuilding derived validation. **Why here:** Enables cancelable edits, navigation restoration and reproducible debugging.

**Precedent:** Superforms provides capture/restore snapshots. [30](https://superforms.rocks/concepts/snapshots)

### 17. Export changed values and structural patches

**Data workflow · Composition · Helper · Effort L.** Related foundations: #2, #3, #29.

**Current support:** Full committed values are available; patch() consumes partial updates but does not produce a diff.

**Proposed addition:** Produce a typed change summary or explicit add/remove/replace/move representation against a chosen baseline, including array identity policy. **Why here:** Makes PATCH requests and review screens accurate when fields or rows disappear.

**Precedent:** Ember Changeset exposes a list of staged changes; structural patch output is our proposed extension. [46](https://github.com/adopted-ember-addons/ember-changeset)

### 18. Accessible error summary with invalid-field navigation

**Accessibility · Composition · Helper · Effort M.** Related foundations: #44.

**Current support:** allErrors and focus() exist; aggregate focus chooses a bound control rather than a dedicated invalid-field navigation strategy.

**Proposed addition:** Create ordered, labeled summary entries and focus/reveal the corresponding invalid control, including a host hook for hidden pages. **Why here:** Helps users recover from large invalid submissions with keyboard and assistive technology.

**Precedent:** Ant Design provides scrollToFirstError; Conform documents accessible error associations. [27](https://ant.design/components/form/), [48](https://conform.guide/accessibility)

### 19. Cancelable submission with AbortSignal

**Submission · API · Core · Effort M.** Independent starting point.

**Current support:** submit() exposes submitting state and blocks concurrent calls; no caller-owned cancellation contract is public.

**Proposed addition:** Pass a request-scoped signal to the submit handler and expose cancellation with defined outcomes and stale-result rejection. **Why here:** Supports leaving a screen, replacing an autosave and stopping slow uploads.

**Precedent:** Inertia forms expose cancellation. [28](https://inertiajs.com/docs/v2/the-basics/forms)

### 20. Async record initialization state

**Data workflow · Composition · Helper · Effort M.** Related foundations: #3, #4.

**Current support:** The edit-server-data recipe loads externally and calls set/reset; loading and request races are application concerns.

**Proposed addition:** Coordinate loader state, errors, retries and latest-record ownership, then establish the baseline without overwriting intervening edits. **Why here:** Removes boilerplate from nearly every server-backed edit form.

**Precedent:** React Hook Form supports async default values and an isLoading state. [12](https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/docs/useform.mdx), [10](https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/docs/useform/formstate.mdx)

## Ranks 21–50: next candidates

### 21. Typed submission output transformations

**Submission · API · Helper · Effort M.** Independent starting point.

**Current support:** onSubmit receives exposed form values; applications transform them inside their handlers.

**Proposed addition:** Define a typed input-to-output projection evaluated for a specific submit snapshot, optionally using a schema's parsed output. **Why here:** Separates editable representations from the DTO while retaining compile-time output inference.

**Precedent:** Mantine exposes transformValues and its transformed output type. [21](https://mantine.dev/form/values/)

### 22. Submit policy that waits for validation

**Submission · API · Core · Effort M.** Related foundations: #10, #19.

**Current support:** The valid gate refuses pending state; it does not await completion and automatically resume the same attempt.

**Proposed addition:** Add an explicit wait policy using a stable value revision, cancellation and timeout; invoke the handler only after that revision satisfies the gate. **Why here:** Prevents users needing a second click after remote validation finishes.

**Precedent:** jQuery Validation defers submission while remote requests are pending. [65](https://raw.githubusercontent.com/jquery-validation/jquery-validation/master/src/core.js)

### 23. Public source-owned error contributions

**Validation · API · Core · Effort M.** Independent starting point.

**Current support:** CVA/state hooks, Angular-control bridges and returned submission errors already contribute errors through scoped paths.

**Proposed addition:** Expose an application-level error source with update and dispose semantics, preserving independent sources and clearing only the owner's errors. **Why here:** Supports external services, imported diagnostics and background checks outside a bound component.

**Precedent:** Vuelidate external results illustrate independent application error input; ownership leases are our proposed refinement. [24](https://vuelidate-next.netlify.app/advanced_usage)

### 24. Typed submit intents

**Submission · API · Core · Effort M.** Independent starting point.

**Current support:** Native submit events can be observed; submit() has no typed action metadata parameter.

**Proposed addition:** Pass a typed intent such as saveDraft or publish through native and programmatic submission, with explicitly selected gating policy. **Why here:** Lets one form support different actions without side-channel flags or timing-sensitive button handlers.

**Precedent:** TanStack Form supports submit metadata; Conform demonstrates intent buttons. [9](https://tanstack.com/form/latest/docs/framework/react/guides/submission-handling), [47](https://conform.guide/intent-button)

### 25. Submission outcome and result state

**Submission · API · Helper · Effort M.** Related foundations: #19.

**Current support:** submitted means an attempt occurred; submitting does not record success, failure, result or attempt count.

**Proposed addition:** Expose typed last outcome, attempt count and optional result data with reset and stale-attempt semantics. **Why here:** Simplifies success feedback, retries and parent coordination.

**Precedent:** Final Form exposes success/failure state; React Hook Form exposes submission count and success. [18](https://final-form.org/docs/final-form/types/FormState), [10](https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/docs/useform/formstate.mdx)

### 26. Unsaved-change navigation guard

**Workflow · Composition · Adapter · Effort M.** Related foundations: #2, #3.

**Current support:** Consumers can combine router hooks and state; dirty alone cannot represent data restored to its saved value.

**Proposed addition:** Provide router and beforeunload integration driven by baseline changes, with explicit discard/continue handling and disposal. **Why here:** Prevents accidental abandonment while avoiding warnings for already-saved or reverted data.

**Precedent:** Superforms supports tainted-form navigation confirmation. [31](https://superforms.rocks/concepts/tainted)

### 27. Selective reset options

**State · API · Core · Effort M.** Related foundations: #3, #23, #25.

**Current support:** reset clears interaction in its scope; resetToInitial restores captured defaults; retention is not configurable.

**Proposed addition:** Allow explicit retention of selected interaction, error-source and submission states while independently choosing values and baseline policy. **Why here:** Supports successful partial saves and server corrections without resetting unrelated UX.

**Precedent:** React Hook Form exposes granular reset retention options. [11](https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/docs/useform/reset.mdx)

### 28. Server validation hydration envelope

**Server integration · Integration · Adapter · Effort L.** Related foundations: #1, #3, #9.

**Current support:** Angular binding hydration is tested; values and errors can be supplied separately, but no portable server form-state envelope exists.

**Proposed addition:** Hydrate matching schema/value revisions, errors and baseline as one unit, rejecting stale or incompatible envelopes and avoiding a false first-render transition. **Why here:** Supports server-rendered validation responses and consistent first-paint feedback.

**Precedent:** VeeValidate supports initial errors; Superforms returns validated form data from server actions. [22](https://vee-validate.logaretm.com/v4/guide/composition-api/handling-forms), [34](https://superforms.rocks/concepts/files)

### 29. Typed deep paths and composable lenses

**Type API · API · Helper · Effort M.** Independent starting point.

**Current support:** Direct child access and immediate add/get/remove exist; reusable infrastructure must implement deep traversal.

**Proposed addition:** Provide typed path tuples and composable node lenses with safe optional/dynamic traversal and explicit unresolved results. **Why here:** Helps reusable subform components and backend adapters without replacing ergonomic direct node access.

**Precedent:** React Hook Form Lenses supplies composable typed field traversal. [14](https://github.com/react-hook-form/lenses)

### 30. Native File and File[] bindings

**Controls · API · Adapter · Effort M.** Independent starting point.

**Current support:** Atomic fields can hold rich values; the native file input currently falls through to string value handling.

**Proposed addition:** Read selected files with typed single/multiple policy, clear the DOM correctly on reset, and model existing attachments separately from a browser selection. **Why here:** Fills a concrete native-control gap in common profile and attachment forms.

**Precedent:** FormKit and Superforms provide file input binding helpers. [40](https://formkit.com/inputs/file), [34](https://superforms.rocks/concepts/files)

### 31. Nested FormData serialization and decoding

**Transport · Integration · Adapter · Effort M.** Related foundations: #30.

**Current support:** Nodes expose JavaScript values; callers define transport encodings.

**Proposed addition:** Encode/decode nested objects, repeated arrays, nulls, booleans and files under a documented naming convention with validation of decoded input. **Why here:** Avoids incompatible multipart payload conventions across applications.

**Precedent:** Superforms handles file-aware requests and distinguishes nested JSON transport from ordinary FormData; our proposal would define its own explicit multipart convention. [34](https://superforms.rocks/concepts/files), [81](https://superforms.rocks/concepts/nested-data)

### 32. Typed submission field projection

**Submission · Composition · Helper · Effort M.** Related foundations: #29.

**Current support:** Hidden and disabled values remain in the model; consumers manually remove UI-only fields before sending.

**Proposed addition:** Select included paths or apply an explicit participation predicate at the submit boundary while preserving the complete editable model. **Why here:** Prevents accidental transport of confirmation fields, display state and irrelevant branches.

**Precedent:** VeeValidate exposes controlledValues and withControlled submission. [22](https://vee-validate.logaretm.com/v4/guide/composition-api/handling-forms)

### 33. Opt-in binding participation policy

**Structure · API · Adapter · Effort L.** Related foundations: #32.

**Current support:** Node lifetime is independent of DOM mounting; unbinding releases ownership but does not remove model data.

**Proposed addition:** Offer an explicit binding-managed policy for retain, exclude or unregister, including reference counting for multiple hosts. **Why here:** Makes conditional DOM-driven forms possible without changing the current safe default.

**Precedent:** React Hook Form exposes shouldUnregister; Modular Forms distinguishes active mounted fields. [12](https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/docs/useform.mdx), [51](https://modularforms.dev/react/api/Field)

### 34. Named validation scopes independent of tree shape

**Validation · API · Helper · Effort M.** Related foundations: #10, #29.

**Current support:** Groups provide structural aggregation; one node belongs to one structural parent.

**Proposed addition:** Define reusable selections of nodes for validation and feedback without moving or duplicating them in the tree. **Why here:** Supports approval sections, tabs and cross-cutting checks over an existing DTO shape.

**Precedent:** Parsley has named validation groups; Vuelidate offers validation scopes. [63](https://parsleyjs.org/doc/), [24](https://vuelidate-next.netlify.app/advanced_usage)

### 35. Different revalidation policy after submission

**Validation UX · API · Helper · Effort M.** Related foundations: #6.

**Current support:** Consumers can write conditional validators, but no shared validation phase policy ships.

**Proposed addition:** Select an initial trigger and a different trigger after the first attempted submit, with a reset operation that restores the initial phase. **Why here:** Allows quiet first entry followed by responsive correction after an error.

**Precedent:** TanStack revalidateLogic separates mode from modeAfterSubmission. [8](https://tanstack.com/form/latest/docs/framework/react/guides/dynamic-validation)

### 36. Rule priority and fail-fast execution

**Validation · API · Core · Effort M.** Independent starting point.

**Current support:** Multiple rules can contribute errors; no public general priority or bail policy is exposed.

**Proposed addition:** Offer stable priorities and explicit collect-all versus stop-on-failure execution, defining how async rules and cancellation interact. **Why here:** Avoids unnecessary expensive checks after a prerequisite has already failed.

**Precedent:** Parsley supports validation priorities; Ant Design exposes validateFirst. [63](https://parsleyjs.org/doc/), [27](https://ant.design/components/form/)

### 37. Validation-only normalization

**Validation · Composition · Helper · Effort S.** Independent starting point.

**Current support:** Applications can transform values inside custom validators; no reusable validation-input normalization helper ships.

**Proposed addition:** Compose a normalizer that changes only what validators inspect, leaving displayed and committed values unchanged. **Why here:** Useful for whitespace-insensitive checks when silently rewriting user input would be wrong.

**Precedent:** jQuery Validation provides a normalizer hook. [66](https://jquery-validation.github.io/normalizer/)

### 38. Remote validation result cache

**Validation · Composition · Helper · Effort M.** Independent starting point.

**Current support:** Async cancellation, parameters and debounce exist; repeat requests are not backed by a public cache policy.

**Proposed addition:** Cache by rule identity and all relevant parameters with expiry, invalidation and explicit per-form or shared ownership. **Why here:** Reduces repeated network work when users revisit the same values.

**Precedent:** jQuery Validation reuses the prior result when serialized remote parameters match. [65](https://raw.githubusercontent.com/jquery-validation/jquery-validation/master/src/core.js)

### 39. Validation probes without publishing new messages

**Validation UX · API · Core · Effort M.** Related foundations: #10, #11.

**Current support:** Reading valid() is non-mutating, but there is no explicit run that returns fresh async results while withholding their presentation.

**Proposed addition:** Provide a validate-only execution mode returning results without touching fields or replacing visible message state; make result lifetime explicit. **Why here:** Useful for eligibility previews and action availability checks before requesting user correction.

**Precedent:** Ant Design exposes validateFields({ validateOnly: true }). [27](https://ant.design/components/form/)

### 40. Transactional subform editing

**State · Composition · Helper · Effort L.** Related foundations: #4, #16.

**Current support:** A nested form mutates its own live tree; a separate form can be constructed manually for a dialog.

**Proposed addition:** Fork an editable working copy with explicit apply/cancel and conflict detection if the source changes while the dialog is open. **Why here:** Makes modal address or row editors predictable without leaking half-completed edits into the parent.

**Precedent:** Ember Changeset stages changes before execute/save and supports rollback. [46](https://github.com/adopted-ember-addons/ember-changeset)

### 41. Undo and redo history

**State · Composition · Helper · Effort L.** Related foundations: #7, #16.

**Current support:** reset returns to a declared baseline; no ordered user-edit history is maintained.

**Proposed addition:** Record bounded, coalesced checkpoints with transaction boundaries, redo invalidation and exclusions for sensitive or large values. **Why here:** Benefits long content and administrative forms where a single reset is too coarse.

**Precedent:** React Form Autosave documents optional undo/redo history; evidence is limited to its README. [45](https://github.com/686f6c61/react-form-autosave)

### 42. Infer node constraints from external schemas

**Schema integration · Integration · Adapter · Effort L.** Related foundations: #1.

**Current support:** Built-in validators already supply required/min/max metadata; schema libraries are not connected.

**Proposed addition:** Add schema-specific introspection bridges for supported required/range/pattern constraints and document unsupported refinements. **Why here:** Keeps native attributes and visual requirements consistent with external domain schemas.

**Precedent:** Formly maps JSON Schema into field configuration. Standard Schema validation alone does not guarantee introspection. [59](https://formly.dev/docs/guide/json-schema/)

### 43. Optional browser constraint-validation bridge

**Accessibility · Integration · Adapter · Effort M.** Related foundations: #11.

**Current support:** Native parsing and several constraint attributes are synchronized; no full public setCustomValidity/reportValidity policy ships.

**Proposed addition:** Bridge selected node errors to browser custom validity and define native versus custom presentation without introducing duplicate submission paths. **Why here:** Supports applications that want browser validation UI while retaining node-based rules.

**Precedent:** React Spectrum exposes native versus ARIA validation behavior. [49](https://react-spectrum.adobe.com/v3/Form.html)

### 44. Label, help and error association helpers

**Accessibility · Composition · Adapter · Effort M.** Independent starting point.

**Current support:** State attributes and custom control state exist; applications create label and message IDs and wire their relationships.

**Proposed addition:** Provide stable IDs and composable label/help/error bindings that preserve consumer aria-describedby entries and work across custom hosts. **Why here:** Improves accessibility consistency at every field without prescribing markup.

**Precedent:** Conform documents field IDs and accessible message associations. [48](https://conform.guide/accessibility)

### 45. Coordination across independent forms

**Workflow · Composition · Helper · Effort M.** Related foundations: #10, #25.

**Current support:** Nested forms and closest-form discovery exist; independent roots have no named coordination registry.

**Proposed addition:** Register roots with scoped names and expose aggregate pending/changed state plus ordered multi-form actions without reparenting nodes. **Why here:** Supports split screens and separate dialogs whose changes are saved together.

**Precedent:** Ant Design Form.Provider links named forms and their events. [27](https://ant.design/components/form/)

### 46. Managed calculated fields with override policy

**Data workflow · Composition · Helper · Effort M.** Related foundations: #7.

**Current support:** computed values and onValueChange can implement calculations; callers manage writes, loops and user overrides.

**Proposed addition:** Package a derived-field binding with dependencies, lifecycle, optional manual override and explicit restoration of automatic calculation. **Why here:** Useful for totals, generated slugs and shipping defaults while preserving user intent.

**Precedent:** Final Form Calculate provides declarative field calculations; manual-override policy is our proposed addition. [20](https://github.com/final-form/final-form-calculate)

### 47. Extensible typed node metadata

**Extensibility · API · Core · Effort M.** Independent starting point.

**Current support:** Constraint metadata exists internally and as fixed public signals; arbitrary public metadata keys are not exported.

**Proposed addition:** Expose typed keys and explicit reducer/inheritance rules for labels, descriptions and integration hints. **Why here:** Creates one shared extension surface for inspectors, schema bridges and renderers.

**Precedent:** Angular Signal Forms exposes metadata rules and reducers. [5](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/src/api/rules/metadata.ts)

### 48. Managed node plugins with disposal

**Extensibility · API · Core · Effort L.** Related foundations: #47.

**Current support:** Factories, configuration and callbacks are extensible; consumers manually coordinate cross-cutting lifecycle cleanup.

**Proposed addition:** Provide plugin installation, inherited scope, deterministic disposal and opt-in hooks around supported lifecycle events. **Why here:** Lets optional helpers integrate consistently without adding every feature to node options.

**Precedent:** FormKit's architecture supports plugins and node hooks. [38](https://formkit.com/essentials/architecture)

### 49. Pre-commit change interception

**State · API · Core · Effort L.** Related foundations: #7.

**Current support:** onValueChange observes committed changes; it is not a veto or pre-commit transform.

**Proposed addition:** Offer an explicit interception contract with source metadata, transform/reject outcomes and reentrancy rules for selected writes. **Why here:** Supports locked business transitions and centralized normalization that must happen before observers see a value.

**Precedent:** MobX Formkit, the successor of MobX React Form, exposes interceptors backed by MobX. [62](https://raw.githubusercontent.com/foxhound87/mobx-formkit/master/src/Base.ts), [86](https://github.com/foxhound87/mobx-formkit)

### 50. Managed remote choices

**Data workflow · Composition · Helper · Effort M.** Independent starting point.

**Current support:** Signals can feed option lists externally; the library does not own option loading state.

**Proposed addition:** Load options from reactive parameters with cancellation, stable value identity and loading/error/empty states separate from field validity. **Why here:** Removes repeated async select plumbing while keeping fetching outside the core node.

**Precedent:** SurveyJS can load choices from a REST service. [68](https://surveyjs.io/form-library/documentation/api-reference/choicesrestful)

## Ranks 51–80: conditional investment

### 51. Cascading choice reconciliation

**Data workflow · Composition · Helper · Effort M.** Related foundations: #50.

**Current support:** Cross-field callbacks can reset a dependent value; invalidation and races are left to each app.

**Proposed addition:** Coordinate parent-dependent option changes and explicitly retain, clear or flag selections that are no longer available. **Why here:** Prevents stale country/city or category/product combinations after upstream edits.

**Precedent:** SurveyJS supports choice URLs that reload when referenced answers change. [68](https://surveyjs.io/form-library/documentation/api-reference/choicesrestful)

### 52. Construct nodes from JSON Schema

**Schema integration · Integration · Adapter · Effort L.** Related foundations: #42, #47.

**Current support:** Factories build typed trees in code; no exported JSON Schema-to-node constructor exists.

**Proposed addition:** Build node structure, defaults and supported validators from a documented JSON Schema subset, with override hooks and diagnostics. **Why here:** Enables metadata-driven business forms while preserving manually authored forms as the primary API.

**Precedent:** Formly provides a JSON Schema mapping service. [59](https://formly.dev/docs/guide/json-schema/)

### 53. Schema renderer and component registry

**Rendering · Integration · UI package · Effort L.** Related foundations: #47, #52.

**Current support:** The library binds supplied controls; it does not render a form from metadata.

**Proposed addition:** Ship an optional renderer that resolves field kinds through a registry and binds existing Form Nodes to consumer-selected components. **Why here:** Allows generated forms without embedding a design system in the core package.

**Precedent:** JSON Forms publishes renderer sets for several frameworks. [54](https://jsonforms.io/docs/renderer-sets/)

### 54. Declarative form layout schema

**Rendering · Integration · UI package · Effort M.** Related foundations: #53.

**Current support:** Applications own templates and layout; no serializable layout vocabulary ships.

**Proposed addition:** Represent sections, groups, tabs and responsive layout separately from data paths, preserving state when layout changes. **Why here:** Lets a generated form match a usable screen rather than just listing every property.

**Precedent:** JSON Forms separates layouts from data schema. [55](https://jsonforms.io/docs/uischema/layouts/)

### 55. Discriminated-union branch controller

**Structure · Composition · Helper · Effort L.** Related foundations: #32, #52.

**Current support:** Dynamic children and conditional state already exist; callers coordinate alternative shapes and their retained data.

**Proposed addition:** Manage named schema variants with typed narrowing, explicit branch retention and validation/submission participation. **Why here:** Fits payment methods and person/company forms without scattered branch cleanup.

**Precedent:** Formisch documents schema variants for conditional structures. [52](https://formisch.dev/qwik/guides/migrate-from-modular-forms/)

### 56. Per-row schema rendering rules

**Rendering · Integration · UI package · Effort M.** Related foundations: #53.

**Current support:** Array factories can create different nodes; component/layout selection for each row remains application code.

**Proposed addition:** Resolve renderer metadata per item value/index with stable identity and predictable updates when a discriminator changes. **Why here:** Supports heterogeneous order lines without rebuilding unaffected controls.

**Precedent:** react-jsonschema-form supports dynamic per-item UI schema functions. [57](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/dynamic-ui-schema-examples/)

### 57. Recursive schema references with lazy expansion

**Schema integration · Integration · Adapter · Effort L.** Related foundations: #52.

**Current support:** Applications can use factories for recursive structures; no schema-reference resolver is exported.

**Proposed addition:** Resolve reusable and recursive schema references lazily, distinguishing schema cycles from invalid cyclic data and limiting expansion. **Why here:** Enables tree editors while avoiding eager infinite node construction.

**Precedent:** react-jsonschema-form documents schema definitions and references. [58](https://rjsf-team.github.io/react-jsonschema-form/docs/usage/definitions/)

### 58. Client/server form action protocol

**Server integration · Integration · Adapter · Effort L.** Related foundations: #1, #9, #21, #28, #31.

**Current support:** onSubmit accepts arbitrary application handlers; error/result transport has no shared contract.

**Proposed addition:** Define request/result envelopes, server decoding and validation helpers, and client mapping against the submitted revision. **Why here:** Reduces duplication between server validation and client form feedback.

**Precedent:** Modular Forms historically integrated server actions; Formisch explicitly documents that this integration does not yet carry over. [52](https://formisch.dev/qwik/guides/migrate-from-modular-forms/), [34](https://superforms.rocks/concepts/files)

### 59. Progressively enhanced native submission

**Server integration · Integration · Adapter · Effort L.** Related foundations: #31, #58.

**Current support:** Current bindings are designed around client node state; a guaranteed no-JavaScript form action flow is not packaged.

**Proposed addition:** Provide an optional native-name/action/encoding contract with client enhancement and equivalent server validation behavior. **Why here:** Valuable for public forms that must work before hydration or with unavailable client code.

**Precedent:** React Router Form enhances native submission; Modular Forms documented a native fallback. [50](https://reactrouter.com/api/components/Form), [52](https://formisch.dev/qwik/guides/migrate-from-modular-forms/)

### 60. Upload progress and task lifecycle

**Transport · Integration · Helper · Effort L.** Related foundations: #19, #30.

**Current support:** Async submit handlers can upload files; progress and per-file tasks are application state.

**Proposed addition:** Provide a transport-neutral upload task interface for progress, cancellation, failures and mapping accepted files to server attachment IDs. **Why here:** Improves attachment-heavy forms without coupling the library to fetch or one storage vendor.

**Precedent:** Inertia exposes upload progress; Formwerk has basic upload handling. [28](https://inertiajs.com/docs/v2/the-basics/forms), [80](https://formwerk.dev/guides/fields/file-fields/)

### 61. Configurable submission concurrency

**Submission · API · Helper · Effort M.** Related foundations: #19, #25.

**Current support:** Concurrent calls to submit are rejected.

**Proposed addition:** Add explicit prevent or replace-latest policies, optionally a serialized queue with immutable payload snapshots, while retaining prevent as default. **Why here:** Supports deliberate repeated saves without hidden parallel writes.

**Precedent:** Superforms documents prevent, allow and abort multiple-submit policies; a queue would be our extension. [33](https://superforms.rocks/concepts/submit-behavior)

### 62. Delayed submitting and timeout presentation

**Submission UX · Composition · Helper · Effort S.** Related foundations: #19, #25.

**Current support:** submitting is immediately observable; consumers implement delayed spinners and long-wait notices.

**Proposed addition:** Expose configurable delayed and long-running signals scoped to an attempt, clearing them on settlement or cancellation. **Why here:** Avoids flashing spinners while still explaining slow requests.

**Precedent:** Superforms exposes loading timers; a timeout indicator does not itself cancel a request. [32](https://superforms.rocks/concepts/timers)

### 63. Browser-history form restoration

**Persistence · Integration · Adapter · Effort M.** Related foundations: #13, #16.

**Current support:** Values can be saved manually; no route-entry-scoped restoration contract ships.

**Proposed addition:** Restore a checkpoint keyed to a specific history entry, including selected step and supported interaction state, with record/schema compatibility checks. **Why here:** Makes Back/Forward navigation preserve the right draft instead of one global latest copy.

**Precedent:** Superforms snapshots integrate with navigation; Inertia can remember keyed form state. [30](https://superforms.rocks/concepts/snapshots), [28](https://inertiajs.com/docs/v2/the-basics/forms)

### 64. Draft schema versioning and migration

**Persistence · Integration · Helper · Effort M.** Related foundations: #15.

**Current support:** No persistence layer or schema evolution contract exists.

**Proposed addition:** Version stored drafts and run explicit migration/discard logic before restoration, keeping an untouched backup until acceptance. **Why here:** Prevents deployments from breaking or misreading users' saved drafts.

**Precedent:** React Form Autosave documents schema versions and migrations; maturity remains unverified. [45](https://github.com/686f6c61/react-form-autosave)

### 65. Cross-tab draft synchronization with conflicts

**Persistence · Integration · Helper · Effort L.** Related foundations: #4, #15, #64.

**Current support:** Each form instance is independent; cross-tab coordination is application code.

**Proposed addition:** Exchange draft revisions across tabs, suppress echo loops and surface concurrent edits instead of automatically overwriting changed fields. **Why here:** Useful for long-running administrative sessions opened in several tabs.

**Precedent:** React Form Autosave documents cross-tab synchronization; conflict handling here is our proposed extension. [45](https://github.com/686f6c61/react-form-autosave)

### 66. Offline submission outbox

**Persistence · Integration · Helper · Effort L.** Related foundations: #15, #19, #25, #31.

**Current support:** An offline request failure remains the application's responsibility.

**Proposed addition:** Persist explicit submissions, retry in a controlled order after reconnection, and expose queued/conflicted items with server idempotency integration. **Why here:** Useful for field-work applications, but adds substantial storage and backend coordination costs.

**Precedent:** Form.io's licensed offline module provides a persistent request queue. [67](https://help.form.io/developers/offline-mode)

### 67. Changes since the last submission

**State · Composition · Helper · Effort S.** Related foundations: #17, #25.

**Current support:** submitted and dirty exist; neither compares current values with the payload of the last attempt.

**Proposed addition:** Track a separately named last-attempt snapshot and expose changed paths since that attempt, without confusing it with the last successful-save baseline. **Why here:** Supports retry messaging and deciding whether a displayed rejection still describes current input.

**Precedent:** Final Form exposes dirtySinceLastSubmit and per-field variants. [18](https://final-form.org/docs/final-form/types/FormState)

### 68. Active and visited field state

**Interaction · API · Adapter · Effort M.** Independent starting point.

**Current support:** touched is available; focus() performs an action but there is no shared active-node or visited-field signal.

**Proposed addition:** Track the active bound control/node and first-visit state, including multiple bindings and custom control focus boundaries. **Why here:** Enables contextual help and analytics hooks without treating focus as an edit.

**Precedent:** Final Form exposes active and visited field information. [18](https://final-form.org/docs/final-form/types/FormState)

### 69. Virtualized-form reveal and focus adapter

**Accessibility · Composition · Adapter · Effort M.** Related foundations: #18.

**Current support:** Nodes survive unmounting and arrays preserve identity; offscreen controls cannot be focused until rendered.

**Proposed addition:** Provide a reveal contract that scrolls/materializes the target row, waits for its binding and then focuses it with cancellation. **Why here:** Completes error navigation for large tables without introducing DOM-dependent node lifetime.

**Precedent:** React Hook Form publishes virtualized-list integration examples; reveal coordination is our proposed packaged addition. [15](https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/advanced-usage.mdx)

### 70. Logical validator combinators

**Validation · Composition · Helper · Effort M.** Related foundations: #36.

**Current support:** Multiple validators compose conjunctively; arbitrary alternatives require a custom rule.

**Proposed addition:** Provide typed any/all/not composition with clear nested errors, async short-circuiting and cancellation semantics. **Why here:** Expresses alternate acceptable inputs without repeatedly rebuilding validator orchestration.

**Precedent:** Vuelidate provides or, and and not combinators. [25](https://vuelidate-next.netlify.app/validators)

### 71. Cross-field cardinality validators

**Validation · Composition · Helper · Effort S.** Related foundations: #29.

**Current support:** requiredIf and custom group validators exist; no reusable at-least/exactly/at-most selection rule ships.

**Proposed addition:** Validate how many chosen sibling paths are filled or selected, with explicit empty-value rules and targeted feedback. **Why here:** Covers contact-method requirements and mutually exclusive choices with one reusable family.

**Precedent:** jQuery Validation includes require_from_group. [64](https://raw.githubusercontent.com/jquery-validation/jquery-validation/master/src/additional/require_from_group.js)

### 72. Numeric step and multiple-of validation

**Validation · API · Core · Effort S.** Independent starting point.

**Current support:** min/max/integer exist; no step or multiple-of validator and matching node constraint is exported.

**Proposed addition:** Add decimal-aware step validation with an explicit base and compatible native step synchronization. **Why here:** Covers prices, booking intervals and quantity increments without ad hoc floating-point checks.

**Precedent:** jQuery Validation implements step validation. [65](https://raw.githubusercontent.com/jquery-validation/jquery-validation/master/src/core.js)

### 73. File acceptance validator family

**Validation · Integration · Helper · Effort M.** Related foundations: #30.

**Current support:** Custom validators can inspect File values; reusable file policies are not exported.

**Proposed addition:** Validate individual and total size, count and accepted types with structured parameters and clear server-validation parity. **Why here:** Provides consistent attachment errors while keeping browser accept attributes as selection hints.

**Precedent:** Superforms demonstrates file-size schema validation; Formwerk supports file constraints. [34](https://superforms.rocks/concepts/files), [80](https://formwerk.dev/guides/fields/file-fields/)

### 74. Maintained locale message packs

**Localization · Integration · Adapter · Effort M.** Independent starting point.

**Current support:** Reactive localization, message catalogs and overrides already exist; consumers supply translations.

**Proposed addition:** Publish optional, individually importable translations for built-in error kinds with parameter-aware messages and fallback rules. **Why here:** Reduces setup for multilingual applications without changing the existing catalog API.

**Precedent:** FormKit ships locale message support. [42](https://formkit.com/essentials/internationalization)

### 75. Serializable conditional-rule interpreter

**Schema integration · Integration · Adapter · Effort L.** Related foundations: #29, #47.

**Current support:** Reactive required/hidden/disabled conditions already work in TypeScript.

**Proposed addition:** Interpret a bounded declarative rule language over node paths, with registered operations and diagnostics rather than arbitrary script execution. **Why here:** Allows server-provided form policies without shipping executable application code in schemas.

**Precedent:** JSON Forms defines declarative SHOW/HIDE/ENABLE/DISABLE rules. [53](https://jsonforms.io/docs/uischema/rules/)

### 76. Schema and expression diagnostics

**Developer tools · Integration · Tool · Effort M.** Related foundations: #52, #75.

**Current support:** TypeScript checks authored APIs; runtime schemas and expressions have no dedicated diagnostic pass.

**Proposed addition:** Report unknown references, unsupported constructs, impossible conditions and rule cycles before rendering, with paths back to the definition. **Why here:** Makes metadata-driven forms debuggable instead of silently incomplete.

**Precedent:** SurveyJS documents expression validation and its newer linter integration. [69](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic), [68](https://surveyjs.io/form-library/documentation/api-reference/choicesrestful)

### 77. Validation execution trace and profiler

**Developer tools · Integration · Tool · Effort M.** Related foundations: #12.

**Current support:** Tests can count validator runs; no consumer-facing causal timeline or duration view ships.

**Proposed addition:** Record opt-in rule start/stop/cancel events and triggering node revisions, with redacted data and a bounded development-only buffer. **Why here:** Explains repeated requests, cancellation storms and expensive cross-field dependencies.

**Precedent:** React Hook Form DevTools establishes inspector precedent; detailed causal profiling is an inferred extension, not a claimed RHF feature. [13](https://github.com/react-hook-form/devtools)

### 78. Reusable field presentation wrappers

**Rendering · Integration · UI package · Effort M.** Related foundations: #44, #53.

**Current support:** CVA pass-through supports binding composition; it does not generate label/help/error shells.

**Proposed addition:** Allow composable renderer wrappers for field chrome, descriptions and feedback with one accessibility contract. **Why here:** Makes generated forms fit an application's design system without duplicating each control implementation.

**Precedent:** Formly supports custom field wrappers. [60](https://formly.dev/docs/guide/custom-formly-wrapper/)

### 79. Named schema presentation presets

**Rendering · Integration · UI package · Effort S.** Related foundations: #53, #78.

**Current support:** Factories share node defaults; generated UI configuration has no reusable preset layer.

**Proposed addition:** Define overridable bundles of renderer, wrapper, layout and metadata choices, with a documented merge order. **Why here:** Avoids repeated configuration for recurring concepts such as postal addresses and money fields.

**Precedent:** Formly's core configuration includes presets. [61](https://formly.dev/docs/api/core/)

### 80. Schema-driven option labels

**Rendering · Integration · Adapter · Effort S.** Related foundations: #42, #53.

**Current support:** oneOf validates membership; value-to-label option rendering is supplied by applications.

**Proposed addition:** Map schema enums or const/title alternatives into typed option values and display labels with translation hooks. **Why here:** Keeps machine values stable while giving generated selects understandable labels.

**Precedent:** JSON Forms documents enum and oneOf label behavior. [56](https://jsonforms.io/docs/labels/)

## Ranks 81–100: specialized or exploratory

### 81. URL query parameter binding

**Transport · Integration · Adapter · Effort M.** Related foundations: #29.

**Current support:** Applications can manually patch nodes from router state; no canonical URL synchronization helper ships.

**Proposed addition:** Encode filter nodes into query parameters with defaults, repeated values and replace-versus-push policy; restore on navigation without loops. **Why here:** Makes search/filter forms shareable and compatible with browser history.

**Precedent:** React Router Form supports GET submissions that serialize to the URL. [50](https://reactrouter.com/api/components/Form)

### 82. Locale-aware number and currency control adapter

**Controls · Integration · Adapter · Effort M.** Related foundations: #5.

**Current support:** Native numeric parsing is supported; locale-specific separators and formatting are custom control concerns.

**Proposed addition:** Provide an optional Intl-based adapter with explicit minor-unit scaling, caret behavior and incomplete-input handling. **Why here:** Useful for international business forms, although existing UI libraries may already supply an adequate component.

**Precedent:** Formwerk provides formatted and localized number fields. [79](https://formwerk.dev/guides/fields/number-fields/)

### 83. Input masks with separate raw values

**Controls · Integration · Adapter · Effort L.** Related foundations: #5.

**Current support:** Consumers can bind mask-capable CVAs; no maintained mask adapter/policy ships.

**Proposed addition:** Integrate an external mask engine while preserving raw model values, partial input, caret position and parse feedback. **Why here:** Helps phone and identifier entry; best kept optional because masking behavior is complex.

**Precedent:** FormKit Pro provides a mask input. [41](https://formkit.com/inputs/mask)

### 84. Segmented date and time control adapter

**Controls · Integration · Adapter · Effort L.** Related foundations: #5, #44.

**Current support:** Native date/time parsing and CVA interoperability exist; no segmented locale-aware interaction layer ships.

**Proposed addition:** Offer an optional adapter contract for segmented controls with explicit calendar/date/time representation and incomplete-segment errors. **Why here:** Useful for design systems needing richer input than native controls; representation policy must precede implementation.

**Precedent:** Formwerk lists dedicated date and time field composables. [78](https://formwerk.dev/guides/composables/)

### 85. Checkbox-group binding to one collection field

**Controls · API · Adapter · Effort M.** Independent starting point.

**Current support:** A native checkbox maps to a boolean; multiple-select maps to a collection, but checkbox collection toggling is not packaged.

**Proposed addition:** Bind several checkboxes to one typed collection with per-option identity, disabled-state and touched/dirty semantics. **Why here:** Covers permission and preference lists without creating one boolean node per option.

**Precedent:** Formwerk provides checkbox groups selecting multiple items. [78](https://formwerk.dev/guides/composables/)

### 86. Headless searchable combobox integration

**Controls · Integration · Adapter · Effort L.** Related foundations: #5, #44, #50.

**Current support:** Existing CVAs and custom controls can bind; the library ships no combobox interaction helper.

**Proposed addition:** Provide an optional contract for query text, selected value, active option, keyboard selection and async choices as separate states. **Why here:** Useful for reusable design-system controls, but lower priority because mature component libraries already solve much of it.

**Precedent:** Formwerk provides combobox composables. [78](https://formwerk.dev/guides/composables/)

### 87. One-time-password input adapter

**Controls · Integration · Adapter · Effort M.** Related foundations: #44.

**Current support:** An OTP component can use a CVA; no dedicated multi-cell binding contract ships.

**Proposed addition:** Coordinate cell focus, paste distribution, autofill and one committed code value, with one logical touch/error boundary. **Why here:** Removes repeated edge cases in authentication controls while remaining outside the core.

**Precedent:** Formwerk includes OTP field composables. [78](https://formwerk.dev/guides/composables/)

### 88. File dropzone and preview lifecycle helper

**Controls · Integration · UI package · Effort M.** Related foundations: #30, #73.

**Current support:** Generic CVA integration can wrap a dropzone; no file preview ownership helper exists.

**Proposed addition:** Unify drop and picker selection, validate before preview, and manage object-URL creation/disposal as files are removed or rebound. **Why here:** Avoids memory leaks and inconsistent attachment interactions.

**Precedent:** Formwerk supports dropzones and automatic image/video previews. [80](https://formwerk.dev/guides/fields/file-fields/)

### 89. Multi-thumb range control adapter

**Controls · Integration · Adapter · Effort M.** Related foundations: #44.

**Current support:** Native single-value range controls work; tuple-valued thumb interaction is supplied by custom components.

**Proposed addition:** Define a tuple-valued adapter with ordered bounds, per-thumb focus and one field-level interaction/error contract. **Why here:** Useful for price and availability ranges, with modest relevance to the state-library core.

**Precedent:** Formwerk describes sliders selecting one or more range values. [78](https://formwerk.dev/guides/composables/)

### 90. Accessible repeatable-row editor helpers

**Rendering · Composition · UI package · Effort M.** Related foundations: #44.

**Current support:** Array add/remove/move/swap and a reorderable-array recipe already exist.

**Proposed addition:** Package row action bindings, focus after add/remove and keyboard/live-region announcements around existing array operations. **Why here:** Reduces repetitive accessible UI work without pretending array reordering is missing.

**Precedent:** FormKit's repeater provides row editing UI; our proposed emphasis is headless accessibility helpers. [44](https://formkit.com/inputs/repeater)

### 91. Branching wizard navigation graph

**Workflow · Composition · Helper · Effort L.** Related foundations: #13, #75.

**Current support:** A linear multi-step recipe exists; callers compute every branch and back-navigation decision.

**Proposed addition:** Extend a wizard with conditional edges, visited-route history and explicit handling when earlier answers invalidate the current route. **Why here:** Useful for onboarding and eligibility interviews, but excessive for most ordinary forms.

**Precedent:** SurveyJS documents conditional skip logic. [70](https://surveyjs.io/survey-creator/documentation/end-user-guide/skip-logic-in-forms)

### 92. Completion and progress model

**Workflow · Composition · Helper · Effort M.** Related foundations: #47.

**Current support:** validity and interaction signals exist; an empty optional field can be valid without being answered.

**Proposed addition:** Define answered/completed states and weighted progress over participating fields or steps, with configurable empty-value semantics. **Why here:** Supports long-form progress indicators without conflating completion with validation success.

**Precedent:** FormKit exposes a completion state; aggregate weighted progress is our proposed extension. [43](https://formkit.com/essentials/styling)

### 93. Matrix and spreadsheet-style question adapter

**Specialized UI · Integration · UI package · Effort L.** Related foundations: #53, #69.

**Current support:** Nested forms/arrays can represent cells; there is no matrix interaction or column-schema helper.

**Proposed addition:** Build an optional row/column renderer with cell validation navigation, column metadata and accessible keyboard traversal. **Why here:** Relevant to assessments and bulk administrative entry, but too specialized for default exports.

**Precedent:** SurveyJS provides matrix table questions. [71](https://surveyjs.io/form-library/documentation/api-reference/matrix-table-with-dropdown-list)

### 94. Ranking question adapter

**Specialized UI · Integration · UI package · Effort M.** Related foundations: #44, #90.

**Current support:** Arrays can reorder values; ranking options and selection constraints are application UI.

**Proposed addition:** Represent a ranked subset of named choices with keyboard reordering, labels and completion rules. **Why here:** Useful for surveys and preference collection; does not justify changing array semantics.

**Precedent:** SurveyJS provides ranking questions with selectable choice metadata. [72](https://surveyjs.io/form-library/examples/add-ranking-question-to-form/documentation)

### 95. Signature capture adapter

**Specialized UI · Integration · Adapter · Effort M.** Related foundations: #44.

**Current support:** Rich atomic values and custom controls can hold a signature; no capture adapter is provided.

**Proposed addition:** Integrate a maintained signature canvas with explicit empty/reset/export behavior and resource cleanup. **Why here:** Useful in a narrow class of workflows; capturing an image alone makes no claim about signature assurance.

**Precedent:** SurveyJS includes a signature-pad question with image export formats. [73](https://surveyjs.io/form-library/examples/signature-pad-widget-javascript/documentation)

### 96. Read-only review rendering

**Rendering · Integration · UI package · Effort M.** Related foundations: #47, #53, #80.

**Current support:** readonly state and direct value reads exist; applications author their own human-readable summaries.

**Proposed addition:** Render labeled values, option titles and grouped review sections without mounting disabled input widgets, with links back to editable fields. **Why here:** Provides a reusable confirmation screen; it should consume values without changing node interaction or validation state.

**Precedent:** SurveyJS demonstrates a consolidated read-only review mode. [74](https://surveyjs.io/form-library/examples/review-mode-for-quiz-results/documentation)

### 97. Printable and PDF form export

**Specialized output · Integration · UI package · Effort L.** Related foundations: #47, #54, #96.

**Current support:** Consumers can serialize values but no document renderer ships.

**Proposed addition:** Offer a separate bridge from labels, layout and values to a print/PDF engine, documenting differences from interactive browser layout. **Why here:** Useful for records and sharing, but a substantial adjacent product with its own rendering costs.

**Precedent:** SurveyJS PDF Generator exports editable or read-only documents and is a separate commercial product. [75](https://surveyjs.io/pdf-generator/documentation/overview)

### 98. Quiz scoring separate from validation

**Specialized workflow · Composition · Helper · Effort M.** Related foundations: #47.

**Current support:** Custom validators can identify wrong answers, but they would incorrectly make acceptable quiz responses invalid.

**Proposed addition:** Provide optional answer-key/scoring metadata and result aggregation independent of form validity and submission gates. **Why here:** Useful for assessments only; avoid encoding correctness as a blocking validation error.

**Precedent:** SurveyJS demonstrates weighted quiz scoring using answer metadata and application calculations. [76](https://surveyjs.io/form-library/examples/create-a-scored-quiz/documentation)

### 99. Visual form designer

**Developer tools · Integration · Tool · Effort L.** Related foundations: #52, #53, #54, #76.

**Current support:** Forms are authored in TypeScript and templates; no drag-and-drop schema editor exists.

**Proposed addition:** Build a separate designer with a constrained schema editor, preview and import/export, only after a renderer/schema contract stabilizes. **Why here:** Could serve non-developer teams, but would create a new product and should be demand-led.

**Precedent:** SurveyJS Survey Creator offers visual form authoring. [77](https://surveyjs.io/survey-creator/documentation/creator-v2-whats-new)

### 100. Experimental WebMCP form integration

**Automation · Integration · Adapter · Effort L.** Related foundations: #1, #24, #47.

**Current support:** No public adapter exposes a form as an agent-callable browser tool.

**Proposed addition:** Explore an explicitly enabled integration using declared schemas, bounded field access and the existing submit pipeline; expose validation failures as structured results. **Why here:** Potentially useful later, but experimental browser/platform dependence makes it the lowest-priority item.

**Precedent:** Angular 22.1.6 contains experimental form WebMCP registration and tests. [6](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/src/webmcp/registration.ts)

## Design boundaries before implementation

The most important open decisions concern behavior, not option names. These are proposed acceptance criteria for later implementation, not verified results.

| Area | Decisions and observable transitions to cover |
| --- | --- |
| Saved baseline (#2–4, #17) | Editing A→B→A clears changed state while dirty can remain true. A programmatic patch may make changed true without marking dirty. Accepting a saved revision must preserve newer local edits. Arrays need defined move/removal semantics. Hidden/disabled values remain data and must not disappear from a saved-data comparison by accident. |
| Schema bridge (#1, #42) | Validate leaf and root forms, nested arrays, empty/null values, unknown paths, changing schemas and stale async results. Preserve underlying library errors alongside schema errors. Keep issue paths attached to the correct current row. Do not assume every Standard Schema implementation exposes inspectable constraints or that validation must replace the model with transformed output. |
| Codecs (#5) | Incomplete text can be visible while committed data remains the last successfully parsed model value. Parse errors must clear on correction/reset/rebinding. Test IME composition, blur, debounce and server patches during pending input. Control type and model type must remain independently inferable. |
| Validation scheduling (#6, #10, #22, #35, #39) | Specify triggers and exact invocation counts, validation revision ownership, external reactive dependency changes, cancellation and detachment. A submit waiting on revision A must not silently submit revision B. Presentation policy alone must not suppress validity computation. Scheduling that differs from always-reactive behavior must be opt-in and documented. |
| Public batching (#7) | Define callback visibility during the block, final callback count, reentrant mutations, nested batches and exceptions. Batching does not imply rollback or asynchronous transactions. |
| Warnings/error sources (#8, #9, #23) | Warning-only forms remain submittable. Disposing one source must preserve another source's errors. Backend path adapters must account for reordering while requests are pending and surface unmatched paths rather than discarding them silently. |
| Checkpoints/history (#16, #40, #41) | Distinguish in-memory snapshots from serializable drafts. Do not serialize functions, injectors, DOM hosts, subscriptions or in-flight work. Define support for Date, File, custom classes and dynamic schemas. Restore derived validation by recomputation with stale work cancelled. |
| Save lifecycle (#14, #19, #25, #61) | Cancellation is distinct from validation rejection and transport failure. Only an acknowledged payload can become the saved baseline. Concurrent submissions retain the existing rejection policy unless another policy is requested explicitly. |
| Wizard/accessibility (#13, #18, #44, #69) | Validate the relevant step without losing offscreen data. Resolve errors to the current step/row identity, reveal the host, then focus after binding. Preserve consumer ARIA relationships and cancel navigation if its target disappears. |
| Extension ownership (#47–48) | Core declarations and explicitly triggered validation must work outside injection contexts. Optional injector ownership and binding/inherited leases must preserve current precedence, release and garbage-collection rules. Plugins cannot keep detached form trees alive indefinitely. |

The Angular state and submission references above are the starting authority for these decisions. Form Nodes can have different signatures and deliberate optional workflows; differences in state or propagation require explicit documentation and public field/form tests before shipping.

## Suggested investment sequence

1. **Saved-data foundation:** design #2–4 together, using #17 to exercise array and partial-save semantics. Do not overload dirty or change resetToInitial implicitly.
2. **Validation interoperability:** implement #1 as an optional adapter, then design #10 and #11. Keep schema validation, model conversion and submission transformation separate contracts.
3. **Useful workflows:** package #13 and #18, then build #14 on explicit cancellation and outcome state (#19, #25). Add persistence only after snapshot scope is clear.
4. **Integration foundations:** evaluate #29, #30, #31 and #47 against real consuming applications. Add metadata/plugin surface only when at least two concrete integrations need it.
5. **Demand-led expansion:** generated rendering, offline synchronization, specialist controls, designers and WebMCP should require a concrete adopter. Rank is a usefulness estimate, not a mandate to maintain every feature.

Several entries intentionally share foundations while producing different user outcomes: checkpoints restore one moment; undo/redo manages a sequence; a staged editor isolates changes before applying them. Validation triggers decide when work runs; revalidation changes the trigger by phase; visibility decides what the user sees. A codec transforms control input; a submit projection changes the outgoing DTO. A plain wizard manages steps; a branching graph manages conditional routes. These should share implementation where appropriate, rather than becoming duplicate engines.

## Evidence limits

Absence claims apply to the audited **3.7.0 public package and maintained helpers**, not to what a consumer could build with arbitrary TypeScript, signals, CVAs or a third-party component. The source audit is broader than the focused baseline test run, and competitors were not installed and benchmarked. The references establish documented precedents, not verified compatibility with Form Nodes.

The small React Form Autosave repository supports three lower-confidence persistence/history precedents (#41, #64, #65); these are design ideas, not a recommendation to adopt that dependency. Modular Forms is in maintenance mode and Formisch explicitly changes some semantics. Versioned VeeValidate v4, Inertia v2 and Survey Creator v2 references are retained as identified precedents, not represented as latest releases. Commercial and experimental capabilities are labeled in their entries or sources.

## Sources

Source numbers link directly to the relevant documentation or maintainer source. All were consulted for this research on 11 September 2026; no publication date is inferred for undated documentation.

1. [Angular 22.1.6: Standard Schema implementation](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/src/api/rules/validation/standard_schema.ts). Pinned release implementation; sync/async execution and issue targeting.
2. [Angular 22.1.6: Standard Schema tests](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/test/node/api/validators/standard_schema.spec.ts). Pinned tests; reactive schemas, nested paths, mixed validation and empty values.
3. [Angular 22.1.6: field state](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/src/field/state.ts). Pinned implementation; interaction and aggregate state authority.
4. [Angular 22.1.6: submission tests](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/test/node/submit.spec.ts). Pinned tests; gating, pending work, interaction and submission errors.
5. [Angular 22.1.6: metadata rules](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/src/api/rules/metadata.ts). Pinned public metadata mechanism; accompanying tests in test/node/api/metadata.spec.ts.
6. [Angular 22.1.6: WebMCP registration](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/src/webmcp/registration.ts). Experimental API despite its presence in a stable Angular release; accompanying tests in test/web/webmcp.spec.ts.
7. [TanStack Form: validation](https://tanstack.com/form/latest/docs/framework/react/guides/validation). Official documentation; unversioned unless indicated.
8. [TanStack Form: dynamic validation](https://tanstack.com/form/latest/docs/framework/react/guides/dynamic-validation). Official documentation; unversioned unless indicated.
9. [TanStack Form: submission handling](https://tanstack.com/form/latest/docs/framework/react/guides/submission-handling). Official documentation; unversioned unless indicated.
10. [React Hook Form: formState](https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/docs/useform/formstate.mdx). Official documentation source; live master, not a release pin.
11. [React Hook Form: reset](https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/docs/useform/reset.mdx). Official documentation source; live master, not a release pin.
12. [React Hook Form: useForm](https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/docs/useform.mdx). Official documentation source; live master, not a release pin.
13. [React Hook Form DevTools](https://github.com/react-hook-form/devtools). Official companion tool; README/API evidence.
14. [React Hook Form Lenses](https://github.com/react-hook-form/lenses). Official companion package; README/API evidence.
15. [React Hook Form: advanced usage](https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/advanced-usage.mdx). Official recipes, including virtualization; not a built-in virtualization engine.
16. [Final Form: FormApi](https://final-form.org/docs/final-form/types/FormApi). Official documentation; unversioned unless indicated.
17. [Final Form: Config](https://final-form.org/docs/final-form/types/Config). Official documentation; unversioned unless indicated.
18. [Final Form: FormState](https://final-form.org/docs/final-form/types/FormState). Official documentation; unversioned unless indicated.
19. [React Final Form: examples](https://final-form.org/docs/react-final-form/examples). Official recipes; autosave and warnings are examples, not promises about core APIs.
20. [Final Form Calculate](https://github.com/final-form/final-form-calculate). Companion decorator; declarative calculations.
21. [Mantine: form values](https://mantine.dev/form/values/). Official documentation; unversioned unless indicated.
22. [VeeValidate v4: handling forms](https://vee-validate.logaretm.com/v4/guide/composition-api/handling-forms). Versioned v4 reference; not represented as the newest major.
23. [VeeValidate v5: useForm](https://vee-validate.logaretm.com/v5/api/use-form/). Versioned v5 API reference.
24. [Vuelidate: advanced usage](https://vuelidate-next.netlify.app/advanced_usage). Official documentation; unversioned unless indicated.
25. [Vuelidate: validators](https://vuelidate-next.netlify.app/validators). Official documentation; unversioned unless indicated.
26. [Felte: validation](https://felte.dev/docs/svelte/validation). Svelte documentation; separate warning validation is explicit.
27. [Ant Design: Form](https://ant.design/components/form/). Official documentation; unversioned unless indicated.
28. [Inertia v2: forms](https://inertiajs.com/docs/v2/the-basics/forms). Versioned v2 reference; newer documentation exists, so this is not a latest-version claim.
29. [Superforms v2: proxy objects](https://superforms.rocks/concepts/proxy-objects). Official documentation; unversioned unless indicated.
30. [Superforms v2: snapshots](https://superforms.rocks/concepts/snapshots). Official documentation; unversioned unless indicated.
31. [Superforms v2: tainted fields](https://superforms.rocks/concepts/tainted). Official documentation; unversioned unless indicated.
32. [Superforms v2: loading timers](https://superforms.rocks/concepts/timers). Official documentation; unversioned unless indicated.
33. [Superforms v2: submit behavior](https://superforms.rocks/concepts/submit-behavior). Official documentation; unversioned unless indicated.
34. [Superforms v2: file uploads](https://superforms.rocks/concepts/files). Official documentation; unversioned unless indicated.
35. [FormKit: local storage plugin](https://formkit.com/plugins/local-storage). Official plugin; persisted drafts and lifecycle options.
36. [FormKit: multi-step plugin](https://formkit.com/plugins/multi-step). Official @formkit/addons plugin; navigation helpers and step guards.
37. [FormKit: validation](https://formkit.com/essentials/validation). Official documentation; unversioned unless indicated.
38. [FormKit: architecture](https://formkit.com/essentials/architecture). Official documentation; unversioned unless indicated.
39. [FormKit: schema](https://formkit.com/essentials/schema). Official documentation; unversioned unless indicated.
40. [FormKit: file input](https://formkit.com/inputs/file). Official documentation; unversioned unless indicated.
41. [FormKit: mask input](https://formkit.com/inputs/mask). FormKit Pro component; commercial reference, not a dependency recommendation.
42. [FormKit: internationalization](https://formkit.com/essentials/internationalization). Official documentation; unversioned unless indicated.
43. [FormKit: styling and completion state](https://formkit.com/essentials/styling). Official documentation; unversioned unless indicated.
44. [FormKit: repeater](https://formkit.com/inputs/repeater). UI component reference; Form Nodes already provides array mutations.
45. [React Form Autosave](https://github.com/686f6c61/react-form-autosave). Small community helper. README evidence only; maintenance, reliability and adoption were not independently established.
46. [Ember Changeset](https://github.com/adopted-ember-addons/ember-changeset). Maintainer repository; staged changes, execution, rollback and snapshots.
47. [Conform: intent buttons](https://conform.guide/intent-button). Official documentation; unversioned unless indicated.
48. [Conform: accessibility](https://conform.guide/accessibility). Official documentation; unversioned unless indicated.
49. [React Spectrum: Form](https://react-spectrum.adobe.com/v3/Form.html). Versioned v3 component reference; native versus ARIA validation behavior.
50. [React Router: Form](https://reactrouter.com/api/components/Form). Adjacent router integration, not a dedicated form state library.
51. [Modular Forms: Field](https://modularforms.dev/react/api/Field). Maintenance-mode predecessor of Formisch; used as a historical API precedent.
52. [Formisch: migration from Modular Forms](https://formisch.dev/qwik/guides/migrate-from-modular-forms/). Official successor documentation; explicitly records changed and removed semantics.
53. [JSON Forms: UI schema rules](https://jsonforms.io/docs/uischema/rules/). Official documentation; unversioned unless indicated.
54. [JSON Forms: renderer sets](https://jsonforms.io/docs/renderer-sets/). Official documentation; unversioned unless indicated.
55. [JSON Forms: layouts](https://jsonforms.io/docs/uischema/layouts/). Official documentation; unversioned unless indicated.
56. [JSON Forms: labels](https://jsonforms.io/docs/labels/). Official documentation; unversioned unless indicated.
57. [react-jsonschema-form: dynamic UI schema](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/dynamic-ui-schema-examples/). Official documentation; unversioned unless indicated.
58. [react-jsonschema-form: definitions and references](https://rjsf-team.github.io/react-jsonschema-form/docs/usage/definitions/). Official documentation; unversioned unless indicated.
59. [Formly: JSON Schema](https://formly.dev/docs/guide/json-schema/). Official documentation; unversioned unless indicated.
60. [Formly: custom wrappers](https://formly.dev/docs/guide/custom-formly-wrapper/). Official documentation; unversioned unless indicated.
61. [Formly: core API](https://formly.dev/docs/api/core/). Official documentation; unversioned unless indicated.
62. [MobX Formkit: interceptor implementation](https://raw.githubusercontent.com/foxhound87/mobx-formkit/master/src/Base.ts). Maintainer source for the successor of MobX React Form; live master, not a release pin.
63. [Parsley: documentation](https://parsleyjs.org/doc/). jQuery ecosystem; validation groups and priority policy.
64. [jQuery Validation: require_from_group implementation](https://raw.githubusercontent.com/jquery-validation/jquery-validation/master/src/additional/require_from_group.js). Official validator source; minimum populated-field count in a configured group.
65. [jQuery Validation: core validator implementation](https://raw.githubusercontent.com/jquery-validation/jquery-validation/master/src/core.js). Official source; step validation, deferred submission, and reuse of matching remote-validation results.
66. [jQuery Validation: normalizer](https://jquery-validation.github.io/normalizer/). Official documentation; unversioned unless indicated.
67. [Form.io: offline mode](https://help.form.io/developers/offline-mode). Licensed module; persistent request queue. Inspiration only, not a licensing or purchasing recommendation.
68. [SurveyJS: RESTful choices](https://surveyjs.io/form-library/documentation/api-reference/choicesrestful). Official documentation; unversioned unless indicated.
69. [SurveyJS: conditional logic](https://surveyjs.io/form-library/documentation/design-survey/conditional-logic). Official documentation; unversioned unless indicated.
70. [SurveyJS: skip logic](https://surveyjs.io/survey-creator/documentation/end-user-guide/skip-logic-in-forms). Official documentation; unversioned unless indicated.
71. [SurveyJS: matrix table](https://surveyjs.io/form-library/documentation/api-reference/matrix-table-with-dropdown-list). Official documentation; unversioned unless indicated.
72. [SurveyJS: ranking question](https://surveyjs.io/form-library/examples/add-ranking-question-to-form/documentation). Official documentation; unversioned unless indicated.
73. [SurveyJS: signature pad](https://surveyjs.io/form-library/examples/signature-pad-widget-javascript/documentation). Official documentation; unversioned unless indicated.
74. [SurveyJS: review mode](https://surveyjs.io/form-library/examples/review-mode-for-quiz-results/documentation). Official example; review layout and read-only presentation.
75. [SurveyJS: PDF Generator overview](https://surveyjs.io/pdf-generator/documentation/overview). Separate commercial product; export capability only, no legal-signature claims relied on.
76. [SurveyJS: scored quiz](https://surveyjs.io/form-library/examples/create-a-scored-quiz/documentation). Official example; weighted scoring includes application code.
77. [SurveyJS: Survey Creator v2 overview](https://surveyjs.io/survey-creator/documentation/creator-v2-whats-new). Historical v2 product reference; visual builder, distinct from the headless state library.
78. [Formwerk: composables](https://formwerk.dev/guides/composables/). Vue headless control catalog; high-level capability evidence, not a compatibility test.
79. [Formwerk: number fields](https://formwerk.dev/guides/fields/number-fields/). Official documentation; unversioned unless indicated.
80. [Formwerk: file fields](https://formwerk.dev/guides/fields/file-fields/). Official documentation; unversioned unless indicated.
81. [Superforms v2: nested data](https://superforms.rocks/concepts/nested-data). Documents nested transport and the distinction between JSON data and browser FormData.
82. [Angular 22.1.6: field node tests](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/test/node/field_node.spec.ts). Pinned tests; reset and interaction state cases.
83. [Angular 22.1.6: submission state](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/src/field/submit.ts). Pinned implementation; submission-error lifetime and submitting state.
84. [Angular 22.1.6: metadata tests](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/test/node/api/metadata.spec.ts). Pinned reducer tests.
85. [Angular 22.1.6: WebMCP tests](https://github.com/angular/angular/blob/356adf749188d996a641181c56621a6285126f3c/packages/forms/signals/test/web/webmcp.spec.ts). Pinned tests; registration, inference failures, submission success and errors.
86. [MobX Formkit: project and migration](https://github.com/foxhound87/mobx-formkit). Maintainer README records the rename and deprecation of the legacy mobx-react-form package.
